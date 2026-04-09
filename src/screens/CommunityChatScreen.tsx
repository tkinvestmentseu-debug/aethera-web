// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocaleCode } from '../core/utils/localeFormat';
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  ChevronLeft,
  Users,
  Plus,
  Send,
  Smile,
  Share2,
  MoreVertical,
  ArrowRight,
  Circle,
  Star,
  X,
  Lock,
  Globe,
  Hash,
  Copy,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { getResolvedTheme } from '../core/theme/tokens';
import { useAppStore } from '../store/useAppStore';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { ChatService, ChatMessage as FBChatMessage } from '../core/services/community/chat.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const SP = layout.padding.screen; // 22

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ChatRoom {
  id: string;
  emoji: string;
  name: string;
  description: string;
  online: number;
  lastMsg: string;
  lastTime: string;
  color: string;
  unread?: number;
  isPulsing?: boolean;
}

interface ChatMessage {
  id: string;
  author: string;
  isOwn: boolean;
  text: string;
  time: string;
  reactions?: string[];
  isTimestamp?: boolean;
  isSymbolQuote?: boolean;
}

type ReactionMenuState = { msgId: string; x: number; y: number } | null;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ROOM_CATEGORIES = ['Wszystkie', 'Popularne', 'Tematyczne', 'Moje'];

const ROOMS: ChatRoom[] = [
  {
    id: 'general',
    emoji: '🌐',
    name: 'Ogólna Wspólnota',
    description: 'Przestrzeń dla wszystkich',
    online: 847,
    lastMsg: 'Dzisiaj medytacja mnie dosłownie otworzyła...',
    lastTime: '3 min',
    color: '#6366F1',
    unread: 12,
    isPulsing: true,
  },
  {
    id: 'tarot',
    emoji: '✦',
    name: 'Tarot i Karty',
    description: 'Interpretacje i pytania',
    online: 342,
    lastMsg: 'Jaka jest wasza ulubiona talia?',
    lastTime: '7 min',
    color: '#F59E0B',
    unread: 5,
    isPulsing: true,
  },
  {
    id: 'meditation',
    emoji: '🌙',
    name: 'Medytacja i Uważność',
    description: 'Techniki i doświadczenia',
    online: 289,
    lastMsg: 'Koherencja serca po raz 30...',
    lastTime: '12 min',
    color: '#10B981',
    unread: 3,
  },
  {
    id: 'dreams',
    emoji: '🌊',
    name: 'Sny i Symbolarium',
    description: 'Dziel się snami',
    online: 198,
    lastMsg: 'Śniłam o białym wężu...',
    lastTime: '25 min',
    color: '#A78BFA',
    unread: 7,
  },
  {
    id: 'astrology',
    emoji: '⭐',
    name: 'Astrologia i Horoskopy',
    description: 'Tranzyt i natal',
    online: 267,
    lastMsg: 'Merkury wychodzi z retro!',
    lastTime: '1 h',
    color: '#818CF8',
    unread: 2,
    isPulsing: true,
  },
  {
    id: 'rituals',
    emoji: '🔥',
    name: 'Rytuały i Oczyszczanie',
    description: 'Praktyki i ceremonie',
    online: 156,
    lastMsg: 'Rytuał nowego księżyca udany ✦',
    lastTime: '2 h',
    color: '#DC2626',
  },
  {
    id: 'support',
    emoji: '💜',
    name: 'Wsparcie i Uzdrawianie',
    description: 'Bezpieczna przestrzeń',
    online: 203,
    lastMsg: 'Dziękuję za wcześniejsze wsparcie',
    lastTime: '3 h',
    color: '#EC4899',
    unread: 4,
  },
  {
    id: 'affirmations',
    emoji: '🌸',
    name: 'Afirmacje na Dziś',
    description: 'Codzienne wzmocnienie',
    online: 321,
    lastMsg: 'Jestem wystarczająca/y',
    lastTime: '5 min',
    color: '#FBBF24',
    unread: 8,
    isPulsing: true,
  },
];

const AVATARS: Record<string, string> = {
  Luna: '#8B5CF6',
  Arion: '#3B82F6',
  Vera: '#EC4899',
  Solaris: '#F59E0B',
  Kira: '#10B981',
  Mira: '#6366F1',
  Atlas: '#14B8A6',
  Nyx: '#9333EA',
  Ember: '#EF4444',
};

const AVATAR_NAMES = Object.keys(AVATARS);

// Seed content for community rooms — intentional demo data (no backend)
const SEED_MESSAGES_BY_ROOM: Record<string, ChatMessage[]> = {
  general: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Luna', isOwn: false, text: 'Dzień dobry wszystkim! Kto dziś rano zrobił coś dla siebie? 🌅', time: '08:14' },
    { id: 'm2', author: 'Arion', isOwn: false, text: 'Wstałem o 5:30 na wschód słońca. Coś pięknego w tej ciszy.', time: '08:17' },
    { id: 'm3', author: 'Vera', isOwn: false, text: 'Godzina jogi na balkonie. Czuję jak energia przepływa inaczej.', time: '08:22' },
    { id: 'm4', author: 'Luna', isOwn: false, text: '✦ Każdy poranek to nowe zaproszenie do siebie.', time: '08:25', isSymbolQuote: true },
    { id: 'm5', author: 'Solaris', isOwn: false, text: 'Medytacja 20 minut i dziennik. Dziś zapisałam sen — biały łabędź nad spokojną wodą.', time: '08:31' },
    { id: 'm6', author: 'Kira', isOwn: false, text: 'Ten sen ma piękne znaczenie — łabędź to transformacja i łaska 💜', time: '08:33' },
    { id: 'm7', author: 'Ty', isOwn: true, text: 'Dziękuję za tę energię! Dzisiaj medytacja mnie dosłownie otworzyła — poczułam jak coś odpuszcza w klatce piersiowej', time: '08:40' },
    { id: 'm8', author: 'Luna', isOwn: false, text: 'To jest to! Ciało wie, kiedy jesteśmy gotowe/gotowi 🌙', time: '08:41' },
    { id: 'm9', author: 'Mira', isOwn: false, text: 'Właśnie wróciłam z rytuału uwalniania z pełni. Nadal jestem w tym stanie zawieszenia...', time: '08:45' },
    { id: 'm10', author: 'Atlas', isOwn: false, text: 'Znam to. To stan między — nie warto od razu wychodzić.', time: '08:47' },
    { id: 'm11', author: 'Nyx', isOwn: false, text: '✦ Głęboka cisza jest pełna odpowiedzi.', time: '08:50', isSymbolQuote: true },
    { id: 'm12', author: 'Ember', isOwn: false, text: 'Ktoś próbował oddech metodą Wim Hof? Szukam kogoś, kto to praktykuje regularnie.', time: '08:55' },
    { id: 'm13', author: 'Arion', isOwn: false, text: 'Ja robię to od roku. Napisz do mnie — chętnie podzielę się protokołem!', time: '08:57' },
    { id: 'm14', author: 'Vera', isOwn: false, text: 'Polecam też połączyć z medytacją skupienia po hiperwentylacji. Efekty są inne.', time: '09:03' },
    { id: 'm15', author: 'Solaris', isOwn: false, text: 'Właśnie skończyłam czytanie karty dnia — Kapłanka. Intuicja prowadzi. ✨', time: '09:10' },
    { id: 'm16', author: 'Kira', isOwn: false, text: 'Doskonały sygnał! Kapłanka mówi: ufaj temu, co czujesz, nie temu, co widzisz 💫', time: '09:12' },
    { id: 'm17', author: 'Ty', isOwn: true, text: 'Jak pięknie to ujęłaś ✦ Dziękuję 🌸', time: '09:15' },
    { id: 'm18', author: 'Luna', isOwn: false, text: 'Dobrze mieć taką wspólnotę. Rzadko gdzieś czuję się tak rozumiana 💜', time: '09:18' },
    { id: 'm19', author: 'Mira', isOwn: false, text: 'To jest siła tego miejsca. Nikt tu nie ocenia — wszyscy szukamy.', time: '09:20' },
    { id: 'm20', author: 'Atlas', isOwn: false, text: 'Wysyłam wszystkim świetlistą energię na resztę dnia 🌟', time: '09:25' },
  ],
  tarot: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Solaris', isOwn: false, text: 'Karta dnia — Kolo Fortuny! Co u was wypadło? 🔮', time: '09:05' },
    { id: 'm2', author: 'Kira', isOwn: false, text: 'Czarownica odwrócona. Zablokowanie własnej mocy — daje do myślenia...', time: '09:08' },
    { id: 'm3', author: 'Vera', isOwn: false, text: 'Kochanek bez odwrócenia. Dzień na decyzje z serca 💛', time: '09:11' },
    { id: 'm4', author: 'Luna', isOwn: false, text: '✦ Każda karta to lustro, nie wyrok.', time: '09:14', isSymbolQuote: true },
    { id: 'm5', author: 'Arion', isOwn: false, text: 'Jaka jest wasza ulubiona talia? Ja jestem zauroczony Tarotem z Rider-Waite — klasyk nieprzebity.', time: '09:20' },
    { id: 'm6', author: 'Ember', isOwn: false, text: 'Wild Unknown! Te symbole mówią do mnie zupełnie inaczej niż klasyczne obrazy.', time: '09:22' },
    { id: 'm7', author: 'Nyx', isOwn: false, text: 'Thoth Tarot jeśli wchodzimy w głębię. Trudny, ale przepiękny.', time: '09:25' },
    { id: 'm8', author: 'Ty', isOwn: true, text: 'Używam Everyday Witch — ma takie ciepło i humor. Sprawia że rozmawianie z talią jest radosne 🌿', time: '09:30' },
    { id: 'm9', author: 'Solaris', isOwn: false, text: 'Ooo nie znałam tej talii! Szukam właśnie czegoś mniej poważnego na co dzień.', time: '09:32' },
    { id: 'm10', author: 'Kira', isOwn: false, text: 'Ktoś pracuje z Oracles czy czysto tarot? Lubię łączyć odczyt kart z kartami afirmacyjnymi.', time: '09:38' },
    { id: 'm11', author: 'Luna', isOwn: false, text: 'Uwielbiam Oracle Moonology Yasmin Boland — szczególnie przy pełni i nowiu 🌕', time: '09:41' },
    { id: 'm12', author: 'Mira', isOwn: false, text: 'Dzielę się dzisiejszym układem — trzy karty na ten tydzień. Ktoś chce interpretację?', time: '09:50' },
    { id: 'm13', author: 'Atlas', isOwn: false, text: 'Tak! Chętnie popatrzę razem z tobą 👁️', time: '09:52' },
  ],
  meditation: [
    { id: 'ts1', author: '', isOwn: false, text: 'Wczoraj', time: '', isTimestamp: true },
    { id: 'm1', author: 'Atlas', isOwn: false, text: 'Kto wie coś o medytacji nie-dual? Chcę wejść głębiej niż mindfulness.', time: '21:10' },
    { id: 'm2', author: 'Nyx', isOwn: false, text: 'Polecam Advaita Vedanta — Nisargadatta Maharaj "Jestem" jako start.', time: '21:15' },
    { id: 'ts2', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm3', author: 'Luna', isOwn: false, text: 'Rano zrobiłam koherencję serca — 20 minut skupienia na oddechu 5 wdech / 5 wydech. Coś się zmieniło.', time: '08:20' },
    { id: 'm4', author: 'Mira', isOwn: false, text: 'Koherencja serca po raz 30 kolejnych dni! Ciśnienie spadło, sen lepszy, emocje spokojniejsze 💚', time: '08:22' },
    { id: 'm5', author: 'Ty', isOwn: true, text: 'Jak długo zanim poczułyście/poczuliście pierwsze zmiany?', time: '08:35' },
    { id: 'm6', author: 'Luna', isOwn: false, text: 'U mnie trzecia sesja. Coś fizycznie puszcza w klatce piersiowej.', time: '08:37' },
    { id: 'm7', author: 'Ember', isOwn: false, text: 'Ja po tygodniu poczułam inne przebudzenia — mniej reaktywna na sytuacje w pracy.', time: '08:42' },
    { id: 'm8', author: 'Vera', isOwn: false, text: '✦ Ciało jest pierwszym nauczycielem — słuchaj tego, co napina i tego, co odpuszcza.', time: '08:45', isSymbolQuote: true },
    { id: 'm9', author: 'Arion', isOwn: false, text: 'Techniki: Vipassana / TM / Wim Hof / Joe Dispenza. Ktoś porównywał?', time: '09:00' },
    { id: 'm10', author: 'Atlas', isOwn: false, text: 'Przeszłam przez wszystkie. Dispenza zmienił moje życie — 10-dniowe odosobnienie. Polecam.', time: '09:05' },
  ],
  dreams: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Nyx', isOwn: false, text: 'Dzisiaj znów ten sam sen z labiryntem. Trzeci raz w tym miesiącu.', time: '07:45' },
    { id: 'm2', author: 'Mira', isOwn: false, text: 'Powtarzające się sny to najważniejsze przesłania. Co czujesz w środku labiryntu?', time: '07:48' },
    { id: 'm3', author: 'Nyx', isOwn: false, text: 'Pewność. Jakbym wiedziała, że wyjście jest — tylko muszę zwolnić.', time: '07:50' },
    { id: 'm4', author: 'Luna', isOwn: false, text: '✦ Labirynt to nie pułapka — to inicjacja.', time: '07:52', isSymbolQuote: true },
    { id: 'm5', author: 'Solaris', isOwn: false, text: 'Śniłam o białym wężu pijącym z rzeki. Dwa razy. Ktoś ma interpretację?', time: '08:10' },
    { id: 'm6', author: 'Kira', isOwn: false, text: 'Biały wąż — rzadki symbol mądrości i transformacji bez zagrożenia. Rzeka to przepływ emocji. Wąż pijący = integracja nowej wiedzy przez emocje.', time: '08:14' },
    { id: 'm7', author: 'Atlas', isOwn: false, text: 'W alchemii biały wąż to Merkury — posłaniec między światami. Coś ważnego jest gotowe by wejść.', time: '08:17' },
    { id: 'm8', author: 'Solaris', isOwn: false, text: 'To niesamowite. Właśnie przechodzę przez dużą zmianę zawodową... Dziękuję 💜', time: '08:20' },
    { id: 'm9', author: 'Ty', isOwn: true, text: 'Też mam sen który wraca — idę przez pole kwiatów ale każdy kwiat zamienia się w gwiazdę gdy go dotykam', time: '08:30' },
    { id: 'm10', author: 'Ember', isOwn: false, text: 'To piękne — kwiaty jako ziemskie piękno, gwiazdy jako transcendencja. Twoje dotknięcie przemienia materię w ducha.', time: '08:33' },
    { id: 'm11', author: 'Vera', isOwn: false, text: 'Możesz też zapytać siebie: co ostatnio "dotykam" w swoim życiu co zmienia formę?', time: '08:35' },
  ],
  astrology: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Kira', isOwn: false, text: 'MERKURY WYCHODZI Z RETRO!!! 🎉 Wreszcie mogę podpisać tę umowę.', time: '10:00' },
    { id: 'm2', author: 'Luna', isOwn: false, text: 'Czekałam na to! Poczułaś jak energia się zmienia? U mnie od rana inny flow.', time: '10:03' },
    { id: 'm3', author: 'Solaris', isOwn: false, text: 'To jeszcze strefa cienia — kolejne 2 tygodnie ostrożnie z nowymi inicjatywami.', time: '10:07' },
    { id: 'm4', author: 'Arion', isOwn: false, text: '✦ Cień to czas nauki, nie blokady.', time: '10:10', isSymbolQuote: true },
    { id: 'm5', author: 'Ty', isOwn: true, text: 'Co to dokładnie oznacza "strefa cienia"? Słyszę po raz pierwszy to pojęcie', time: '10:14' },
    { id: 'm6', author: 'Solaris', isOwn: false, text: 'To stopnie przez które Merkury przechodził przed retrogradem. Planeta wraca do normalnej prędkości — może wciąż być niestabilna komunikacja.', time: '10:16' },
    { id: 'm7', author: 'Atlas', isOwn: false, text: 'Ktoś sprawdza swój chart z aktualnymi tranzytami? Saturn właśnie wszedł w opozycję z moim Słońcem — czuję to w kościach 😅', time: '10:25' },
    { id: 'm8', author: 'Nyx', isOwn: false, text: 'Saturn to nauczyciel, nie wróg. Gdzie masz Słońce?', time: '10:27' },
    { id: 'm9', author: 'Atlas', isOwn: false, text: 'Baran 14 stopień. Saturn w Wadze odwrócony w stosunku. Lekcja o partnerstwa i granic.', time: '10:30' },
    { id: 'm10', author: 'Ember', isOwn: false, text: 'Saturn w opozycji do Barana sprawdza autentyczność relacji. Kto naprawdę jest z tobą — widać teraz wyraźnie.', time: '10:33' },
  ],
  rituals: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Ember', isOwn: false, text: 'Rytuał nowego księżyca udany ✦ Płomień przyjął intencję. Czuję jak coś ruszyło.', time: '23:05' },
    { id: 'm2', author: 'Luna', isOwn: false, text: 'Pięknie! Jakie intencje ustawiałaś?', time: '23:08' },
    { id: 'm3', author: 'Ember', isOwn: false, text: 'Nowy projekt kreatywny + uwolnienie starego wzorca perfekcjonizmu. Napisałam na papierze, spaliłam, wsypałam prochy do ziemi.', time: '23:11' },
    { id: 'm4', author: 'Mira', isOwn: false, text: 'To potężny rytuał. Ziemia jako receptor intencji — wielka moc 🌱', time: '23:14' },
    { id: 'm5', author: 'Arion', isOwn: false, text: '✦ To co sadzimy w ciemności nocy — kiełkuje w świetle pełni.', time: '23:17', isSymbolQuote: true },
    { id: 'm6', author: 'Ty', isOwn: true, text: 'Chcę zacząć robić rytuały ale nie wiem od czego. Coś prostego na start?', time: '23:25' },
    { id: 'm7', author: 'Vera', isOwn: false, text: 'Herbata + świeca + notatnik. Trzy rzeczy za które jesteś wdzięczna/y. Najprościej i działa.', time: '23:27' },
    { id: 'm8', author: 'Kira', isOwn: false, text: 'Dodaj element uziemienia — bosa stopa na podłodze / ziemi, kilka głębokich oddechów. To zamknięcie kręgu.', time: '23:30' },
    { id: 'm9', author: 'Nyx', isOwn: false, text: 'I intencja zanim zaczniesz — czemu to robię, co chcę poczuć lub uwolnić. Reszta przyjdzie.', time: '23:33' },
    { id: 'm10', author: 'Ty', isOwn: true, text: 'Dziękuję wszystkim! Zaczynam jutro przy wschodzie słońca 🌅', time: '23:38' },
    { id: 'm11', author: 'Ember', isOwn: false, text: 'Świetny czas! Świt to energia nowych początków. Daj znać jak poszło 💫', time: '23:40' },
  ],
  support: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Vera', isOwn: false, text: 'Czuję się dziś przytłoczona. Nie wiem skąd to napłynęło. Po prostu płaczę od rana.', time: '09:15' },
    { id: 'm2', author: 'Luna', isOwn: false, text: 'Jesteś bezpieczna tutaj. Pozwól temu płynąć — łzy to ciało które przetwarza 💜', time: '09:17' },
    { id: 'm3', author: 'Mira', isOwn: false, text: 'Jestem tu. Nie musisz tłumaczyć ani kontrolować. Po prostu bądź.', time: '09:19' },
    { id: 'm4', author: 'Atlas', isOwn: false, text: '✦ Serce które płacze jest sercem które czuje — to odwaga nie słabość.', time: '09:21', isSymbolQuote: true },
    { id: 'm5', author: 'Vera', isOwn: false, text: 'Dziękuję za wcześniejsze wsparcie. Naprawdę pomogło. Czuję się mniej sama 💙', time: '11:30' },
    { id: 'm6', author: 'Kira', isOwn: false, text: 'Cieszę się że możemy być tu dla siebie. To jest właśnie ta wspólnota 🌸', time: '11:33' },
    { id: 'm7', author: 'Nyx', isOwn: false, text: 'Vera, jak teraz? Co potrzebujesz?', time: '11:36' },
    { id: 'm8', author: 'Vera', isOwn: false, text: 'Kawy i ciszy 😄 Ale serio — poczułam się usłyszana. To wystarczy.', time: '11:39' },
    { id: 'm9', author: 'Ty', isOwn: true, text: 'Też nieraz przychodziłam tu po prostu by siedzieć wśród ludzi którzy rozumieją. To leczy 💜', time: '11:45' },
    { id: 'm10', author: 'Ember', isOwn: false, text: 'Świadome towarzyszenie to jedna z najgłębszych form miłości.', time: '11:48' },
    { id: 'm11', author: 'Solaris', isOwn: false, text: '✦ Być widzianą/widzianym — to podstawowa ludzka potrzeba. Tu możemy ją spełniać.', time: '11:50', isSymbolQuote: true },
  ],
  affirmations: [
    { id: 'ts1', author: '', isOwn: false, text: 'Dziś', time: '', isTimestamp: true },
    { id: 'm1', author: 'Kira', isOwn: false, text: 'Dzisiejsza afirmacja: Jestem wystarczająca/y dokładnie taka/taki jaka/jaki jestem teraz. 🌸', time: '07:00' },
    { id: 'm2', author: 'Luna', isOwn: false, text: 'Już zapisałam i powtarzam przy lustrze. Trudna ale potrzebna.', time: '07:04' },
    { id: 'm3', author: 'Arion', isOwn: false, text: 'Mnie łzy polecą przy "wystarczający". Ale idziemy 💫', time: '07:07' },
    { id: 'm4', author: 'Solaris', isOwn: false, text: '✦ Gdzie jest opór — tam jest lekcja.', time: '07:09', isSymbolQuote: true },
    { id: 'm5', author: 'Ember', isOwn: false, text: 'Ktoś ma technikę na zagospodarowanie oporu przy afirmacjach? Moje ciało mówi "kłamstwo" gdy powtarzam.', time: '07:15' },
    { id: 'm6', author: 'Vera', isOwn: false, text: 'Zamień "Jestem" na "Uczę się być" lub "Otwieram się na bycie". Mniejszy opór, większa szczerość.', time: '07:18' },
    { id: 'm7', author: 'Nyx', isOwn: false, text: 'Albo zamiast afirmować stan — afirmuj gotowość: "Jestem gotowa/y przyjąć miłość" zamiast "Jestem kochana/y".', time: '07:22' },
    { id: 'm8', author: 'Ty', isOwn: true, text: 'To niesamowita różnica. Kiedy mówię "Otwieram się na bycie wystarczającą" ciało mówi tak zamiast nie ✨', time: '07:28' },
    { id: 'm9', author: 'Atlas', isOwn: false, text: 'Właśnie to jest praca z podświadomością — nie walka, dialog 💜', time: '07:31' },
    { id: 'm10', author: 'Mira', isOwn: false, text: 'Podzielę się afirmacją którą noszę w portfelu od roku: "Zaufam procesowi swojego życia". Prosta i potężna.', time: '07:38' },
    { id: 'm11', author: 'Kira', isOwn: false, text: 'Piękna. Dodaję do kolekcji 🌸', time: '07:40' },
    { id: 'm12', author: 'Luna', isOwn: false, text: 'Jestem wystarczająca/y — udało się dzisiaj powiedzieć bez płaczu. Mały krok. 🥲✨', time: '08:05' },
  ],
};

const AUTO_REPLIES: Record<string, string[]> = {
  general: [
    'Pięknie to ująłaś/ująłeś ✦',
    'Czuję dokładnie to samo! Dziękuję za podzielenie się.',
    'To rezonuje głęboko. Zapisuję te słowa.',
    'Wysyłam ci światło i ciepło 🌟',
    'Jesteś tu od jak długiego czasu? Twoja energia jest szczególna.',
    'Ta wspólnota jest czymś wyjątkowym — dziękuję że tu jesteś 💜',
  ],
  tarot: [
    'Ciekawe — moja karta dziś też była z grupy Wielkich Arkanów!',
    'Jaką talię polecasz dla początkujących?',
    'Ten układ mówi mi coś bardzo konkretnego... ✦',
    'Kapłanka zawsze pojawia się kiedy warto słuchać ciszy.',
    'Piękna interpretacja 🔮 Dziękuję za podzielenie się.',
  ],
  meditation: [
    'Ćwiczę to samo! Efekty po 21 dniach są naprawdę zauważalne.',
    'Koherencja serca zmieniła moje podejście do stresu.',
    'Ciało naprawdę jest pierwszym nauczycielem ✦',
    'Polecam też łączyć z oddechem przez nos metodą Buteyko.',
    'Ten stan zawieszenia po medytacji — to jest złoto.',
  ],
  dreams: [
    'Sny powtarzające się to zawsze ważny sygnał — warto zapisywać.',
    'Biały kolor w snach to prawie zawsze energia wyższa.',
    'Przesłanie twojego snu jest piękne ✦',
    'Jungowski symbolizm pomoże ci tutaj — polecam czytać.',
    'Czy zapisujesz sny od razu po przebudzeniu? To klucz.',
  ],
  rituals: [
    'Rytuał to intencja w fizycznej formie — piękne to ująłaś/ująłeś.',
    'Następna pełnia za dwa tygodnie — warto zacząć przygotowania!',
    'Najprostsze rytuały są często najpotężniejsze ✦',
    'Ziemia jako świadek intencji — starożytna i niezawodna praktyka.',
    'Podzielisz się rytuałem na pełnię? Chętnie spróbuję.',
  ],
  support: [
    'Dziękuję że tu jesteś. Ta przestrzeń jest święta.',
    'Słyszę cię. Twoje uczucia są prawdziwe i ważne 💜',
    'Jesteś bezpieczna/bezpieczny tutaj — zawsze.',
    'To co czujesz ma sens. Nie musisz tego naprawiać — wystarczy poczuć.',
    'Razem jest łatwiej nieść to co ciężkie. Jesteśmy tu.',
  ],
  affirmations: [
    'Ta afirmacja dotarła prosto do serca! ✨',
    'Powtarzam razem z tobą codziennie rano przy kawie 🌸',
    'Technika lustra zmienia wszystko — spróbuj jutro.',
    'Dzisiaj moja afirmacja: Jestem otwarta/y na cuda małe i duże.',
    'Wspólne afirmowanie ma inną moc niż robione w samotności ✦',
  ],
};

const getAutoReplies = (roomId: string) =>
  AUTO_REPLIES[roomId] || AUTO_REPLIES.general;

const getRandomAuthor = (own: string) => {
  const others = AVATAR_NAMES.filter((n) => n !== own && n !== 'Ty');
  return others[Math.floor(Math.random() * others.length)];
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

const TypingDots = ({ color }: { color: string }) => {
  const d0 = useSharedValue(0);
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);

  useEffect(() => {
    d0.value = withRepeat(
      withSequence(withTiming(1, { duration: 350 }), withTiming(0, { duration: 350 })),
      -1,
      false,
    );
    const t1 = setTimeout(() => {
      d1.value = withRepeat(
        withSequence(withTiming(1, { duration: 350 }), withTiming(0, { duration: 350 })),
        -1,
        false,
      );
    }, 150);
    const t2 = setTimeout(() => {
      d2.value = withRepeat(
        withSequence(withTiming(1, { duration: 350 }), withTiming(0, { duration: 350 })),
        -1,
        false,
      );
    }, 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const s0 = useAnimatedStyle(() => ({ opacity: 0.4 + d0.value * 0.6, transform: [{ translateY: -d0.value * 4 }] }));
  const s1 = useAnimatedStyle(() => ({ opacity: 0.4 + d1.value * 0.6, transform: [{ translateY: -d1.value * 4 }] }));
  const s2 = useAnimatedStyle(() => ({ opacity: 0.4 + d2.value * 0.6, transform: [{ translateY: -d2.value * 4 }] }));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 4 }}>
      {[s0, s1, s2].map((style, i) => (
        <Animated.View
          key={i}
          style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, style]}
        />
      ))}
    </View>
  );
};

const PulseDot = ({ color }: { color: string }) => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.5, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 2 - scale.value,
  }));
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: color + '55', position: 'absolute' }, animStyle]} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
};

const OnlineOrb = () => {
  const glow = useSharedValue(0.7);
  useEffect(() => {
    glow.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }), withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) })),
      -1,
      false,
    );
  }, []);
  const orbStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
  return (
    <Animated.View style={[orbStyle, { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }]}>
      <LinearGradient
        colors={['#CEAE72', '#F59E0B', '#CEAE7222']}
        style={{ width: 40, height: 40, borderRadius: 20 }}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Room Card
// ─────────────────────────────────────────────────────────────────────────────

const RoomCard = ({
  room,
  index,
  isLight,
  onPress,
}: {
  room: ChatRoom;
  index: number;
  isLight: boolean;
  onPress: () => void;
}) => {
  const scale = useSharedValue(1);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(withSpring(0.97), withSpring(1));
    HapticsService.impact('light');
    onPress();
  };

  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Animated.View style={cardStyle}>
      <Pressable onPress={handlePress} style={{ marginBottom: 10 }}>
        <View
          style={{
            backgroundColor: cardBg,
            borderColor: cardBorder,
            borderWidth: 1,
            borderRadius: 18,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {/* Emoji icon */}
          <LinearGradient
            colors={[room.color + '40', room.color + '20']}
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: room.color + '60',
            }}
          >
            <Text style={{ fontSize: 24 }}>{room.emoji}</Text>
          </LinearGradient>

          {/* Main content */}
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: isLight ? '#1A1A2E' : '#F0EBE2',
                  letterSpacing: 0.2,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {room.name}
              </Text>
              {room.unread != null && (
                <View
                  style={{
                    backgroundColor: '#EF4444',
                    borderRadius: 10,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    minWidth: 20,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{room.unread}</Text>
                </View>
              )}
            </View>

            <Text
              style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)', marginBottom: 2 }}
            >
              {room.description}
            </Text>

            {/* Online count */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {room.isPulsing ? (
                <PulseDot color="#22C55E" />
              ) : (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
              )}
              <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '600' }}>
                {room.online.toLocaleString(getLocaleCode())} online
              </Text>
            </View>

            {/* Last message */}
            <Text
              style={{
                fontSize: 12,
                color: isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.40)',
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {room.lastMsg}
            </Text>
          </View>

          {/* Time + arrow */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.35)' }}>
              {room.lastTime}
            </Text>
            <ArrowRight size={16} color={room.color} />
          </View>
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Message Bubble
// ─────────────────────────────────────────────────────────────────────────────

const MessageBubble = ({
  msg,
  isLight,
  roomColor,
  onLongPress,
}: {
  msg: ChatMessage;
  isLight: boolean;
  roomColor: string;
  onLongPress: (msgId: string) => void;
}) => {
  if (msg.isTimestamp) {
    return (
      <View style={{ alignItems: 'center', marginVertical: 14 }}>
        <View
          style={{
            backgroundColor: isLight ? 'rgba(255,246,230,0.95)' : 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
            {msg.text}
          </Text>
        </View>
      </View>
    );
  }

  const avatarColor = AVATARS[msg.author] || '#6366F1';
  const initial = msg.author ? msg.author[0] : 'T';

  if (msg.isOwn) {
    return (
      <Animated.View entering={FadeInDown.duration(250)} style={{ alignItems: 'flex-end', marginBottom: 10, paddingLeft: 60 }}>
        <Pressable onLongPress={() => onLongPress(msg.id)}>
          <LinearGradient
            colors={['#CEAE72', '#B8943E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              borderBottomRightRadius: 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              maxWidth: SW * 0.72,
            }}
          >
            <Text style={{ fontSize: 15, color: '#1A1208', lineHeight: 22 }}>{msg.text}</Text>
          </LinearGradient>
          <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.60)' : 'rgba(255,255,255,0.30)', marginTop: 3, marginRight: 4 }}>
            {msg.time}
          </Text>
          {msg.reactions && msg.reactions.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 4, marginTop: 2, justifyContent: 'flex-end' }}>
              {msg.reactions.map((r, i) => (
                <Text key={i} style={{ fontSize: 16 }}>{r}</Text>
              ))}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(250)} style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, paddingRight: 60, gap: 8 }}>
      {/* Avatar */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: avatarColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{initial}</Text>
      </View>

      <Pressable onLongPress={() => onLongPress(msg.id)} style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.68)' : 'rgba(255,255,255,0.45)', marginBottom: 3, marginLeft: 4 }}>
          {msg.author}
        </Text>

        {msg.isSymbolQuote ? (
          <View
            style={{
              borderLeftWidth: 3,
              borderLeftColor: roomColor,
              paddingLeft: 12,
              paddingVertical: 6,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: roomColor,
                fontStyle: 'italic',
                lineHeight: 22,
              }}
            >
              {msg.text}
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.08)',
              borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.10)',
              borderWidth: 1,
              borderRadius: 18,
              borderBottomLeftRadius: 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              maxWidth: SW * 0.72,
            }}
          >
            <Text style={{ fontSize: 15, color: isLight ? '#1A1A2E' : '#E8E0F0', lineHeight: 22 }}>
              {msg.text}
            </Text>
          </View>
        )}

        <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.58)' : 'rgba(255,255,255,0.28)', marginTop: 3, marginLeft: 4 }}>
          {msg.time}
        </Text>

        {msg.reactions && msg.reactions.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 2, marginLeft: 4 }}>
            {msg.reactions.map((r, i) => (
              <Text key={i} style={{ fontSize: 16 }}>{r}</Text>
            ))}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Reaction Menu
// ─────────────────────────────────────────────────────────────────────────────

const REACTIONS = ['💛', '✨', '🌙', '💜', '🔥'];

const ReactionMenu = ({
  visible,
  onSelect,
  onClose,
  isLight,
}: {
  visible: boolean;
  onSelect: (r: string) => void;
  onClose: () => void;
  isLight: boolean;
}) => {
  if (!visible) return null;
  return (
    <Pressable
      style={[StyleSheet.absoluteFill, { zIndex: 100 }]}
      onPress={onClose}
    >
      <View
        style={{
          position: 'absolute',
          bottom: 80,
          alignSelf: 'center',
          flexDirection: 'row',
          backgroundColor: isLight ? '#FFFFFF' : '#1A1428',
          borderRadius: 30,
          paddingHorizontal: 12,
          paddingVertical: 8,
          gap: 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
          elevation: 12,
          borderWidth: 1,
          borderColor: isLight ? 'rgba(139,100,42,0.30)' : 'rgba(255,255,255,0.12)',
          zIndex: 101,
        }}
      >
        {REACTIONS.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              HapticsService.impact('light');
              onSelect(r);
            }}
            style={{ padding: 6 }}
          >
            <Text style={{ fontSize: 24 }}>{r}</Text>
          </Pressable>
        ))}
      </View>
    </Pressable>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────

export const CommunityChatScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
    const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);
  const { currentTheme, isLight } = useTheme();
    const currentUser = useAuthStore(s => s.currentUser);
  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
  const inputBg = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.07)';

  // ── View state ─────────────────────────────────────────────────────────────
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Wszystkie');

  // ── Create room modal ───────────────────────────────────────────────────────
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomEmoji, setNewRoomEmoji] = useState('💬');
  const [newRoomPrivate, setNewRoomPrivate] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);

  // ── Join by code modal ──────────────────────────────────────────────────────
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joiningCode, setJoiningCode] = useState(false);

  // ── Room options (invite code panel) ───────────────────────────────────────
  const [showRoomOptions, setShowRoomOptions] = useState(false);
  const [currentRoomInviteCode, setCurrentRoomInviteCode] = useState<string | null>(null);

  // ── Chat state ─────────────────────────────────────────────────────────────
  const [messagesByRoom, setMessagesByRoom] = useState<Record<string, ChatMessage[]>>(SEED_MESSAGES_BY_ROOM);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingAuthor, setTypingAuthor] = useState('Luna');
  const [reactionMenu, setReactionMenu] = useState<ReactionMenuState>(null);
  const [reactionTarget, setReactionTarget] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fbUnsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Seed Firebase chat rooms on mount
    ChatService.seedRoomsIfNeeded().catch(() => {});
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (fbUnsubRef.current) fbUnsubRef.current();
    };
  }, []);

  const activeRoom = useMemo(() => ROOMS.find((r) => r.id === activeRoomId) || null, [activeRoomId]);
  const currentMessages = useMemo(() => (activeRoomId ? messagesByRoom[activeRoomId] || [] : []), [activeRoomId, messagesByRoom]);

  // ── Enter room ─────────────────────────────────────────────────────────────
  const enterRoom = useCallback((roomId: string) => {
    setActiveRoomId(roomId);
    setInputText('');
    setIsTyping(false);
    HapticsService.impact('medium');
    // Unsubscribe previous room listener
    if (fbUnsubRef.current) { fbUnsubRef.current(); fbUnsubRef.current = null; }
    // Subscribe to Firebase messages for this room
    fbUnsubRef.current = ChatService.listenToMessages(roomId, (fbMsgs: FBChatMessage[]) => {
      if (fbMsgs.length === 0) return; // Keep seed messages if no Firebase data
      const mapped: ChatMessage[] = fbMsgs.map(m => {
        const t = new Date(m.createdAt);
        const timeStr = `${t.getHours().toString().padStart(2,'0')}:${t.getMinutes().toString().padStart(2,'0')}`;
        return {
          id: m.id,
          author: m.authorName,
          isOwn: currentUser?.uid ? m.authorId === currentUser.uid : false,
          text: m.text,
          time: timeStr,
        };
      });
      setMessagesByRoom(prev => ({ ...prev, [roomId]: mapped }));
    });
  }, [currentUser?.uid]);

  const leaveRoom = useCallback(() => {
    setActiveRoomId(null);
    setIsTyping(false);
    HapticsService.impact('light');
    if (fbUnsubRef.current) { fbUnsubRef.current(); fbUnsubRef.current = null; }
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const text = inputText.trim();
    if (text.length < 2 || !activeRoomId) return;

    HapticsService.impact('medium');
    setInputText('');

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      author: currentUser?.displayName ?? 'Ty',
      isOwn: true,
      text,
      time: timeStr,
    };

    // Write to Firebase (real-time listener will update UI)
    if (currentUser && activeRoomId) {
      ChatService.sendMessage(activeRoomId, text, {
        uid: currentUser.uid,
        displayName: currentUser.displayName,
        avatarEmoji: currentUser.avatarEmoji ?? '🌙',
      }).catch(() => {});
    }

    setMessagesByRoom((prev) => ({
      ...prev,
      [activeRoomId]: [...(prev[activeRoomId] || []), newMsg],
    }));

    // Scroll to bottom
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    // Fake typing indicator
    const replyAuthor = getRandomAuthor('Ty');
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setTypingAuthor(replyAuthor);
      setIsTyping(true);
    }, 1500);

    // Auto reply
    const delay = 2800 + Math.random() * 1200;
    if (replyTimerRef.current) clearTimeout(replyTimerRef.current);
    replyTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      const replies = getAutoReplies(activeRoomId);
      const replyText = replies[Math.floor(Math.random() * replies.length)];
      const replyNow = new Date();
      const replyTime = `${replyNow.getHours().toString().padStart(2, '0')}:${replyNow.getMinutes().toString().padStart(2, '0')}`;

      const replyMsg: ChatMessage = {
        id: `reply_${Date.now()}`,
        author: replyAuthor,
        isOwn: false,
        text: replyText,
        time: replyTime,
        isSymbolQuote: replyText.startsWith('✦'),
      };

      setMessagesByRoom((prev) => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), replyMsg],
      }));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, delay);
  }, [inputText, activeRoomId]);

  // ── Reaction ───────────────────────────────────────────────────────────────
  const handleLongPress = useCallback((msgId: string) => {
    HapticsService.impact('medium');
    setReactionTarget(msgId);
    setReactionMenu({ msgId, x: 0, y: 0 });
  }, []);

  const handleReactionSelect = useCallback(
    (reaction: string) => {
      if (!reactionTarget || !activeRoomId) return;
      setMessagesByRoom((prev) => {
        const msgs = prev[activeRoomId] || [];
        return {
          ...prev,
          [activeRoomId]: msgs.map((m) =>
            m.id === reactionTarget
              ? { ...m, reactions: [...(m.reactions || []), reaction] }
              : m,
          ),
        };
      });
      setReactionMenu(null);
      setReactionTarget(null);
    },
    [reactionTarget, activeRoomId],
  );

  // ── Scroll to bottom when entering room ───────────────────────────────────
  useEffect(() => {
    if (activeRoomId) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
  }, [activeRoomId]);

  // ── Create room ────────────────────────────────────────────────────────────
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) return;
    if (!currentUser) { Alert.alert(t('communityChat.wymagane_logowanie', 'Wymagane logowanie'), t('communityChat.zaloguj_sie_aby_tworzyc_pokoje', 'Zaloguj się, aby tworzyć pokoje.')); return; }
    setCreatingRoom(true);
    try {
      const result = await ChatService.createRoom({
        name: newRoomName.trim(),
        emoji: newRoomEmoji,
        description: newRoomDesc.trim(),
        isPrivate: newRoomPrivate,
        creatorId: currentUser.uid,
        creatorName: currentUser.displayName,
      });
      HapticsService.notify();
      setCreatedInviteCode(result.inviteCode);
      setNewRoomName(''); setNewRoomDesc(''); setNewRoomEmoji('💬'); setNewRoomPrivate(false);
    } catch {
      Alert.alert(t('communityChat.blad', 'Błąd'), t('communityChat.nie_udalo_sie_utworzyc_pokoju', 'Nie udało się utworzyć pokoju. Spróbuj ponownie.'));
    } finally {
      setCreatingRoom(false);
    }
  }, [newRoomName, newRoomDesc, newRoomEmoji, newRoomPrivate, currentUser]);

  // ── Join by code ───────────────────────────────────────────────────────────
  const handleJoinByCode = useCallback(async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) return;
    if (!currentUser) { Alert.alert(t('communityChat.wymagane_logowanie_1', 'Wymagane logowanie'), t('communityChat.zaloguj_sie_aby_dolaczyc_do', 'Zaloguj się, aby dołączyć do pokoju.')); return; }
    setJoiningCode(true);
    try {
      const result = await ChatService.joinByCode(code, { uid: currentUser.uid, displayName: currentUser.displayName });
      if (result.success && result.roomId) {
        HapticsService.notify();
        setShowJoinCode(false);
        setJoinCode('');
        Alert.alert('Dołączono!', `Witaj w pokoju „${result.roomName ?? result.roomId}"!`);
      } else {
        Alert.alert(t('communityChat.nieprawidl_kod', 'Nieprawidłowy kod'), t('communityChat.nie_znaleziono_pokoju_dla_podanego', 'Nie znaleziono pokoju dla podanego kodu.'));
      }
    } catch {
      Alert.alert(t('communityChat.blad_1', 'Błąd'), t('communityChat.nie_udalo_sie_dolaczyc_do', 'Nie udało się dołączyć do pokoju.'));
    } finally {
      setJoiningCode(false);
    }
  }, [joinCode, currentUser]);

  // ── Share invite code ──────────────────────────────────────────────────────
  const handleShareCode = useCallback((code: string, roomName?: string) => {
    const msg = `Dołącz do pokoju „${roomName ?? 'Aethera'}" w aplikacji Aethera!\nKod: ${code}\nhttps://aethera.app/room/${code}`;
    Share.share({ message: msg, title: 'Zaproszenie do pokoju Aethera' });
  }, []);

  // ── Presence pulse ─────────────────────────────────────────────────────────
  const presencePulse = useSharedValue(1);
  useEffect(() => {
    presencePulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const presenceStyle = useAnimatedStyle(() => ({ transform: [{ scale: presencePulse.value }] }));

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 2: Chat Room
  // ─────────────────────────────────────────────────────────────────────────
  if (activeRoom) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: currentTheme.background }}>
        {/* Background gradient */}
        <LinearGradient
          colors={
            isLight
              ? [currentTheme.background, activeRoom.color + '08', currentTheme.background]
              : [currentTheme.background, activeRoom.color + '12', currentTheme.background]
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.header, { borderBottomColor: cardBorder }]}>
          <Pressable onPress={leaveRoom} style={styles.headerBtn} hitSlop={8}>
            <ChevronLeft size={24} color={textColor} />
          </Pressable>

          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 22 }}>{activeRoom.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textColor }} numberOfLines={1}>
                {activeRoom.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' }} />
                <Text style={{ fontSize: 12, color: '#22C55E', fontWeight: '600' }}>
                  {activeRoom.online.toLocaleString(getLocaleCode())} online
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.headerBtn, { backgroundColor: activeRoom.color + '20', borderRadius: 10 }]}
            hitSlop={8}
            onPress={async () => {
              HapticsService.impact('light');
              // Generate/show invite code for this room
              try {
                const code = await ChatService.generateInviteCode(activeRoomId!);
                setCurrentRoomInviteCode(code);
                setShowRoomOptions(true);
              } catch { setShowRoomOptions(true); }
            }}
          >
            <MoreVertical size={20} color={activeRoom.color} />
          </Pressable>
        </Animated.View>

        {/* Reaction menu overlay */}
        {reactionMenu && (
          <ReactionMenu
            visible={true}
            onSelect={handleReactionSelect}
            onClose={() => { setReactionMenu(null); setReactionTarget(null); }}
            isLight={isLight}
          />
        )}

        {/* Message list */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: SP, paddingTop: 16, paddingBottom: 8 }}
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {currentMessages.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 40, opacity: 0.5 }}>
                <Circle size={40} color={isLight ? '#666' : '#888'} />
                <Text style={{ color: isLight ? '#666' : '#888', marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                  {t('communityChat.nikt_jeszcze_nie_napisal_zacznij', 'Nikt jeszcze nie napisał. Zacznij rozmowę!')}
                </Text>
              </View>
            )}
            {currentMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isLight={isLight}
                roomColor={activeRoom.color}
                onLongPress={handleLongPress}
              />
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <Animated.View entering={FadeInDown.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: AVATARS[typingAuthor] || '#6366F1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>
                    {typingAuthor[0]}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isLight ? 'rgba(255,248,236,0.95)' : 'rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: subColor, marginRight: 4 }}>{typingAuthor} {t('communityChat.pisze', 'pisze')}</Text>
                  <TypingDots color={activeRoom.color} />
                </View>
              </Animated.View>
            )}

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* Input row */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,10,30,0.95)',
                borderTopColor: cardBorder,
                paddingBottom: Math.max(insets.bottom, 8) + 4,
              },
            ]}
          >
            {/* Emoji button */}
            <Pressable
              onPress={() => HapticsService.impact('light')}
              style={[styles.inputIconBtn, { backgroundColor: inputBg, borderColor: cardBorder }]}
            >
              <Smile size={20} color={subColor} />
            </Pressable>

            {/* Text input */}
            <TextInput
              ref={inputRef}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              placeholder={t('communityChat.napisz_wiadomosc', 'Napisz wiadomość...')}
              placeholderTextColor={subColor}
              style={[
                styles.textInput,
                {
                  backgroundColor: inputBg,
                  borderColor: cardBorder,
                  color: textColor,
                },
              ]}
              multiline
              maxLength={500}
              returnKeyType="send"
            />

            {/* Share button */}
            <Pressable
              onPress={() => HapticsService.impact('light')}
              style={[styles.inputIconBtn, { backgroundColor: inputBg, borderColor: cardBorder }]}
            >
              <Share2 size={18} color={subColor} />
            </Pressable>

            {/* Send button */}
            <Pressable
              onPress={sendMessage}
              disabled={inputText.trim().length < 2}
            >
              <LinearGradient
                colors={inputText.trim().length >= 2 ? ['#CEAE72', '#B8943E'] : ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.10)']}
                style={[styles.sendBtn, { opacity: inputText.trim().length >= 2 ? 1 : 0.4 }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Send size={18} color={inputText.trim().length >= 2 ? '#1A1208' : (isLight ? '#555' : '#AAA')} />
              </LinearGradient>
            </Pressable>
          </View>
        </KeyboardAvoidingView>

        {/* ── Room options modal ─────────────────────────────────── */}
        <Modal visible={showRoomOptions} transparent animationType="slide">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: isLight ? '#F8F4EE' : '#120E20', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Math.max(insets.bottom + 16, 32), borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.25)' : 'rgba(206,174,114,0.18)' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 24 }}>{activeRoom?.emoji}</Text>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: textColor }}>{activeRoom?.name}</Text>
                </View>
                <Pressable onPress={() => setShowRoomOptions(false)} hitSlop={10}><X size={22} color={subColor} /></Pressable>
              </View>
              {currentRoomInviteCode && (
                <>
                  <Text style={{ fontSize: 11, letterSpacing: 2, fontWeight: '700', color: subColor, marginBottom: 8 }}>{t('communityChat.kod_zaproszeni', 'KOD ZAPROSZENIA')}</Text>
                  <LinearGradient colors={['rgba(206,174,114,0.20)', 'rgba(206,174,114,0.08)']} style={{ borderRadius: 16, borderWidth: 1, borderColor: 'rgba(206,174,114,0.35)', padding: 16, alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ fontSize: 28, fontWeight: '800', color: textColor, letterSpacing: 6 }}>{currentRoomInviteCode}</Text>
                  </LinearGradient>
                  <Pressable onPress={() => handleShareCode(currentRoomInviteCode, activeRoom?.name)} style={{ marginBottom: 8 }}>
                    <LinearGradient colors={['#CEAE72', '#B8943E']} style={{ borderRadius: 14, paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                      <Share2 size={16} color="#1A1208" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1208' }}>{t('communityChat.zapros_przez_link', 'Zaproś przez link')}</Text>
                    </LinearGradient>
                  </Pressable>
                </>
              )}
              <Pressable onPress={() => { setShowRoomOptions(false); leaveRoom(); }}
                style={{ borderRadius: 14, borderWidth: 1, borderColor: '#EF4444' + '40', paddingVertical: 13, alignItems: 'center', backgroundColor: '#EF4444' + '0E' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#EF4444' }}>{t('communityChat.opusc_pokoj', 'Opuść pokój')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // VIEW 1: Rooms List
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: currentTheme.background }}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          isLight
            ? [currentTheme.background, '#EEF2FF', currentTheme.background]
            : ['#0B0A14', '#0F0A20', '#0B0A14']
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(300)} style={[styles.header, { borderBottomColor: cardBorder }]}>
        <Pressable
          onPress={() => {
            HapticsService.impact('light');
            goBackOrToMainTab(navigation, 'Worlds');
          }}
          style={styles.headerBtn}
          hitSlop={8}
        >
          <ChevronLeft size={24} color={textColor} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: textColor }]}>{t('communityChat.czaty_wspolnoty', 'CZATY WSPÓLNOTY')}</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pressable
            onPress={() => {
              HapticsService.impact('light');
              if (isFavoriteItem('community-chat')) { removeFavoriteItem('community-chat'); } else { addFavoriteItem({ id: 'community-chat', label: 'Czaty Wspólnoty', route: 'CommunityChat', icon: 'Users', color: '#6366F1', addedAt: Date.now() }); }
            }}
            style={{ padding: 8 }}
          >
            <Star size={20} color="#F59E0B" fill={isFavoriteItem('community-chat') ? '#F59E0B' : 'none'} />
          </Pressable>
          <Pressable
            style={[styles.headerBtn, { backgroundColor: cardBg, borderRadius: 10, borderWidth: 1, borderColor: cardBorder }]}
            hitSlop={8}
            onPress={() => HapticsService.impact('light')}
          >
            <Users size={18} color={textColor} />
            <Text style={{ fontSize: 11, color: textColor, fontWeight: '700', marginLeft: 3 }}>1,247</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* FAB row — Utwórz pokój + Dołącz przez kod */}
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={{ flexDirection: 'row', paddingHorizontal: SP, paddingVertical: 12, gap: 10 }}
      >
        <Pressable onPress={() => { HapticsService.impact('medium'); setShowJoinCode(true); }}>
          <LinearGradient
            colors={isLight ? ['rgba(99,102,241,0.15)', 'rgba(99,102,241,0.08)'] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.fabInner, { borderWidth: 1, borderColor: isLight ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.18)' }]}
          >
            <Hash size={18} color={isLight ? '#6366F1' : '#A5B4FC'} strokeWidth={2} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: isLight ? '#6366F1' : '#A5B4FC', letterSpacing: 0.3 }}>
              {t('communityChat.kod', 'Kod')}
            </Text>
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => { HapticsService.impact('medium'); setShowCreateRoom(true); }}>
          <LinearGradient
            colors={['#CEAE72', '#B8943E']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Plus size={20} color="#1A1208" strokeWidth={2.5} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1208', letterSpacing: 0.3 }}>
              {t('communityChat.nowy_pokoj', 'Nowy pokój')}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SP, paddingBottom: insets.bottom + 24 }}
      >
        {/* Online presence bar */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(400)}
          style={[styles.presenceBar, { backgroundColor: cardBg, borderColor: cardBorder }]}
        >
          <Animated.View style={presenceStyle}>
            <PulseDot color="#22C55E" />
          </Animated.View>
          <Text style={{ flex: 1, fontSize: 14, color: textColor, fontWeight: '500', marginLeft: 8 }}>
            {t('communityChat.1_247_dusz_online_teraz', '1,247 dusz online teraz')}
          </Text>
          <OnlineOrb />
        </Animated.View>

        {/* Category filter chips */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(400)}
          style={styles.categoryRow}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 22 }}>
            {ROOM_CATEGORIES.map((cat) => {
              const active = activeCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    HapticsService.selection();
                    setActiveCategory(cat);
                  }}
                  style={[
                    styles.categoryChip,
                    {
                      backgroundColor: active
                        ? '#6366F1'
                        : isLight
                        ? 'rgba(255,246,230,0.92)'
                        : 'rgba(255,255,255,0.08)',
                      borderColor: active ? '#6366F1' : cardBorder,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: active ? '700' : '500',
                      color: active ? '#FFF' : subColor,
                      letterSpacing: 0.2,
                    }}
                  >
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Section label */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)} style={{ marginBottom: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: subColor, letterSpacing: 1.5 }}>
            {t('communityChat.pokoje_rozmow', 'POKOJE ROZMÓW')}
          </Text>
        </Animated.View>

        {/* Room list */}
        {ROOMS.map((room, index) => (
          <RoomCard
            key={room.id}
            room={room}
            index={index}
            isLight={isLight}
            onPress={() => enterRoom(room.id)}
          />
        ))}

        <EndOfContentSpacer />
      </ScrollView>

      {/* ── Modal: Utwórz pokój ─────────────────────────────────── */}
      <Modal visible={showCreateRoom} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isLight ? '#F8F4EE' : '#120E20', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Math.max(insets.bottom + 16, 32), borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.25)' : 'rgba(206,174,114,0.18)' }}>
            {createdInviteCode ? (
              <>
                {/* Invite code display */}
                <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>🎉</Text>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textColor, marginBottom: 4 }}>{t('communityChat.pokoj_stworzony', 'Pokój stworzony!')}</Text>
                  <Text style={{ fontSize: 13, color: subColor, textAlign: 'center', marginBottom: 20 }}>{t('communityChat.udostepnij_kod_aby_zaprosic_innych', 'Udostępnij kod, aby zaprosić innych użytkowników Aethera.')}</Text>
                  <LinearGradient colors={['rgba(206,174,114,0.22)', 'rgba(206,174,114,0.10)']} style={{ borderRadius: 18, borderWidth: 1, borderColor: 'rgba(206,174,114,0.40)', padding: 20, alignItems: 'center', width: '100%', marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, letterSpacing: 2.5, fontWeight: '700', color: '#CEAE72', marginBottom: 8 }}>{t('communityChat.kod_zaproszeni_1', 'KOD ZAPROSZENIA')}</Text>
                    <Text style={{ fontSize: 32, fontWeight: '800', color: textColor, letterSpacing: 6 }}>{createdInviteCode}</Text>
                  </LinearGradient>
                  <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                    <Pressable onPress={() => handleShareCode(createdInviteCode)} style={{ flex: 1 }}>
                      <LinearGradient colors={['#CEAE72', '#B8943E']} style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                        <Share2 size={16} color="#1A1208" />
                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A1208' }}>{t('communityChat.udostepnij', 'Udostępnij')}</Text>
                      </LinearGradient>
                    </Pressable>
                    <Pressable onPress={() => { setCreatedInviteCode(null); setShowCreateRoom(false); }} style={{ flex: 1, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, alignItems: 'center', justifyContent: 'center', paddingVertical: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: textColor }}>{t('communityChat.gotowe', 'Gotowe')}</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{t('communityChat.utworz_pokoj', 'Utwórz pokój')}</Text>
                  <Pressable onPress={() => setShowCreateRoom(false)} hitSlop={10}><X size={22} color={subColor} /></Pressable>
                </View>
                {/* Emoji picker */}
                <Text style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: subColor, marginBottom: 8 }}>{t('communityChat.emoji_pokoju', 'EMOJI POKOJU')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingRight: 22 }}>
                  {['💬','🔮','🧘','🌙','⭐','🔥','💜','🌸','🌊','✨','🌿','🦋','🏔','🌺','🎭'].map(e => (
                    <Pressable key={e} onPress={() => { setNewRoomEmoji(e); HapticsService.impact('light'); }}
                      style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: newRoomEmoji === e ? 'rgba(206,174,114,0.25)' : cardBg, borderWidth: 1.5, borderColor: newRoomEmoji === e ? '#CEAE72' : cardBorder }}>
                      <Text style={{ fontSize: 22 }}>{e}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {/* Name */}
                <Text style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: subColor, marginBottom: 6 }}>{t('communityChat.nazwa_pokoju', 'NAZWA POKOJU')}</Text>
                <TextInput value={newRoomName} onChangeText={setNewRoomName} placeholder={t('communityChat.np_medytacja_poranna', 'Np. Medytacja poranna...')} placeholderTextColor={subColor}
                  style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: cardBorder, color: textColor, fontSize: 15, padding: 12, marginBottom: 12 }} />
                {/* Description */}
                <Text style={{ fontSize: 11, letterSpacing: 1.5, fontWeight: '700', color: subColor, marginBottom: 6 }}>{t('communityChat.opis_opcjonalny', 'OPIS (opcjonalny)')}</Text>
                <TextInput value={newRoomDesc} onChangeText={setNewRoomDesc} placeholder={t('communityChat.o_czym_jest_ten_pokoj', 'O czym jest ten pokój?')} placeholderTextColor={subColor} multiline
                  style={{ backgroundColor: cardBg, borderRadius: 12, borderWidth: 1, borderColor: cardBorder, color: textColor, fontSize: 14, padding: 12, minHeight: 64, textAlignVertical: 'top', marginBottom: 14 }} />
                {/* Private toggle */}
                <Pressable onPress={() => { setNewRoomPrivate(p => !p); HapticsService.impact('light'); }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: newRoomPrivate ? 'rgba(206,174,114,0.45)' : cardBorder, backgroundColor: newRoomPrivate ? 'rgba(206,174,114,0.10)' : cardBg, marginBottom: 16 }}>
                  {newRoomPrivate ? <Lock size={18} color="#CEAE72" /> : <Globe size={18} color={subColor} />}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: newRoomPrivate ? '#CEAE72' : textColor }}>{newRoomPrivate ? t('communityChat.pokoj_prywatny', 'Pokój prywatny') : t('communityChat.pokoj_publiczny', 'Pokój publiczny')}</Text>
                    <Text style={{ fontSize: 12, color: subColor }}>{newRoomPrivate ? t('communityChat.tylko_z_kodem', 'Tylko z kodem zaproszenia') : t('communityChat.widoczny_dla_wszystkich', 'Widoczny dla wszystkich')}</Text>
                  </View>
                  <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: newRoomPrivate ? '#CEAE72' : 'transparent', borderWidth: 2, borderColor: newRoomPrivate ? '#CEAE72' : cardBorder, alignItems: 'center', justifyContent: 'center' }}>
                    {newRoomPrivate && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A1208' }} />}
                  </View>
                </Pressable>
                {/* Create button */}
                <Pressable onPress={handleCreateRoom} disabled={!newRoomName.trim() || creatingRoom}>
                  <LinearGradient colors={newRoomName.trim() ? ['#CEAE72', '#B8943E'] : ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.10)']} style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: newRoomName.trim() ? '#1A1208' : subColor }}>{creatingRoom ? t('communityChat.tworzenie', 'Tworzenie...') : t('communityChat.utworz_pokoj_btn', 'Utwórz pokój')}</Text>
                  </LinearGradient>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Modal: Dołącz przez kod ─────────────────────────────── */}
      <Modal visible={showJoinCode} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isLight ? '#F8F4EE' : '#120E20', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Math.max(insets.bottom + 16, 32), borderTopWidth: 1, borderTopColor: isLight ? 'rgba(139,100,42,0.25)' : 'rgba(206,174,114,0.18)' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>{t('communityChat.dolacz_przez_kod', 'Dołącz przez kod')}</Text>
              <Pressable onPress={() => { setShowJoinCode(false); setJoinCode(''); }} hitSlop={10}><X size={22} color={subColor} /></Pressable>
            </View>
            <Text style={{ fontSize: 13, color: subColor, marginBottom: 20 }}>{t('communityChat.wpisz_6_znakowy_kod_zaproszeni', 'Wpisz 6-znakowy kod zaproszenia otrzymany od innego użytkownika Aethera.')}</Text>
            <TextInput
              value={joinCode} onChangeText={v => setJoinCode(v.toUpperCase())}
              placeholder={t('communityChat.np_ab1c2d', 'np. AB1C2D')} placeholderTextColor={subColor}
              autoCapitalize="characters" maxLength={6}
              style={{ backgroundColor: cardBg, borderRadius: 14, borderWidth: 1.5, borderColor: joinCode.length >= 4 ? '#CEAE72' : cardBorder, color: textColor, fontSize: 24, fontWeight: '800', textAlign: 'center', letterSpacing: 6, padding: 16, marginBottom: 16 }}
            />
            <Pressable onPress={handleJoinByCode} disabled={joinCode.trim().length < 4 || joiningCode}>
              <LinearGradient colors={joinCode.trim().length >= 4 ? ['#CEAE72', '#B8943E'] : ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.10)']} style={{ borderRadius: 14, paddingVertical: 15, alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: joinCode.trim().length >= 4 ? '#1A1208' : subColor }}>{joiningCode ? t('communityChat.dolaczanie', 'Dołączanie...') : t('communityChat.dolacz_do_pokoju_btn', 'Dołącz do pokoju')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  presenceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 16,
    marginBottom: 16,
    gap: 4,
  },
  categoryRow: {
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  fab: {
    position: 'absolute',
    right: SP,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 28,
    shadowColor: '#CEAE72',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: SP,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
