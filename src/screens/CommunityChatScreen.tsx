// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
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

  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';

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
              style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)', marginBottom: 2 }}
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
                color: isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.40)',
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {room.lastMsg}
            </Text>
          </View>

          {/* Time + arrow */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.35)' }}>
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
            backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)', letterSpacing: 1 }}>
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
          <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.30)', marginTop: 3, marginRight: 4 }}>
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
        <Text style={{ fontSize: 12, color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)', marginBottom: 3, marginLeft: 4 }}>
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
              backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)',
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

        <Text style={{ fontSize: 11, color: isLight ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.28)', marginTop: 3, marginLeft: 4 }}>
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
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
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
  const { themeName, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const { currentUser } = useAuthStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const textColor = isLight ? '#1A1A2E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.55)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.10)';
  const inputBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)';

  // ── View state ─────────────────────────────────────────────────────────────
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('Wszystkie');

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
          isOwn: currentUser ? m.authorId === currentUser.uid : false,
          text: m.text,
          time: timeStr,
        };
      });
      setMessagesByRoom(prev => ({ ...prev, [roomId]: mapped }));
    });
  }, [currentUser]);

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
            onPress={() => HapticsService.impact('light')}
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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                  Nikt jeszcze nie napisał. Zacznij rozmowę!
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
                    backgroundColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
                    borderRadius: 18,
                    borderBottomLeftRadius: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: subColor, marginRight: 4 }}>{typingAuthor} pisze</Text>
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
              placeholder="Napisz wiadomość..."
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

        <Text style={[styles.headerTitle, { color: textColor }]}>CZATY WSPÓLNOTY</Text>

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SP, paddingBottom: insets.bottom + 100 }}
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
            1,247 dusz online teraz
          </Text>
          <OnlineOrb />
        </Animated.View>

        {/* Category filter chips */}
        <Animated.View
          entering={FadeInDown.delay(140).duration(400)}
          style={styles.categoryRow}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
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
                        ? 'rgba(0,0,0,0.06)'
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
            POKOJE ROZMÓW
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

      {/* FAB — Utwórz pokój */}
      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={[
          styles.fab,
          { bottom: insets.bottom + 90 },
        ]}
      >
        <Pressable
          onPress={() => HapticsService.impact('medium')}
        >
          <LinearGradient
            colors={['#CEAE72', '#B8943E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabInner}
          >
            <Plus size={20} color="#1A1208" strokeWidth={2.5} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A1208', letterSpacing: 0.3 }}>
              Utwórz pokój
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
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
