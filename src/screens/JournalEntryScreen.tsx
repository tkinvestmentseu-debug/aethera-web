import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  Feather,
  Sun,
  Moon,
  Shield,
  Star,
  Hash,
  Wand2,
  BookOpen,
  Lock,
  Unlock,
  Tag,
  Zap,
  Eye,
  Heart,
  Flower2,
  HelpCircle,
  Layers,
  AlignLeft,
  CornerDownLeft,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { JournalEntryType, useJournalStore } from '../store/useJournalStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { HapticsService } from '../core/services/haptics.service';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../core/hooks/useTheme';
// ── Extended entry types ─────────────────────────────────────────────────────
const ENTRY_TYPES: {
  id: JournalEntryType;
  label: string;
  emoji: string;
  icon: typeof Feather;
  color: string;
}[] = [
  { id: 'reflection', label: 'Refleksja', emoji: '🪞', icon: Feather, color: '#A78BFA' },
  { id: 'dream', label: 'Sen', emoji: '🌙', icon: Moon, color: '#818CF8' },
  { id: 'gratitude', label: 'Wdzięczność', emoji: '🌟', icon: Sun, color: '#FCD34D' },
  { id: 'shadow_work', label: 'Emocje', emoji: '💙', icon: Shield, color: '#FB7185' },
  { id: 'tarot', label: 'Objawienie', emoji: '⚡', icon: Zap, color: '#34D399' },
  { id: 'affirmation', label: 'Wizja', emoji: '👁️', icon: Eye, color: '#60A5FA' },
  { id: 'matrix', label: 'Modlitwa', emoji: '🕯️', icon: Heart, color: '#F9A8D4' },
  // extra types stored as known keys, mapped via label override
  { id: 'reflection', label: 'Rytuał', emoji: '🔥', icon: Flower2, color: '#FB923C' },
  { id: 'dream', label: 'Synchroniczność', emoji: '🌀', icon: Layers, color: '#67E8F9' },
  { id: 'affirmation', label: 'Pytanie', emoji: '❓', icon: HelpCircle, color: '#C4B5FD' },
];

// De-duplicated list for rendering — we use index-based selection since labels differ
const ALL_ENTRY_TYPE_DEFS = [
  { id: 'reflection' as JournalEntryType, label: 'Refleksja', emoji: '🪞', color: '#A78BFA' },
  { id: 'dream' as JournalEntryType, label: 'Sen', emoji: '🌙', color: '#818CF8' },
  { id: 'shadow_work' as JournalEntryType, label: 'Rytuał', emoji: '🔥', color: '#FB923C' },
  { id: 'shadow_work' as JournalEntryType, label: 'Emocje', emoji: '💙', color: '#FB7185' },
  { id: 'tarot' as JournalEntryType, label: 'Objawienie', emoji: '⚡', color: '#34D399' },
  { id: 'affirmation' as JournalEntryType, label: 'Wizja', emoji: '👁️', color: '#60A5FA' },
  { id: 'gratitude' as JournalEntryType, label: 'Wdzięczność', emoji: '🌟', color: '#FCD34D' },
  { id: 'matrix' as JournalEntryType, label: 'Modlitwa', emoji: '🕯️', color: '#F9A8D4' },
  { id: 'reflection' as JournalEntryType, label: 'Synchroniczność', emoji: '🌀', color: '#67E8F9' },
  { id: 'affirmation' as JournalEntryType, label: 'Pytanie', emoji: '❓', color: '#C4B5FD' },
];

// ── Mood options ─────────────────────────────────────────────────────────────
const MOODS = [
  { id: 'spokój', emoji: '😌', label: 'Spokój' },
  { id: 'przepływ', emoji: '🌊', label: 'Przepływ' },
  { id: 'energia', emoji: '🔥', label: 'Energia' },
  { id: 'napięcie', emoji: '⚡', label: 'Napięcie' },
  { id: 'cisza', emoji: '🌙', label: 'Cisza' },
  { id: 'mgła', emoji: '☁️', label: 'Mgła' },
  { id: 'jasność', emoji: '🌟', label: 'Jasność' },
  { id: 'smutek', emoji: '😞', label: 'Smutek' },
];

// ── Emoji tags ────────────────────────────────────────────────────────────────
const PRESET_TAGS = ['🌙', '⭐', '🔥', '💙', '🌿', '🎯', '💫', '🕯️'];

// ── Entry templates ───────────────────────────────────────────────────────────
const ENTRY_TEMPLATES: { id: string; label: string; emoji: string; color: string; content: string }[] = [
  {
    id: 'morning',
    label: 'Poranek',
    emoji: '🌅',
    color: '#FBBF24',
    content: 'STAN NA DZIŚ RANO:\n\n\nPRIORYTET DNIA:\n\n\nINTENCJA:\n\n',
  },
  {
    id: 'evening',
    label: 'Wieczór',
    emoji: '🌙',
    color: '#818CF8',
    content: 'CO DZIŚ PRZYNIOSŁO MI ENERGIĘ:\n\n\nCO WYCZERPAŁO:\n\n\nNAJWAŻNIEJSZA LEKCJA:\n\n',
  },
  {
    id: 'ritual',
    label: 'Rytuał',
    emoji: '🕯️',
    color: '#FB923C',
    content: 'RYTUAŁ / PRAKTYKA:\n\n\nCO POCZUŁEM/AM:\n\n\nCO PROSZĘ PUŚCIĆ:\n\n\nCO ZAPRASZAM:\n\n',
  },
  {
    id: 'dream',
    label: 'Sen',
    emoji: '💭',
    color: '#67E8F9',
    content: 'OBRAZY / SCENY:\n\n\nEMOCJE WE ŚNIE:\n\n\nSYMBOLE:\n\n\nPRZESŁANIE:\n\n',
  },
  {
    id: 'sync',
    label: 'Synchronia',
    emoji: '🌀',
    color: '#C4B5FD',
    content: 'CO WYDARZYŁO SIĘ:\n\n\nJAK TO CZUJĘ:\n\n\nCO TO MOŻE OZNACZAĆ:\n\n\nJAK ODPOWIEM:\n\n',
  },
];

// ── Prompts per type ──────────────────────────────────────────────────────────
const TYPE_PROMPTS: Record<JournalEntryType, string[]> = {
  reflection: [
    'Co dziś najbardziej poruszyło się w Tobie pod powierzchnią wydarzeń?',
    'Które myśli wracały dziś najczęściej — i co za nimi stoi?',
    'Czego nie powiedziałeś na głos, choć chciałeś?',
    'Co zauważyłeś w sobie, czego wcześniej nie dostrzegałeś?',
  ],
  dream: [
    'Jaki obraz, symbol lub emocja ze snu nadal chce zostać z Tobą?',
    'Gdyby ten sen był wiadomością — co by mówił?',
    'Co w tym śnie czuło się jak Twoje, a co obce?',
    'Jaką emocję zabrałeś ze snu do przebudzenia?',
  ],
  gratitude: [
    'Za co chcesz dziś podziękować, zanim dzień całkiem się zamknie?',
    'Które trzy rzeczy dziś dodały Ci siły, nawet jeśli były małe?',
    'Co wzięłeś dziś za pewnik, a zasługuje na chwilę uwagi?',
    'Komu chciałbyś dziś powiedzieć dziękuję — i za co dokładnie?',
  ],
  shadow_work: [
    'Jaka prawda domaga się dziś odwagi, szczerości i spokojnego nazwania?',
    'Co w zachowaniu innych Cię dzisiaj irytowało — i co to mówi o Tobie?',
    'Jakiego uczucia unikasz od dłuższego czasu?',
    'Która część Ciebie domaga się dziś uwagi, choć jej się wstydzisz?',
  ],
  tarot: [
    'Co ten odczyt otworzył w Tobie głębiej niż samo pytanie?',
    'Która karta wciąż tkwi w myślach — i dlaczego właśnie ona?',
    'Co symbolika dzisiejszego układu mówi o tym etapie Twojego życia?',
  ],
  matrix: [
    'Który motyw z Twojej matrycy wraca dziś najmocniej w życiu?',
    'Jak rozumiesz dziś swoją ścieżkę karmiczną przez pryzmat matrycy?',
    'Co chcesz ofiarować — bez oczekiwania odpowiedzi?',
  ],
  affirmation: [
    'Jakie zdanie naprawdę zostało z Tobą po pracy z afirmacją?',
    'Co chcesz po prostu zapisać — bez celu, bez struktury, tylko dla siebie?',
    'Które słowa, obrazy lub myśli dzisiaj wymagają miejsca na kartce?',
  ],
};

const getPromptForType = (type: JournalEntryType, override?: string): string => {
  if (override) return override;
  const prompts = TYPE_PROMPTS[type] || TYPE_PROMPTS.reflection;
  const dayIndex = new Date().getDate() % prompts.length;
  return prompts[dayIndex];
};

// ── Guided prompts per type ───────────────────────────────────────────────────
const GUIDED_PROMPTS_MAP: Record<string, string[]> = {
  reflection: [
    'Opisz moment z ostatnich 24 godzin, który wciąż rezonuje w Twoim ciele.',
    'Jakie przekonanie o sobie chce być dziś zakwestionowane?',
    'Gdybyś mógł/a powiedzieć sobie coś ważnego sprzed roku — co by to było?',
    'Co w Twoim zachowaniu ostatnio nie jest zgodne z Twoimi wartościami?',
    'Jakie pytanie chcesz nieść ze sobą przez najbliższy tydzień?',
  ],
  sen: [
    'Opisz sen tak szczegółowo, jak pamiętasz — każdy obraz, kolor, postać.',
    'Jakie emocje towarzyszyły Ci podczas snu i zaraz po przebudzeniu?',
    'Czy jakiś element snu pojawia się regularnie? Co może oznaczać?',
    'Które postacie ze snu są częścią Ciebie — jakie ukryte aspekty reprezentują?',
    'Gdyby sen był filmem — jaki miałby tytuł i przesłanie?',
  ],
  rytual: [
    'Co chciałeś/aś uwolnić w tym rytuale — i czy to się stało?',
    'Jakie odczucia towarzyszyły Ci w ciele podczas praktyki?',
    'Co symbolizował każdy element rytuału dla Ciebie osobiście?',
    'Co chcesz zapamiętać z tej praktyki, by wrócić do niej w trudnej chwili?',
    'Jak zmieniło się Twoje wewnętrzne nastawienie przed i po rytuale?',
  ],
  emocje: [
    'Gdzie w Twoim ciele teraz siedzi ta emocja — opisz ją fizycznie.',
    'Kiedy po raz pierwszy poczułeś/aś tę emocję w życiu?',
    'Co ta emocja chce Ci powiedzieć, zanim ją puścisz?',
    'Czy ta emocja jest Twoja, czy przejęta od kogoś z Twojego otoczenia?',
    'Co potrzebujesz teraz, by ta emocja mogła się bezpiecznie rozładować?',
  ],
  objawienie: [
    'Co dokładnie stało się lub zostało powiedziane, co wywołało ten przebłysk?',
    'Jak to objawienie zmienia Twój sposób rozumienia siebie lub sytuacji?',
    'Co musisz teraz zrobić, by nie zaprzepaścić tego wglądu?',
    'Kto lub co było narzędziem tego objawienia?',
    'Jak to objawienie łączy się z pytaniami, które niosłeś/aś w sobie?',
  ],
  wizja: [
    'Opisz wizję w czasie teraźniejszym — jesteś w niej teraz.',
    'Jakie uczucie dominuje w tej wizji — wnieś je do opisu.',
    'Co w tej wizji jest dla Ciebie największą prawdą?',
    'Jakie małe kroki prowadzą Cię od dziś do tej wizji?',
    'Co byś stracił/a, gdybyś tę wizję porzucił/a?',
  ],
  wdzięczność: [
    'Wymień 5 rzeczy z dziś, za które możesz być wdzięczny/a — im mniejsze, tym lepiej.',
    'Komu dziś pomogłeś/aś albo kto pomógł Tobie — i jak to poczułeś/aś?',
    'Za jaką trudność jesteś dziś wdzięczny/a i czego Cię nauczyła?',
    'Co w Twoim ciele i zdrowiu zasługuje dziś na wdzięczność?',
    'Wyraź wdzięczność za coś, co zwykle traktujesz jako oczywistość.',
  ],
  modlitwa: [
    'Do kogo lub czego się zwracasz — opisz to tak, jak to czujesz.',
    'Co chcesz przekazać, ofiarować lub oddać w tej modlitwie?',
    'O co prosisz i dlaczego właśnie teraz?',
    'Co chcesz wyrazić wdzięcznością, zanim poprosisz?',
    'Jaką odpowiedź/znak jesteś gotowy/a przyjąć?',
  ],
  synchroniczność: [
    'Opisz zbieżność zdarzeń, liczb lub symboli, które Cię uderzyły.',
    'Co wydarzyło się tuż przed tą synchronicznością i co po niej?',
    'Jakie pytanie niosłeś/aś w sobie, gdy synchroniczność się pojawiła?',
    'Jaką wiadomość chce Ci przekazać wszechświat przez tę zbieżność?',
    'Jak zmienia się Twoje działanie po odebraniu tego sygnału?',
  ],
  pytanie: [
    'Sformułuj pytanie tak precyzyjnie, jak potrafisz — jedno zdanie.',
    'Dlaczego to pytanie pojawia się właśnie teraz w Twoim życiu?',
    'Czego się boisz w odpowiedzi na to pytanie?',
    'Co już wiesz, a czego jeszcze nie chcesz wiedzieć?',
    'Jakie działanie wynikałoby z odpowiedzi na to pytanie?',
  ],
};

// ── Tarot card faces (face-down picker) ───────────────────────────────────────
const TAROT_CARD_OPTIONS = [
  { name: 'Głupiec', emoji: '🌀', color: '#FCD34D' },
  { name: 'Mag', emoji: '⚡', color: '#A78BFA' },
  { name: 'Kapłanka', emoji: '🌙', color: '#818CF8' },
  { name: 'Cesarzowa', emoji: '🌿', color: '#34D399' },
  { name: 'Cesarz', emoji: '🔥', color: '#FB923C' },
  { name: 'Hierofant', emoji: '🕯️', color: '#F9A8D4' },
  { name: 'Kochankowie', emoji: '💞', color: '#EC4899' },
  { name: 'Rydwan', emoji: '⚔️', color: '#60A5FA' },
  { name: 'Siła', emoji: '🦁', color: '#FBBF24' },
  { name: 'Pustelnik', emoji: '⭐', color: '#C4B5FD' },
];

// ── Parchment background ──────────────────────────────────────────────────────
const ParchmentBg = React.memo(({ isLight }: { isLight: boolean }) => (
  <LinearGradient
    colors={isLight
      ? ['#FBF6EE', '#F5EFE3', '#F0E8D8']
      : ['#07060F', '#0C0A1A', '#0F0D22']}
    style={StyleSheet.absoluteFill}
    start={{ x: 0, y: 0 }}
    end={{ x: 0.3, y: 1 }}
  />
));

// ── Main screen ───────────────────────────────────────────────────────────────
export const JournalEntryScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const { addEntry, updateEntry, entries } = useJournalStore();
  const scrollRef = useRef<ScrollView>(null);

  const entryId = route.params?.entryId as string | undefined;
  const existingEntry = entryId ? entries.find(e => e.id === entryId) : undefined;
  const isEditMode = !!existingEntry;

  const initialType = (existingEntry?.type as JournalEntryType | undefined) || (route.params?.type as JournalEntryType | undefined) || 'reflection';
  const initialPrompt = route.params?.prompt as string | undefined;
  const draft = route.params?.draft as string | undefined;

  // ── Core state ──────────────────────────────────────────────────────────────
  const initialTypeIndex = ALL_ENTRY_TYPE_DEFS.findIndex(d => d.id === initialType);
  const [typeIndex, setTypeIndex] = useState(Math.max(initialTypeIndex, 0));
  const [type, setType] = useState<JournalEntryType>(initialType);
  const [typeLabel, setTypeLabel] = useState(ALL_ENTRY_TYPE_DEFS[Math.max(initialTypeIndex, 0)].label);
  const [content, setContent] = useState(existingEntry?.content || draft || '');
  const [mood, setMood] = useState(existingEntry?.mood || '');
  const [energyLevel, setEnergyLevel] = useState(existingEntry?.energyLevel || 5);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedState, setShowSavedState] = useState(false);

  // ── Privacy ─────────────────────────────────────────────────────────────────
  const [isLocked, setIsLocked] = useState(false);

  // ── Tags ────────────────────────────────────────────────────────────────────
  const [selectedTags, setSelectedTags] = useState<string[]>(existingEntry?.tags?.filter(t => !['🃏','🔒'].includes(t)) || []);

  // ── Guided prompts ──────────────────────────────────────────────────────────
  const [showGuidedPrompts, setShowGuidedPrompts] = useState(false);
  const [guidedLoading, setGuidedLoading] = useState(false);
  const [guidedPrompts, setGuidedPrompts] = useState<string[]>([]);

  // ── Tarot card attachment ────────────────────────────────────────────────────
  const [showTarotModal, setShowTarotModal] = useState(false);
  const [attachedCard, setAttachedCard] = useState<{ name: string; emoji: string; color: string } | null>(null);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);

  // ── Template overlay ─────────────────────────────────────────────────────────
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // ── Keyboard height ──────────────────────────────────────────────────────────
  const [keyboardH, setKeyboardH] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardH(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardH(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const textColor = isLight ? '#2C1F0E' : '#F0EBE2';
  const subColor = isLight ? 'rgba(44,31,14,0.60)' : 'rgba(240,235,226,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(180,150,100,0.22)' : 'rgba(203,170,100,0.14)';
  const accent = isLight ? '#7C5A1E' : currentTheme.primary;

  const activeDef = ALL_ENTRY_TYPE_DEFS[typeIndex] ?? ALL_ENTRY_TYPE_DEFS[0];

  const sanctuaryPrompt = useMemo(
    () => getPromptForType(type, initialPrompt),
    [type, initialPrompt],
  );

  const wordCount = useMemo(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }, [content]);

  const readingMinutes = useMemo(() => Math.max(1, Math.round(wordCount / 200)), [wordCount]);

  const canSave = content.trim().length > 10;

  const focusIntoView = (y: number) => {
    setTimeout(
      () => scrollRef.current?.scrollTo({ y: Math.max(y - 150, 0), animated: true }),
      180,
    );
  };

  const handleTypeSelect = (index: number) => {
    void HapticsService.selection();
    const def = ALL_ENTRY_TYPE_DEFS[index];
    setTypeIndex(index);
    setType(def.id);
    setTypeLabel(def.label);
    setGuidedPrompts([]);
    setShowGuidedPrompts(false);
  };

  const toggleTag = (tag: string) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : prev.length < 5
          ? [...prev, tag]
          : prev,
    );
  };

  const loadGuidedPrompts = useCallback(async () => {
    setGuidedLoading(true);
    setShowGuidedPrompts(true);
    try {
      const labelKey = typeLabel.toLowerCase();
      const local = GUIDED_PROMPTS_MAP[labelKey] ?? GUIDED_PROMPTS_MAP.reflection;
      // Use local prompts for speed; fallback to AI for exotic types
      if (local) {
        setGuidedPrompts(local);
        setGuidedLoading(false);
        return;
      }
      const msgs = [
        {
          role: 'user' as const,
          content: `Podaj 5 głębokich, prowadzących pytań do pisania refleksyjnego na temat: "${typeLabel}". Odpowiedz wyłącznie jako lista 5 pytań, po jednym w linii, numerowanych 1-5. W języku użytkownika. Bez komentarzy.`,
        },
      ];
      const result = await AiService.chatWithOracle(msgs);
      const parsed = result
        .split('\n')
        .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(l => l.length > 10)
        .slice(0, 5);
      setGuidedPrompts(parsed.length > 0 ? parsed : local);
    } catch {
      const labelKey = typeLabel.toLowerCase();
      setGuidedPrompts(GUIDED_PROMPTS_MAP[labelKey] ?? GUIDED_PROMPTS_MAP.reflection);
    } finally {
      setGuidedLoading(false);
    }
  }, [typeLabel]);

  const applyTemplate = (tpl: typeof ENTRY_TEMPLATES[0]) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Medium);
    setContent(tpl.content);
    setShowTemplateModal(false);
  };

  const handleRevealCard = (index: number) => {
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Medium);
    if (!revealedCards.includes(index)) {
      setRevealedCards(prev => [...prev, index]);
    }
  };

  const handlePickCard = (card: typeof TAROT_CARD_OPTIONS[0]) => {
    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setAttachedCard(card);
    setShowTarotModal(false);
    setRevealedCards([]);
  };

  const saveEntry = () => {
    if (!canSave || isSaving) return;
    setIsSaving(true);

    const firstLine = content.split('\n').map(l => l.trim()).find(l => l.length > 0) || '';
    const inferredTitle = firstLine.slice(0, 64) || 'Prywatny zapis';
    const displayTitle = isLocked ? '🔒 ' + inferredTitle : inferredTitle;

    const entryTags = [
      ...selectedTags,
      ...(attachedCard ? ['🃏'] : []),
      ...(isLocked ? ['🔒'] : []),
    ];

    if (isEditMode && entryId) {
      updateEntry(entryId, {
        type,
        title: displayTitle,
        content: isLocked ? '🔒 ' + content.trim() : content.trim(),
        mood: mood || undefined,
        energyLevel: energyLevel,
        tags: entryTags.length > 0 ? entryTags : undefined,
      });
    } else {
      addEntry({
        type,
        title: displayTitle,
        content: isLocked ? '🔒 ' + content.trim() : content.trim(),
        mood: mood || undefined,
        energyLevel: energyLevel,
        tags: entryTags.length > 0 ? entryTags : undefined,
      });
    }

    void HapticsService.notify(Haptics.NotificationFeedbackType.Success);
    setShowSavedState(true);

    setTimeout(() => {
      if (navigation.canGoBack()) navigation.goBack();
      else goBackOrToMainTab(navigation, 'Journal' as any);
    }, 420);
  };

  const openOracleWithEntry = () => {
    if (!content.trim()) return;
    void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('OracleChat', {
      initialMessage: `Napisałem wpis w dzienniku:\n\n"${content.trim().slice(0, 500)}"\n\nCo widzisz w tym zapisie? Jakie wzorce lub pytania dostrzegasz?`,
    });
  };

  return (
    <View style={[s.container, { backgroundColor: isLight ? '#FBF6EE' : '#07060F' }]}>
      <ParchmentBg isLight={isLight} />

      {/* Subtle ink texture overlay */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { opacity: 0.03, backgroundColor: isLight ? '#4A2C0A' : '#CBA864' },
        ]}
        pointerEvents="none"
      />

      <SafeAreaView edges={['top']} style={s.safeArea}>
        <View style={s.flex}>
          {/* ── HEADER ── */}
          <View style={[s.header, { borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)' }]}>
            <Pressable
              onPress={() => navigation.canGoBack() ? navigation.goBack() : goBackOrToMainTab(navigation, 'Journal' as any)}
              style={s.headerBtn}
              hitSlop={16}
            >
              <ChevronLeft color={accent} size={24} />
            </Pressable>

            <View style={s.headerCenter}>
              <Text style={[s.headerEyebrow, { color: accent, opacity: 0.6 }]}>{isEditMode ? 'EDYCJA WPISU' : 'SANKTUARIUM PISANIA'}</Text>
              <View style={s.headerTitleRow}>
                <Feather color={accent} size={14} style={{ marginRight: 7 }} />
                <Text style={[s.headerTitle, { color: textColor }]}>
                  {activeDef.emoji + ' ' + typeLabel}
                </Text>
              </View>
            </View>

            {/* Privacy toggle in header */}
            <Pressable
              onPress={() => {
                void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
                setIsLocked(v => !v);
              }}
              style={[s.headerBtn, { alignItems: 'flex-end' }]}
              hitSlop={12}
            >
              {isLocked
                ? <Lock color={accent} size={18} />
                : <Unlock color={subColor} size={18} />
              }
            </Pressable>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={[
              s.scrollContent,
              {
                paddingBottom: keyboardH > 0
                  ? keyboardH + 90
                  : screenContracts.bottomInset(insets.bottom, 'detail') + 120,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          >

            {/* ── LEADING QUESTION ── */}
            <Animated.View entering={FadeInDown.delay(40).duration(480)}>
              <View style={[s.promptCard, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.80)' : 'rgba(203,170,100,0.06)',
                borderColor: isLight ? 'rgba(160,120,60,0.24)' : 'rgba(203,170,100,0.20)',
              }]}>
                <LinearGradient
                  colors={isLight
                    ? ['rgba(203,170,100,0.08)', 'transparent']
                    : ['rgba(203,170,100,0.07)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={[s.promptLabel, { color: accent }]}>✦ PYTANIE PROWADZĄCE</Text>
                <Text style={[s.promptText, { color: textColor }]}>{sanctuaryPrompt}</Text>
              </View>
            </Animated.View>

            {/* ── ENTRY TYPE CHIPS (10 types) ── */}
            <Text style={[s.sectionLabel, { color: subColor }]}>RODZAJ WPISU</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.typeRow}
              keyboardShouldPersistTaps="handled"
            >
              {ALL_ENTRY_TYPE_DEFS.map((et, index) => {
                const active = typeIndex === index;
                return (
                  <Animated.View key={`${et.id}-${index}`} entering={FadeInUp.delay(index * 40).duration(360)}>
                    <Pressable
                      onPress={() => handleTypeSelect(index)}
                      style={({ pressed }) => [
                        s.typeChip,
                        {
                          backgroundColor: active
                            ? et.color + '22'
                            : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                          borderColor: active
                            ? et.color + '66'
                            : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.08)',
                          opacity: pressed ? 0.72 : 1,
                        },
                      ]}
                    >
                      <Text style={s.typeChipEmoji}>{et.emoji}</Text>
                      <Text style={[s.typeChipLabel, { color: active ? et.color : subColor }]}>
                        {et.label}
                      </Text>
                      {active && (
                        <View style={[s.typeChipDot, { backgroundColor: et.color }]} />
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* ── MOOD SELECTOR ── */}
            <Text style={[s.sectionLabel, { color: subColor }]}>NASTRÓJ CHWILI</Text>
            <View style={s.moodRow}>
              {MOODS.map((m) => {
                const active = mood === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => {
                      void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
                      setMood(active ? '' : m.id);
                    }}
                    style={[
                      s.moodChip,
                      {
                        backgroundColor: active
                          ? accent + '18'
                          : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                        borderColor: active
                          ? accent + '55'
                          : isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.08)',
                      },
                    ]}
                  >
                    <Text style={s.moodEmoji}>{m.emoji}</Text>
                    <Text style={[s.moodLabel, { color: active ? accent : subColor }]}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── ENERGY BAR ── */}
            <Animated.View entering={FadeInDown.delay(60).duration(400)}>
              <View style={[s.energyCard, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.04)',
                borderColor: cardBorder,
              }]}>
                <View style={s.energyHeader}>
                  <Zap color={accent} size={13} />
                  <Text style={[s.energyLabel, { color: subColor }]}>POZIOM ENERGII</Text>
                  <Text style={[s.energyValue, { color: accent }]}>{energyLevel}/10</Text>
                </View>
                <View style={s.energyBarTrack}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
                        setEnergyLevel(i + 1);
                      }}
                      style={[
                        s.energyBarSegment,
                        {
                          backgroundColor: i < energyLevel
                            ? (energyLevel <= 3 ? '#FB7185' : energyLevel <= 6 ? '#FBBF24' : '#34D399')
                            : isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.08)',
                          borderRadius: i === 0 ? 6 : i === 9 ? 6 : 2,
                        },
                      ]}
                    />
                  ))}
                </View>
                <View style={s.energyLabels}>
                  <Text style={[s.energyHint, { color: subColor }]}>Wyczerpanie</Text>
                  <Text style={[s.energyHint, { color: subColor }]}>Pełnia energii</Text>
                </View>
              </View>
            </Animated.View>

            {/* ── TAGS ── */}
            <Text style={[s.sectionLabel, { color: subColor }]}>TAGI (maks. 5)</Text>
            <View style={s.tagRow}>
              {PRESET_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[
                      s.tagChip,
                      {
                        backgroundColor: active
                          ? accent + '20'
                          : isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                        borderColor: active
                          ? accent + '66'
                          : isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.08)',
                        transform: [{ scale: active ? 1.08 : 1 }],
                      },
                    ]}
                  >
                    <Text style={s.tagEmoji}>{tag}</Text>
                  </Pressable>
                );
              })}
              <View style={{ flex: 1 }} />
              {selectedTags.length > 0 && (
                <Pressable onPress={() => setSelectedTags([])}>
                  <Text style={[s.tagClear, { color: subColor }]}>wyczyść</Text>
                </Pressable>
              )}
            </View>

            {/* ── TEMPLATE + GUIDED PROMPTS ROW ── */}
            <View style={s.toolRow}>
              <Pressable
                onPress={() => setShowTemplateModal(true)}
                style={[s.toolBtn, {
                  backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)',
                  borderColor: isLight ? 'rgba(100,70,20,0.14)' : 'rgba(255,255,255,0.08)',
                }]}
              >
                <AlignLeft color={subColor} size={13} />
                <Text style={[s.toolBtnLabel, { color: subColor }]}>Szablon</Text>
              </Pressable>
              <Pressable
                onPress={loadGuidedPrompts}
                style={[s.toolBtn, {
                  backgroundColor: isLight ? 'rgba(203,170,100,0.08)' : 'rgba(203,170,100,0.07)',
                  borderColor: isLight ? 'rgba(203,170,100,0.28)' : 'rgba(203,170,100,0.20)',
                }]}
              >
                <Sparkles color={accent} size={13} />
                <Text style={[s.toolBtnLabel, { color: accent }]}>Potrzebuję natchnienia</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowTarotModal(true)}
                style={[s.toolBtn, {
                  backgroundColor: isLight ? 'rgba(160,80,200,0.06)' : 'rgba(160,80,200,0.07)',
                  borderColor: isLight ? 'rgba(160,80,200,0.22)' : 'rgba(160,80,200,0.18)',
                }]}
              >
                <Wand2 color={'#A78BFA'} size={13} />
                <Text style={[s.toolBtnLabel, { color: '#A78BFA' }]}>
                  {attachedCard ? attachedCard.emoji + ' ' + attachedCard.name : 'Dołącz kartę'}
                </Text>
              </Pressable>
            </View>

            {/* ── GUIDED PROMPTS PANEL ── */}
            {showGuidedPrompts && (
              <Animated.View entering={FadeInDown.duration(360)}>
                <View style={[s.guidedCard, {
                  backgroundColor: isLight ? 'rgba(255,255,255,0.80)' : 'rgba(203,170,100,0.06)',
                  borderColor: isLight ? 'rgba(160,120,60,0.24)' : 'rgba(203,170,100,0.18)',
                }]}>
                  <View style={s.guidedHeader}>
                    <Sparkles color={accent} size={13} />
                    <Text style={[s.guidedTitle, { color: accent }]}>PYTANIA DLA {typeLabel.toUpperCase()}</Text>
                    <Pressable onPress={() => setShowGuidedPrompts(false)}>
                      <Text style={[s.guidedClose, { color: subColor }]}>✕</Text>
                    </Pressable>
                  </View>
                  {guidedLoading ? (
                    <ActivityIndicator size="small" color={accent} style={{ marginVertical: 12 }} />
                  ) : (
                    guidedPrompts.map((p, i) => (
                      <Pressable
                        key={i}
                        onPress={() => {
                          void HapticsService.impact(Haptics.ImpactFeedbackStyle.Light);
                          setContent(prev => prev ? prev + '\n\n' + p + '\n' : p + '\n');
                          setShowGuidedPrompts(false);
                        }}
                        style={[s.guidedPromptRow, {
                          borderBottomColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.06)',
                          borderBottomWidth: i < guidedPrompts.length - 1 ? StyleSheet.hairlineWidth : 0,
                        }]}
                      >
                        <Text style={[s.guidedPromptNum, { color: accent + 'AA' }]}>{i + 1}</Text>
                        <Text style={[s.guidedPromptText, { color: textColor }]}>{p}</Text>
                      </Pressable>
                    ))
                  )}
                </View>
              </Animated.View>
            )}

            {/* ── WRITING AREA ── */}
            <Animated.View entering={FadeInDown.delay(120).duration(520)}>
              <View style={[s.writingCard, {
                backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.04)',
                borderColor: cardBorder,
              }]}>
                {/* Decorative left rule */}
                <View style={[s.leftRule, { backgroundColor: activeDef.color + '66' }]} />

                <TextInput
                  style={[s.mainInput, {
                    color: textColor,
                    lineHeight: 30,
                  }]}
                  placeholder="Pisz spokojnie. Jedno prawdziwe zdanie jest cenniejsze niż długi tekst bez kontaktu z sobą..."
                  placeholderTextColor={isLight ? 'rgba(100,70,30,0.35)' : 'rgba(200,185,160,0.30)'}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  textAlignVertical="top"
                  returnKeyType="done"
                  onFocus={() => focusIntoView(520)}
                  scrollEnabled={false}
                />

                {/* Done hint */}
                <View style={{ alignItems: 'flex-end', paddingRight: 6, paddingBottom: 2 }}>
                  <CornerDownLeft size={14} color="rgba(206,174,114,0.40)" />
                </View>

                {/* Word count + reading time */}
                <View style={[s.wordCountRow, { borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)' }]}>
                  <Hash color={subColor} size={11} />
                  <Text style={[s.wordCount, { color: subColor }]}>
                    {wordCount} {wordCount === 1 ? 'słowo' : wordCount < 5 ? 'słowa' : 'słów'}
                    {wordCount >= 10 && ` · ${readingMinutes} min czytania`}
                  </Text>
                  {content.trim().length > 0 && content.trim().length <= 10 && (
                    <Text style={[s.wordCountHint, { color: isLight ? '#B45309' : '#FCA5A5' }]}>
                      · dodaj więcej, aby zapisać
                    </Text>
                  )}
                </View>
              </View>
            </Animated.View>

            {/* ── ATTACHED TAROT CARD ── */}
            {attachedCard && (
              <Animated.View entering={FadeIn.duration(320)}>
                <View style={[s.attachedCard, {
                  backgroundColor: attachedCard.color + '14',
                  borderColor: attachedCard.color + '44',
                }]}>
                  <Text style={{ fontSize: 24 }}>{attachedCard.emoji}</Text>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.attachedLabel, { color: subColor }]}>DOŁĄCZONA KARTA</Text>
                    <Text style={[s.attachedName, { color: attachedCard.color }]}>{attachedCard.name}</Text>
                  </View>
                  <Pressable onPress={() => setAttachedCard(null)}>
                    <Text style={{ color: subColor, fontSize: 18, padding: 4 }}>✕</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* ── PRIVACY INDICATOR ── */}
            {isLocked && (
              <Animated.View entering={FadeIn.duration(280)}>
                <View style={[s.privacyBanner, {
                  backgroundColor: isLight ? 'rgba(124,90,30,0.08)' : 'rgba(203,170,100,0.08)',
                  borderColor: isLight ? 'rgba(124,90,30,0.28)' : 'rgba(203,170,100,0.22)',
                }]}>
                  <Lock color={accent} size={12} />
                  <Text style={[s.privacyText, { color: accent }]}>
                    Ten wpis będzie widoczny tylko dla Ciebie — treść zostanie ukryta w liście wpisów.
                  </Text>
                </View>
              </Animated.View>
            )}

            {/* ── ORACLE CTA ── */}
            {content.trim().length > 30 && (
              <Animated.View entering={FadeIn.duration(360)}>
                <Pressable
                  onPress={openOracleWithEntry}
                  style={({ pressed }) => [
                    s.oracleCta,
                    {
                      backgroundColor: isLight ? 'rgba(203,170,100,0.10)' : 'rgba(203,170,100,0.08)',
                      borderColor: isLight ? 'rgba(203,170,100,0.36)' : 'rgba(203,170,100,0.24)',
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(203,170,100,0.12)', 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Sparkles color={accent} size={16} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[s.oracleCtaTitle, { color: accent }]}>
                      ✨ Zapytaj Oracle o ten wpis
                    </Text>
                    <Text style={[s.oracleCtaSub, { color: subColor }]}>
                      Oracle przeczyta Twój zapis i podzieli się spostrzeżeniami, wzorcami lub pytaniami.
                    </Text>
                  </View>
                  <ChevronLeft
                    color={accent}
                    size={16}
                    style={{ transform: [{ rotate: '180deg' }] }}
                  />
                </Pressable>
              </Animated.View>
            )}

            {/* ── SAVED STATE ── */}
            {showSavedState && (
              <Animated.View entering={FadeIn.duration(240)}>
                <View style={[s.savedCard, {
                  backgroundColor: isLight ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.10)',
                  borderColor: 'rgba(34,197,94,0.28)',
                }]}>
                  <CheckCircle2 color="#22C55E" size={16} />
                  <Text style={[s.savedText, { color: '#22C55E' }]}>
                    Wpis zapisany w prywatnym archiwum ✦
                  </Text>
                </View>
              </Animated.View>
            )}

            <EndOfContentSpacer size="compact" />
          </ScrollView>

          {/* ── FOOTER ── */}
          <View
            style={[
              s.footer,
              {
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: keyboardH > 0 ? keyboardH : 0,
                paddingHorizontal: layout.padding.screen,
                paddingBottom: keyboardH > 0 ? 8 : Math.max(insets.bottom, 16),
                paddingTop: 12,
                backgroundColor: isLight ? 'rgba(255,255,255,0.97)' : 'rgba(14,10,30,0.97)',
                borderTopColor: isLight ? 'rgba(139,100,42,0.20)' : 'rgba(255,255,255,0.07)',
                zIndex: 10,
              },
            ]}
          >
            {!canSave && (
              <Text style={[s.footerHint, { color: subColor }]}>
                Napisz przynajmniej kilka słów, aby zapisać wpis.
              </Text>
            )}

            <Pressable
              onPress={saveEntry}
              disabled={!canSave || isSaving}
              style={({ pressed }) => ({ opacity: pressed || !canSave ? 0.62 : 1 })}
            >
              <LinearGradient
                colors={canSave
                  ? (isLight ? ['#7C5A1E', '#A0742A'] : ['#CBA864', '#A97A39'])
                  : ['rgba(128,128,128,0.4)', 'rgba(128,128,128,0.4)']}
                style={s.saveButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLocked && <Lock color="#FFF" size={14} strokeWidth={2} />}
                {!isLocked && <Star color="#FFF" size={15} strokeWidth={1.8} />}
                <Text style={s.saveButtonText}>
                  {isSaving ? 'Zapisywanie...' : isEditMode ? 'Zaktualizuj wpis' : 'Zachowaj w sanktuarium'}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* ── TEMPLATE MODAL ── */}
      <Modal visible={showTemplateModal} transparent animationType="slide" onRequestClose={() => setShowTemplateModal(false)}>
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowTemplateModal(false)}
        >
          <Pressable
            style={[s.modalSheet, {
              backgroundColor: isLight ? '#FBF6EE' : '#0C0A1A',
              borderColor: isLight ? 'rgba(160,120,60,0.24)' : 'rgba(203,170,100,0.16)',
            }]}
            onPress={e => e.stopPropagation()}
          >
            <Text style={[s.modalTitle, { color: textColor }]}>Szablony wpisu</Text>
            <Text style={[s.modalSub, { color: subColor }]}>
              Wybierz szablon, który wstępnie wypełni strukturę Twojego wpisu.
            </Text>
            {ENTRY_TEMPLATES.map((tpl) => (
              <Pressable
                key={tpl.id}
                onPress={() => applyTemplate(tpl)}
                style={({ pressed }) => [
                  s.tplRow,
                  {
                    backgroundColor: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.05)',
                    borderColor: tpl.color + '44',
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <View style={[s.tplIcon, { backgroundColor: tpl.color + '22' }]}>
                  <Text style={{ fontSize: 20 }}>{tpl.emoji}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[s.tplLabel, { color: textColor }]}>{tpl.label}</Text>
                  <Text style={[s.tplSub, { color: subColor }]} numberOfLines={1}>
                    {tpl.content.replace(/\n/g, ' · ').slice(0, 60)}
                  </Text>
                </View>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowTemplateModal(false)} style={s.modalCancelBtn}>
              <Text style={[s.modalCancelText, { color: subColor }]}>Anuluj</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── TAROT CARD PICKER MODAL ── */}
      <Modal visible={showTarotModal} transparent animationType="slide" onRequestClose={() => { setShowTarotModal(false); setRevealedCards([]); }}>
        <Pressable
          style={s.modalOverlay}
          onPress={() => { setShowTarotModal(false); setRevealedCards([]); }}
        >
          <Pressable
            style={[s.modalSheet, {
              backgroundColor: isLight ? '#FBF6EE' : '#0C0A1A',
              borderColor: isLight ? 'rgba(160,80,200,0.22)' : 'rgba(160,80,200,0.16)',
            }]}
            onPress={e => e.stopPropagation()}
          >
            <Text style={[s.modalTitle, { color: textColor }]}>Dołącz kartę tarota</Text>
            <Text style={[s.modalSub, { color: subColor }]}>
              Odkryj kartę, która rezonuje z tym wpisem. Dotknij karty, by ją odsłonić, a następnie wybierz.
            </Text>
            <View style={s.cardPickerRow}>
              {TAROT_CARD_OPTIONS.map((card, index) => {
                const revealed = revealedCards.includes(index);
                return (
                  <Pressable
                    key={index}
                    onPress={() => revealed ? handlePickCard(card) : handleRevealCard(index)}
                    style={[
                      s.cardPickerItem,
                      {
                        backgroundColor: revealed ? card.color + '22' : (isLight ? 'rgba(160,80,200,0.06)' : 'rgba(160,80,200,0.10)'),
                        borderColor: revealed ? card.color + '66' : (isLight ? 'rgba(160,80,200,0.20)' : 'rgba(160,80,200,0.22)'),
                      },
                    ]}
                  >
                    {revealed ? (
                      <>
                        <Text style={s.cardPickerEmoji}>{card.emoji}</Text>
                        <Text style={[s.cardPickerName, { color: card.color }]} numberOfLines={2}>{card.name}</Text>
                      </>
                    ) : (
                      <>
                        <Text style={[s.cardPickerEmoji, { opacity: 0.4 }]}>🂠</Text>
                        <Text style={[s.cardPickerName, { color: subColor }]}>???</Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
            </View>
            <Pressable onPress={() => { setShowTarotModal(false); setRevealedCards([]); }} style={s.modalCancelBtn}>
              <Text style={[s.modalCancelText, { color: subColor }]}>Anuluj</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: layout.padding.screen,
    height: 68,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 2.5, marginBottom: 3 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },

  scrollContent: { paddingTop: 16 },

  promptCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    overflow: 'hidden',
  },
  promptLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 10,
    opacity: 0.8,
  },
  promptText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    fontWeight: '400',
    letterSpacing: 0.1,
  },

  sectionLabel: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 10,
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2.2,
  },

  typeRow: {
    paddingHorizontal: layout.padding.screen,
    paddingBottom: 4,
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    minWidth: 80,
    position: 'relative',
  },
  typeChipEmoji: { fontSize: 20, marginBottom: 2 },
  typeChipLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2, textAlign: 'center' },
  typeChipDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: layout.padding.screen,
    marginBottom: 16,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.1 },

  // Energy bar
  energyCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  energyLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, flex: 1 },
  energyValue: { fontSize: 13, fontWeight: '800' },
  energyBarTrack: {
    flexDirection: 'row',
    gap: 4,
    height: 10,
  },
  energyBarSegment: {
    flex: 1,
    height: 10,
  },
  energyLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  energyHint: { fontSize: 9, fontWeight: '500', opacity: 0.7 },

  // Tags
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: layout.padding.screen,
    marginBottom: 16,
    alignItems: 'center',
  },
  tagChip: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagEmoji: { fontSize: 18 },
  tagClear: { fontSize: 11, fontWeight: '500', paddingLeft: 4 },

  // Tool row
  toolRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: layout.padding.screen,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  toolBtnLabel: { fontSize: 11, fontWeight: '600' },

  // Guided prompts
  guidedCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    overflow: 'hidden',
  },
  guidedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  guidedTitle: { fontSize: 9, fontWeight: '700', letterSpacing: 2, flex: 1 },
  guidedClose: { fontSize: 14, fontWeight: '600', padding: 4 },
  guidedPromptRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  guidedPromptNum: { fontSize: 12, fontWeight: '800', minWidth: 16, marginTop: 1 },
  guidedPromptText: { fontSize: 13, lineHeight: 20, flex: 1 },

  writingCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 14,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  leftRule: { width: 3, borderRadius: 2, marginVertical: 16, marginLeft: 14 },
  mainInput: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 16,
    paddingTop: 18,
    paddingBottom: 40,
    fontSize: 17,
    minHeight: 260,
    textAlignVertical: 'top',
  },
  wordCountRow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  wordCount: { fontSize: 11, fontWeight: '500' },
  wordCountHint: { fontSize: 11, fontWeight: '400' },

  // Attached card
  attachedCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachedLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6, marginBottom: 2 },
  attachedName: { fontSize: 14, fontWeight: '700' },

  // Privacy banner
  privacyBanner: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyText: { fontSize: 12, lineHeight: 18, flex: 1 },

  oracleCta: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  oracleCtaTitle: { fontSize: 14, fontWeight: '700', marginBottom: 3, letterSpacing: 0.1 },
  oracleCtaSub: { fontSize: 12.5, lineHeight: 19 },

  savedCard: {
    marginHorizontal: layout.padding.screen,
    marginBottom: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  savedText: { fontSize: 13, fontWeight: '600', flex: 1 },

  footer: {
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerHint: { textAlign: 'center', fontSize: 12, lineHeight: 18 },
  saveButton: {
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.60)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 22,
    paddingBottom: 34,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    opacity: 0.72,
  },
  modalCancelBtn: {
    marginTop: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600' },

  // Template modal
  tplRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  tplIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tplLabel: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  tplSub: { fontSize: 11, lineHeight: 16, opacity: 0.68 },

  // Tarot picker
  cardPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardPickerItem: {
    width: 62,
    height: 84,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  cardPickerEmoji: { fontSize: 22, marginBottom: 4 },
  cardPickerName: { fontSize: 9, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
});
