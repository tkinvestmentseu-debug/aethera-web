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
  {
    title: 'Poranne Przebudzenie Duszy',
    type: 'PORANEK', element: 'Ogień',
    description: 'Obudź ciało i ducha o wschodzie słońca. Krótka praktyka oddechu, powitanie słońca i ustawienie intencji na cały dzień. Idealne na świeżym powietrzu lub przy otwartym oknie.',
    tips: ['Wstań 10 minut przed wschodem słońca', 'Przygotuj szklankę ciepłej wody z cytryną', 'Zanim otworzysz telefon — ustal trzy intencje dnia'],
    duration: 15, maxParticipants: 500, isLive: true,
  },
  {
    title: 'Pełnia Księżyca — Rytuał Wdzięczności',
    type: 'KSIĘŻYC', element: 'Woda',
    description: 'Celebracja pełni z intencjami wdzięczności i manifestacji. Pełnia to szczyt energii cyklu — czas zbierania plonów i ładowania kryształów. Wielka moc zbiorowej synchronizacji.',
    tips: ['Wyjdź na zewnątrz, aby fizycznie zobaczyć księżyc', 'Przygotuj kryształy do ładowania w świetle księżyca', 'Napisz listę wdzięczności z przynajmniej 10 punktami'],
    duration: 50, maxParticipants: 500, isLive: true,
  },
  {
    title: 'Ogniste Oczyszczanie Aury',
    type: 'OGIEŃ', element: 'Ogień',
    description: 'Praca z energią ognia do głębokiego oczyszczania pola energetycznego. Spalamy wszystko, co zbędne — lęk, wstyd, stare wzorce. Jedna z najsilniejszych praktyk grupowych.',
    tips: ['Miej dostęp do otwartego okna przed sesją', 'Postaw szklankę wody obok siebie', 'Zamknij oczy i podążaj za głosem prowadzącego'],
    duration: 30, maxParticipants: 100, isLive: false,
  },
  {
    title: 'Aktywacja Czakry Serca — Miłość Bezwarunkowa',
    type: 'CZAKRY', element: 'Powietrze',
    description: 'Otwieramy i balansujemy czakrę Anahata przez pranajamę, wizualizację zielonego światła i mantry. Praca z miłością bezwarunkową do siebie i innych — najgłębszy poziom uzdrawiania.',
    tips: ['Usiądź wygodnie ze skrzyżowanymi nogami lub na krześle', 'Połóż obie dłonie na centrum klatki piersiowej', 'Przygotuj się na głębokie emocje — to znak uzdrawiania'],
    duration: 35, maxParticipants: 200, isLive: false,
  },
  {
    title: 'Kąpiel Dźwiękowa — Misy Kryształowe 432 Hz',
    type: 'WODA', element: 'Woda',
    description: 'Zanurzenie w harmonicznych falach dźwiękowych mis kryształowych i gongów tybetańskich. Rezonans 432 Hz harmonizuje całe pole energetyczne i odprowadza napięcia z ciała na poziomie komórkowym.',
    tips: ['Połóż się na macie lub w łóżku — wygoda jest kluczowa', 'Używaj słuchawek stereo dla pełnego efektu przestrzennego', 'Nie planuj żadnych aktywności przez godzinę po sesji'],
    duration: 60, maxParticipants: 50, isLive: false,
  },
  {
    title: 'Zbiorowe Pole Ciszy',
    type: 'MEDYTACJA', element: 'Przestrzeń',
    description: 'Milczenie jako najgłębsza praktyka. Dołącz do setek ludzi siedzących razem w ciszy — energia zbiorowa amplifikuje każdą indywidualną sesję wielokrotnie. Czas na pełną obecność.',
    tips: ['Stwórz ciche i przyciemnione miejsce do siedzenia', 'Nie nastawiaj żadnych alarmów na czas sesji', 'Po sesji zostań jeszcze kilka minut w spokoju'],
    duration: 20, maxParticipants: 1000, isLive: false,
  },
  {
    title: 'Afirmacje Obfitości — Manifestacja',
    type: 'AFIRMACJE', element: 'Eter',
    description: 'Grupowe recytowanie afirmacji obfitości w stanie głębokiej receptywności. Kiedy wiele umysłów skupia się na tym samym, rzeczywistość odpowiada. Praca z podświadomością przez powtarzanie.',
    tips: ['Przed sesją wypisz 3 rzeczy, za które jesteś wdzięczny/a', 'Mów afirmacje głośno — wibracja dźwięku wzmacnia efekt', 'Wizualizuj każdą afirmację jako już spełnioną rzeczywistość'],
    duration: 25, maxParticipants: 300, isLive: false,
  },
  {
    title: 'Taniec Duszy — Ruch bez Oceniania',
    type: 'TANIEC', element: 'Ogień',
    description: 'Uwolnienie ciała przez spontaniczny, świadomy ruch przy rytmicznej muzyce. Bez choreografii, bez oceniania — tylko Twoje ciało i dźwięk. Doskonałe na uwolnienie emocji zatrzymanych w mięśniach.',
    tips: ['Zrób wolne miejsce wokół siebie — minimum 1,5m w każdą stronę', 'Zacznij od powolnego ruchu i pozwól ciału przyspieszyć naturalnie', 'Zamknij oczy gdy poczujesz się bezpiecznie — to wzmacnia doświadczenie'],
    duration: 40, maxParticipants: 80, isLive: false,
  },
  {
    title: 'Uzdrawianie Dźwiękiem — Solfeggio 528 Hz',
    type: 'UZDRAWIANIE', element: 'Woda',
    description: 'Głęboka praca z tonem miłości 528 Hz, zwanym DNA Repair Frequency. Sesja skupia się na uzdrawianiu na poziomie komórkowym — fizycznym i emocjonalnym. Połączona z wizualizacją zielonego światła.',
    tips: ['Możesz siedzieć lub leżeć — ważne, by być w pełni komfortowo', 'Połóż jedną dłoń na sercu, drugą na brzuchu', 'Oddychaj spokojnie i wyobrażaj sobie zielone, uzdrawiające światło'],
    duration: 40, maxParticipants: 200, isLive: false,
  },
  {
    title: 'Oczyszczanie Energii — Szałwia i Intencja',
    type: 'INTENCJA', element: 'Ogień',
    description: 'Naucz się prawidłowo oczyszczać przestrzeń życiową szałwią, palo santo i innymi ziołami. Rytuał grupowy ze wspólnym ustawieniem pola ochronnego wokół domu i bliskich.',
    tips: ['Przygotuj szałwię lub kadzidło wieczorem przed rytuałem', 'Otwórz wszystkie okna i drzwi balkonowe przed rozpoczęciem', 'Poruszaj się zgodnie z ruchem wskazówek zegara, zaczynając od wejścia'],
    duration: 25, maxParticipants: 50, isLive: false,
  },
  {
    title: 'Wieczorne Uziemienie — 7 Czakr',
    type: 'CZAKRY', element: 'Ziemia',
    description: 'Kompleksowy skan i harmonizacja wszystkich 7 czakr od Muladhara do Sahasrara. Idealne na koniec dnia — usuwa nagromadzoną energię obcą i resetuje pole do czystości przed snem.',
    tips: ['Przeprowadź krótki skan ciała przed sesją — zauważ napięcia', 'Trzymaj w pobliżu czarne kryształy (obsydian, turmalin) do uziemienia', 'Sesja może wywołać głęboki sen — to bardzo pożądany efekt'],
    duration: 55, maxParticipants: 300, isLive: false,
  },
  {
    title: 'Medytacja Ciszy — Astralna Podróż',
    type: 'MEDYTACJA', element: 'Przestrzeń',
    description: 'Kontemplacja nocnego nieba jako brama do wewnętrznej ciszy i astralnej projekcji. Prowadzona wizualizacja przez konstelacje — podróż do centrum własnej świadomości.',
    tips: ['Wyjdź na zewnątrz lub usiądź przy oknie z widokiem na niebo', 'Znajdź jedną gwiazdę i skupiaj na niej wzrok przez pierwsze 5 minut', 'Kiedy prowadzący poprosi — pozwól myślom odpłynąć jak chmury'],
    duration: 35, maxParticipants: 500, isLive: false,
  },
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
