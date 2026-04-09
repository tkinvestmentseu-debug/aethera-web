import {
  collection, doc, addDoc, setDoc, getDoc, getDocs, updateDoc,
  arrayUnion, arrayRemove, onSnapshot, query, orderBy, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase.config';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostEmoji: string;
  startTime: number;
  endTime: number;
  type: 'meditation' | 'ritual' | 'tarot' | 'meeting' | 'workshop' | 'astrology' | 'breathwork' | 'oracle';
  maxParticipants: number;
  participants: string[];
  participantNames: string[];
  inviteCode: string;
  isPrivate: boolean;
  coverEmoji: string;
  tags: string[];
  timezone: string;
  createdAt: number;
  status: 'upcoming' | 'live' | 'ended' | 'cancelled';
  chatRoomId?: string;
}

// ─── Private helpers ────────────────────────────────────────────────────────

function _randomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function _generateEventCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = _randomCode(6);
    const snap = await getDoc(doc(db, 'eventInviteCodes', code));
    if (!snap.exists()) return code;
  }
  return _randomCode(6);
}

function _computeStatus(startTime: number, endTime: number): CommunityEvent['status'] {
  const now = Date.now();
  if (now < startTime) return 'upcoming';
  if (now >= startTime && now <= endTime) return 'live';
  return 'ended';
}

function _docToEvent(id: string, data: Record<string, any>): CommunityEvent {
  return {
    id,
    title: data.title ?? '',
    description: data.description ?? '',
    hostId: data.hostId ?? '',
    hostName: data.hostName ?? '',
    hostEmoji: data.hostEmoji ?? '✨',
    startTime: data.startTime instanceof Timestamp ? data.startTime.toMillis() : (data.startTime ?? 0),
    endTime: data.endTime instanceof Timestamp ? data.endTime.toMillis() : (data.endTime ?? 0),
    type: data.type ?? 'meeting',
    maxParticipants: data.maxParticipants ?? 50,
    participants: data.participants ?? [],
    participantNames: data.participantNames ?? [],
    inviteCode: data.inviteCode ?? '',
    isPrivate: data.isPrivate ?? false,
    coverEmoji: data.coverEmoji ?? '🌟',
    tags: data.tags ?? [],
    timezone: data.timezone ?? 'Europe/Warsaw',
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : (data.createdAt ?? Date.now()),
    status: _computeStatus(
      data.startTime instanceof Timestamp ? data.startTime.toMillis() : (data.startTime ?? 0),
      data.endTime instanceof Timestamp ? data.endTime.toMillis() : (data.endTime ?? 0),
    ),
    chatRoomId: data.chatRoomId,
  };
}

// ─── EventsService ───────────────────────────────────────────────────────────

export const EventsService = {

  async createEvent(
    data: Omit<CommunityEvent, 'id' | 'inviteCode' | 'participants' | 'participantNames' | 'createdAt' | 'status'>,
  ): Promise<{ eventId: string; inviteCode: string }> {
    const inviteCode = await _generateEventCode();

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      hostId: data.hostId,
      hostName: data.hostName,
      hostEmoji: data.hostEmoji,
      startTime: data.startTime,
      endTime: data.endTime,
      type: data.type,
      maxParticipants: data.maxParticipants,
      participants: [data.hostId],
      participantNames: [data.hostName],
      inviteCode,
      isPrivate: data.isPrivate,
      coverEmoji: data.coverEmoji,
      tags: data.tags,
      timezone: data.timezone,
      createdAt: serverTimestamp(),
      status: _computeStatus(data.startTime, data.endTime),
      chatRoomId: data.chatRoomId ?? null,
    };

    const ref = await addDoc(collection(db, 'communityEvents'), payload);

    // Store invite code lookup
    await setDoc(doc(db, 'eventInviteCodes', inviteCode), {
      eventId: ref.id,
      createdAt: serverTimestamp(),
    });

    return { eventId: ref.id, inviteCode };
  },

  async joinEvent(eventId: string, user: { uid: string; displayName: string }): Promise<void> {
    const ref = doc(db, 'communityEvents', eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Record<string, any>;
    const participants: string[] = data.participants ?? [];
    if (participants.includes(user.uid)) return;
    if (participants.length >= (data.maxParticipants ?? 50)) return;
    await updateDoc(ref, {
      participants: arrayUnion(user.uid),
      participantNames: arrayUnion(user.displayName),
    });
  },

  async leaveEvent(eventId: string, userId: string): Promise<void> {
    const ref = doc(db, 'communityEvents', eventId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const data = snap.data() as Record<string, any>;
    const name = (data.participantNames ?? []).find(
      (_: string, i: number) => (data.participants ?? [])[i] === userId,
    ) ?? '';
    await updateDoc(ref, {
      participants: arrayRemove(userId),
      participantNames: arrayRemove(name),
    });
  },

  listenToUpcomingEvents(callback: (events: CommunityEvent[]) => void): () => void {
    // No isPrivate filter in query to avoid composite index requirement.
    // Filter client-side instead.
    const q = query(
      collection(db, 'communityEvents'),
      orderBy('startTime', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      const events: CommunityEvent[] = snap.docs
        .map(d => _docToEvent(d.id, d.data()))
        .filter(e => !e.isPrivate && e.status !== 'cancelled');
      callback(events);
    });
  },

  async getMyEvents(userId: string): Promise<CommunityEvent[]> {
    const q = query(
      collection(db, 'communityEvents'),
      where('participants', 'array-contains', userId),
      orderBy('startTime', 'asc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => _docToEvent(d.id, d.data()));
  },

  async joinByCode(
    code: string,
    user: { uid: string; displayName: string },
  ): Promise<{ success: boolean; eventId?: string; eventTitle?: string }> {
    const codeSnap = await getDoc(doc(db, 'eventInviteCodes', code.toUpperCase().trim()));
    if (!codeSnap.exists()) return { success: false };
    const { eventId } = codeSnap.data() as { eventId: string };
    const eventSnap = await getDoc(doc(db, 'communityEvents', eventId));
    if (!eventSnap.exists()) return { success: false };
    const eventData = eventSnap.data() as Record<string, any>;
    await EventsService.joinEvent(eventId, user);
    return { success: true, eventId, eventTitle: eventData.title };
  },

  generateInviteLink(eventId: string): string {
    return `https://aethera.app/event/${eventId}`;
  },

  async syncEventStatuses(): Promise<void> {
    const now = Date.now();
    const q = query(
      collection(db, 'communityEvents'),
      where('status', 'in', ['upcoming', 'live']),
    );
    const snap = await getDocs(q);
    const updates: Promise<void>[] = snap.docs.map(async (d) => {
      const data = d.data() as Record<string, any>;
      const startTime = data.startTime instanceof Timestamp ? data.startTime.toMillis() : (data.startTime ?? 0);
      const endTime = data.endTime instanceof Timestamp ? data.endTime.toMillis() : (data.endTime ?? 0);
      const newStatus = _computeStatus(startTime, endTime);
      if (newStatus !== data.status) {
        await updateDoc(doc(db, 'communityEvents', d.id), { status: newStatus });
      }
    });
    await Promise.all(updates);
  },
};
