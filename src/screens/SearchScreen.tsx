// @ts-nocheck
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  FlatList, Keyboard, Pressable, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../core/hooks/useTheme';
import { Search, X, ArrowLeft, ChevronRight } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { HapticsService } from '../core/services/haptics.service';
import { useTranslation } from 'react-i18next';

// ─── Screen catalog ───────────────────────────────────────────────────────────
type ScreenEntry = {
  nav: string;
  label: string;
  emoji: string;
  keywords: string;
  category: string;
  navParams?: Record<string, any>;
};

const CATALOG: ScreenEntry[] = [
  // ── Astrologia ──
  { nav: 'Horoscope',         label: 'Horoskop',                    emoji: '♈', category: 'Astrologia',          keywords: 'zodiak gwiazdy znak' },
  { nav: 'Matrix',            label: 'Matrix Przeznaczenia',        emoji: '🔢', category: 'Astrologia',          keywords: 'liczby numerologia destiny' },
  { nav: 'Compatibility',     label: 'Kompatybilność',              emoji: '💞', category: 'Astrologia',          keywords: 'miłość partner związek' },
  { nav: 'Stars',             label: 'Mapa Gwiazd',                 emoji: '🌌', category: 'Astrologia',          keywords: 'konstelacje niebo astro' },
  { nav: 'LunarCalendar',     label: 'Kalendarz Księżycowy',        emoji: '🌙', category: 'Astrologia',          keywords: 'fazy księżyc moon' },
  { nav: 'ChineseHoroscope',  label: 'Chiński Horoskop',            emoji: '🐉', category: 'Astrologia',          keywords: 'chiny rok zwierzę' },
  { nav: 'PartnerHoroscope',  label: 'Horoskop Partnerski',         emoji: '💑', category: 'Astrologia',          keywords: 'para partner miłość' },
  { nav: 'PartnerMatrix',     label: 'Matrix Partnera',             emoji: '🔢', category: 'Astrologia',          keywords: 'partner liczby numerologia' },
  { nav: 'NatalChart',        label: 'Karta Natalna',               emoji: '🪐', category: 'Astrologia',          keywords: 'urodziny ascendent planety' },
  { nav: 'VedicAstrology',    label: 'Astrologia Wedyjska',         emoji: '🕉️',  category: 'Astrologia',          keywords: 'indie wedy jyotish' },
  { nav: 'AstroTransits',     label: 'Tranzyty Astrologiczne',      emoji: '⭐', category: 'Astrologia',          keywords: 'planety tranzyt aspekty' },
  { nav: 'AnnualForecast',    label: 'Prognoza Roczna',             emoji: '📅', category: 'Astrologia',          keywords: 'rok prognoza przyszłość' },
  { nav: 'Retrogrades',       label: 'Retrogradacje',               emoji: '↩️',  category: 'Astrologia',          keywords: 'merkury retrograde planety' },
  { nav: 'AstrologyCycles',   label: 'Cykle Astrologiczne',         emoji: '🔄', category: 'Astrologia',          keywords: 'saturn jowisz cykl' },
  { nav: 'CosmicPortals',     label: 'Kosmiczne Portale',           emoji: '🌀', category: 'Astrologia',          keywords: 'portal brama energia' },
  { nav: 'CosmicWeather',     label: 'Kosmiczna Pogoda',            emoji: '🌦️',  category: 'Astrologia',          keywords: 'energia dzienna pogoda' },
  { nav: 'AstroNote',         label: 'Notatnik Astro',              emoji: '📓', category: 'Astrologia',          keywords: 'notatki astrologia zapisz' },
  { nav: 'ZodiacAtlas',       label: 'Atlas Zodiaków',              emoji: '🗺️',  category: 'Astrologia',          keywords: 'atlas znaki zodiak' },
  { nav: 'DivineTiming',      label: 'Boski Czas',                  emoji: '⏳', category: 'Astrologia',          keywords: 'czas timing synchronia' },

  // ── Tarot & Wróżenie ──
  { nav: 'TarotDeckSelection', label: 'Tarot',                      emoji: '🔮', category: 'Tarot & Wróżenie',    keywords: 'karty tarot odczyt' },
  { nav: 'DailyTarot',         label: 'Dzienna Karta Tarota',       emoji: '🃏', category: 'Tarot & Wróżenie',    keywords: 'dzienna karta dzień' },
  { nav: 'Wrozka',             label: 'Wróżka',                     emoji: '🧿', category: 'Tarot & Wróżenie',    keywords: 'wróżba przepowiednia wróżka' },
  { nav: 'PartnerTarot',       label: 'Tarot Miłosny',              emoji: '❤️',  category: 'Tarot & Wróżenie',    keywords: 'partner miłość relacja' },
  { nav: 'TarotJournal',       label: 'Dziennik Tarota',            emoji: '📖', category: 'Tarot & Wróżenie',    keywords: 'historia odczyty zapiski' },
  { nav: 'TarotSpreadBuilder', label: 'Własny Rozkład Tarota',      emoji: '🃏', category: 'Tarot & Wróżenie',    keywords: 'rozkład układ custom' },
  { nav: 'CommunityTarot',     label: 'Wspólnotowy Tarot',          emoji: '👥', category: 'Tarot & Wróżenie',    keywords: 'społeczność wspólnota karty' },
  { nav: 'RuneCast',           label: 'Rzut Runami',                emoji: '᛫',  category: 'Tarot & Wróżenie',    keywords: 'runy nordycki wiking magia' },
  { nav: 'IChing',             label: 'I Ching',                    emoji: '☯️',  category: 'Tarot & Wróżenie',    keywords: 'i ching chiny wyrocznia' },
  { nav: 'CrystalBall',        label: 'Kula Kryształowa',           emoji: '🔮', category: 'Tarot & Wróżenie',    keywords: 'kula przepowiednia przyszłość' },
  { nav: 'DowsingRods',        label: 'Różdżki Wahadło',            emoji: '🌿', category: 'Tarot & Wróżenie',    keywords: 'różdżki wahadło energia' },
  { nav: 'PalmReading',        label: 'Chiromancja',                emoji: '🤚', category: 'Tarot & Wróżenie',    keywords: 'dłoń linie przeznaczenie' },
  { nav: 'AngelNumbers',       label: 'Liczby Anielskie',           emoji: '👼', category: 'Tarot & Wróżenie',    keywords: '1111 anioły cyfry' },
  { nav: 'YearCard',           label: 'Karta Roku',                 emoji: '🌟', category: 'Tarot & Wróżenie',    keywords: 'rok karta numerologia tarot' },

  // ── Numerologia ──
  { nav: 'Numerology',        label: 'Numerologia',                 emoji: '🔢', category: 'Numerologia',          keywords: 'liczby cyfry życiowa' },
  { nav: 'Biorhythm',         label: 'Biorytm',                    emoji: '📈', category: 'Numerologia',          keywords: 'cykl fizyczny emocjonalny' },

  // ── Medytacja & Wellness ──
  { nav: 'Meditation',        label: 'Medytacja',                   emoji: '🧘', category: 'Medytacja',            keywords: 'spokój oddech cisza' },
  { nav: 'Breathwork',        label: 'Oddychanie',                  emoji: '🌬️',  category: 'Medytacja',            keywords: 'oddech pranajama technika' },
  { nav: 'SoundBath',         label: 'Kąpiel Dźwiękowa',           emoji: '🎵', category: 'Medytacja',            keywords: 'dźwięk miska tybetańska' },
  { nav: 'BinauralBeats',     label: 'Bity Binauralne',             emoji: '🎧', category: 'Medytacja',            keywords: 'fale theta alfa gamma mózg' },
  { nav: 'HealingFrequencies',label: 'Częstotliwości Uzdrawiające', emoji: '🔊', category: 'Medytacja',            keywords: 'hz solfeggio uzdrawianie' },
  { nav: 'Chakra',            label: 'Czakry',                      emoji: '🌈', category: 'Medytacja',            keywords: 'czakra energia ciało' },
  { nav: 'ColorTherapy',      label: 'Terapia Kolorem',             emoji: '🎨', category: 'Medytacja',            keywords: 'kolor barwa mandala' },
  { nav: 'SleepHelper',       label: 'Pomocnik Snu',                emoji: '💤', category: 'Medytacja',            keywords: 'sen zaśnij spokojny' },
  { nav: 'SleepRitual',       label: 'Rytuał Snu',                  emoji: '🌙', category: 'Medytacja',            keywords: 'sen noc wieczór rytuał' },
  { nav: 'SignMeditation',    label: 'Medytacja Znaku',             emoji: '♓', category: 'Medytacja',            keywords: 'zodiak medytacja znak' },
  { nav: 'MorningRitual',     label: 'Rytuał Poranny',              emoji: '🌅', category: 'Medytacja',            keywords: 'rano poranek wstanie rutyna' },
  { nav: 'AnxietyRelief',     label: 'Ulga w Lęku',                 emoji: '🌿', category: 'Medytacja',            keywords: 'stres lęk uspokojenie panika' },
  { nav: 'SelfCompassion',    label: 'Samoakceptacja',              emoji: '💗', category: 'Medytacja',            keywords: 'akceptacja miłość własna' },

  // ── Dziennik & Refleksja ──
  { nav: 'Journal',           label: 'Dziennik',                    emoji: '📔', category: 'Dziennik',             keywords: 'notatki zapiski refleksja' },
  { nav: 'JournalEntry',      label: 'Nowy Wpis w Dzienniku',       emoji: '✍️',  category: 'Dziennik',             keywords: 'pisz nowy wpis dziennik' },
  { nav: 'Dreams',            label: 'Sny',                         emoji: '💭', category: 'Dziennik',             keywords: 'sen marzenie symbolika' },
  { nav: 'DreamInterpreter',  label: 'Interpreter Snów',            emoji: '🌙', category: 'Dziennik',             keywords: 'sen interpretacja znaczenie' },
  { nav: 'DreamSymbols',      label: 'Symbole Snów',                emoji: '🔣', category: 'Dziennik',             keywords: 'symbol słownik sen' },
  { nav: 'LucidDreaming',     label: 'Świadome Śnienie',            emoji: '🌟', category: 'Dziennik',             keywords: 'lucid świadomy sen technika' },
  { nav: 'NightSymbolator',   label: 'Nocny Symbolator',            emoji: '🌃', category: 'Dziennik',             keywords: 'noc symbol analiza' },
  { nav: 'Gratitude',         label: 'Wdzięczność',                 emoji: '🙏', category: 'Dziennik',             keywords: 'dziękuję wdzięczność pozytywne' },
  { nav: 'EnergyJournal',     label: 'Dziennik Energii',            emoji: '⚡', category: 'Dziennik',             keywords: 'energia dzień śledzenie' },
  { nav: 'ShadowWork',        label: 'Praca z Cieniem',             emoji: '🌑', category: 'Dziennik',             keywords: 'cień jung trauma wnętrze' },
  { nav: 'InnerChild',        label: 'Wewnętrzne Dziecko',          emoji: '👶', category: 'Dziennik',             keywords: 'dziecko trauma uzdrawianie' },
  { nav: 'ReleaseLetters',    label: 'Listy Uwolnienia',            emoji: '🕊️',  category: 'Dziennik',             keywords: 'list puść uwolnij wybacz' },

  // ── Afirmacje & Intencje ──
  { nav: 'Affirmations',       label: 'Afirmacje',                  emoji: '💫', category: 'Afirmacje',            keywords: 'pozytywne myśli mantra afirmacja' },
  { nav: 'AIDailyAffirmations',label: 'AI Afirmacje',               emoji: '🤖', category: 'Afirmacje',            keywords: 'sztuczna inteligencja codzienne' },
  { nav: 'PersonalMantra',    label: 'Osobista Mantra',             emoji: '🕉️',  category: 'Afirmacje',            keywords: 'mantra medytacja słowo' },
  { nav: 'MantraGenerator',   label: 'Generator Mantry',            emoji: '✨', category: 'Afirmacje',            keywords: 'stwórz mantra własna AI' },
  { nav: 'IntentionCards',    label: 'Karty Intencji',              emoji: '🎴', category: 'Afirmacje',            keywords: 'intencja cel karta' },
  { nav: 'IntentionChamber',  label: 'Komnata Intencji',            emoji: '🏛️',  category: 'Afirmacje',            keywords: 'intencja komnata rytuał' },
  { nav: 'Manifestation',     label: 'Manifestacja',                emoji: '🌠', category: 'Afirmacje',            keywords: 'przyciągnij marzenie prawa' },
  { nav: 'VisionBoard',       label: 'Tablica Wizji',               emoji: '🖼️',  category: 'Afirmacje',            keywords: 'wizja cel kolaż marzenia' },
  { nav: 'LifeWheel',         label: 'Koło Życia',                  emoji: '⚖️',  category: 'Afirmacje',            keywords: 'balans obszary życia ocena' },

  // ── Rytuały ──
  { nav: 'Rituals',           label: 'Rytuały',                     emoji: '🕯️',  category: 'Rytuały',              keywords: 'ceremonia praktyka rytuał' },
  { nav: 'RitualDetail',      label: 'Szczegóły Rytuału',           emoji: '🕯️',  category: 'Rytuały',              keywords: 'szczegóły rytuał opis' },
  { nav: 'RitualSession',     label: 'Sesja Rytuału',               emoji: '🔥', category: 'Rytuały',              keywords: 'sesja prowadzona rytuał' },
  { nav: 'DailyRitualAI',     label: 'Dzienny Rytuał AI',           emoji: '🌟', category: 'Rytuały',              keywords: 'codzienny rytuał AI prowadzony' },
  { nav: 'MoonRitual',        label: 'Rytuał Księżyca',             emoji: '🌕', category: 'Rytuały',              keywords: 'księżyc pełnia nów rytuał' },
  { nav: 'Cleansing',         label: 'Oczyszczanie',                emoji: '✨', category: 'Rytuały',              keywords: 'oczyszczanie energia clearing' },
  { nav: 'SaltBath',          label: 'Kąpiel Solna',                emoji: '🛁', category: 'Rytuały',              keywords: 'sól kąpiel oczyszczanie' },
  { nav: 'FireCeremony',      label: 'Ceremonia Ognia',             emoji: '🔥', category: 'Rytuały',              keywords: 'ogień ceremonia spalanie' },
  { nav: 'ProtectionRitual',  label: 'Rytuał Ochronny',             emoji: '🛡️',  category: 'Rytuały',              keywords: 'ochrona tarcza energia' },
  { nav: 'ElementalMagic',    label: 'Magia Żywiołów',              emoji: '🌍', category: 'Rytuały',              keywords: 'ziemia ogień woda powietrze' },
  { nav: 'SacredGeometry',    label: 'Geometria Sakralna',          emoji: '🔯', category: 'Rytuały',              keywords: 'geometria figura symbol' },

  // ── Medycyna Duchowa ──
  { nav: 'HerbalAlchemy',     label: 'Alchemia Ziół',               emoji: '🌿', category: 'Medycyna Duchowa',     keywords: 'zioła alchemia rośliny' },
  { nav: 'CrystalGuide',      label: 'Przewodnik Kryształów',       emoji: '💎', category: 'Medycyna Duchowa',     keywords: 'kryształy kamienie minerały' },
  { nav: 'CrystalGrid',       label: 'Siatka Kryształów',           emoji: '💠', category: 'Medycyna Duchowa',     keywords: 'siatka kryształy energia' },
  { nav: 'AuraReading',       label: 'Odczyt Aury',                 emoji: '🌈', category: 'Medycyna Duchowa',     keywords: 'aura pole energetyczne kolor' },
  { nav: 'Rape',              label: 'Rapé',                        emoji: '🌾', category: 'Medycyna Duchowa',     keywords: 'rapé tabaka ceremonia amazońska' },
  { nav: 'Sananga',           label: 'Sananga',                     emoji: '👁️',  category: 'Medycyna Duchowa',     keywords: 'sananga amazonia wzrok' },
  { nav: 'BiorhythmScreen',   label: 'Biorytm',                     emoji: '📊', category: 'Medycyna Duchowa',     keywords: 'biorytm cykl zdrowie' },

  // ── Duchowość Głęboka ──
  { nav: 'PastLife',          label: 'Poprzednie Życia',            emoji: '🌀', category: 'Duchowość Głęboka',    keywords: 'reinkarnacja karma poprzednie życie' },
  { nav: 'AncestralConnection',label: 'Połączenie z Przodkami',     emoji: '🌳', category: 'Duchowość Głęboka',    keywords: 'przodkowie korzenie rodzina' },
  { nav: 'SpiritAnimal',      label: 'Zwierzę Duszy',               emoji: '🦅', category: 'Duchowość Głęboka',    keywords: 'totem zwierzę duchowe' },
  { nav: 'SoulArchetype',     label: 'Archetyp Duszy',              emoji: '✦',  category: 'Duchowość Głęboka',    keywords: 'archetyp osobowość jung' },
  { nav: 'SoulContract',      label: 'Kontrakt Duszy',              emoji: '📜', category: 'Duchowość Głęboka',    keywords: 'kontrakt misja cel' },
  { nav: 'Consciousness',     label: 'Świadomość',                  emoji: '🧠', category: 'Duchowość Głęboka',    keywords: 'świadomość umysł przebudzenie' },
  { nav: 'EmotionalAnchors',  label: 'Kotwice Emocjonalne',         emoji: '⚓', category: 'Duchowość Głęboka',    keywords: 'emocje kotwice uzdrawianie' },

  // ── Raporty & Plany ──
  { nav: 'WeeklyReport',      label: 'Raport Tygodniowy',           emoji: '📊', category: 'Raporty',              keywords: 'raport podsumowanie tydzień' },
  { nav: 'Reports',           label: 'Raporty',                     emoji: '📈', category: 'Raporty',              keywords: 'historia analiza wgląd' },
  { nav: 'Achievements',      label: 'Osiągnięcia',                 emoji: '🏆', category: 'Raporty',              keywords: 'badge nagroda odznaka postęp' },
  { nav: 'SpiritualHabits',   label: 'Nawyki Duchowe',              emoji: '✅', category: 'Raporty',              keywords: 'nawyki habity codzienne postęp' },
  { nav: 'SpiritualProfile',  label: 'Profil Duchowy',              emoji: '🌟', category: 'Raporty',              keywords: 'profil osobowość duchowość' },

  // ── Wspólnota ──
  { nav: 'CommunityChat',     label: 'Czat Wspólnoty',              emoji: '💬', category: 'Wspólnota',            keywords: 'czat pokój rozmowa' },
  { nav: 'GlobalShare',       label: 'Globalny Strumień',           emoji: '🌍', category: 'Wspólnota',            keywords: 'globalny dzielenie świat' },
  { nav: 'Social',            label: 'Wspólnota',                   emoji: '👥', category: 'Wspólnota',            keywords: 'społeczność ludzie portal' },
  { nav: 'CommunityAffirmation', label: 'Afirmacja Wspólnoty',      emoji: '💛', category: 'Wspólnota',            keywords: 'głosowanie wspólna afirmacja' },
  { nav: 'CommunityChronicle',label: 'Kroniki Wspólnoty',           emoji: '📜', category: 'Wspólnota',            keywords: 'kronika historii społeczność' },
  { nav: 'SpiritualChallenges',label: 'Wyzwania Duchowe',           emoji: '👑', category: 'Wspólnota',            keywords: 'wyzwanie challenge transformacja' },
  { nav: 'SoulMatch',         label: 'Kosmiczne Dopasowanie',       emoji: '💜', category: 'Wspólnota',            keywords: 'dopasowanie dusze rezonans' },
  { nav: 'LiveRituals',       label: 'Rytuały na Żywo',             emoji: '🔴', category: 'Wspólnota',            keywords: 'live na żywo ceremonia' },
  { nav: 'EnergyCircle',      label: 'Krąg Energetyczny',           emoji: '🌐', category: 'Wspólnota',            keywords: 'krąg medytacja synchroniczna' },
  { nav: 'MilestoneShare',    label: 'Podziel się Sukcesem',        emoji: '🏅', category: 'Wspólnota',            keywords: 'kamień milowy sukcesy dzielenie' },

  // ── Oracle & AI ──
  { nav: 'OracleChat',        label: 'Portal Oracle',               emoji: '🔮', category: 'Oracle & AI',          keywords: 'portal wyrocznia oracle AI wejście' },
  { nav: 'DailyCheckIn',      label: 'Codzienny Check-In',          emoji: '📝', category: 'Oracle & AI',          keywords: 'codzienne sprawdzenie nastrój' },
  { nav: 'GuidancePreference',label: 'Preferencje Prowadzenia',     emoji: '⚙️',  category: 'Oracle & AI',          keywords: 'ustawienia styl guidance' },
  { nav: 'PartnerJournal',    label: 'Dziennik Partnerski',         emoji: '💑', category: 'Oracle & AI',          keywords: 'partner wspólny dziennik' },
  { nav: 'SoulMentors',       label: 'Mentorzy Duszy',              emoji: '✦',  category: 'Oracle & AI',          keywords: 'mentor przewodnik sesja' },
];

// Remove duplicates by nav name
const uniqueCatalog = Array.from(new Map(CATALOG.map(s => [s.nav, s])).values());

// Deterministic accent color per category
const CATEGORY_COLORS: Record<string, string> = {
  'Astrologia':         '#6366F1',
  'Tarot & Wróżenie':   '#CEAE72',
  'Numerologia':        '#8B5CF6',
  'Medytacja':          '#10B981',
  'Dziennik':           '#F97316',
  'Afirmacje':          '#FBBF24',
  'Rytuały':            '#DC2626',
  'Medycyna Duchowa':   '#34D399',
  'Duchowość Głęboka':  '#818CF8',
  'Raporty':            '#60A5FA',
  'Wspólnota':          '#EC4899',
  'Oracle & AI':        '#A78BFA',
};

const getCategoryColor = (category: string): string =>
  CATEGORY_COLORS[category] || '#CEAE72';

// ─── Component ────────────────────────────────────────────────────────────────
export const SearchScreen = ({ navigation }: any) => {
  const { currentTheme: theme, isLight } = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const accent = theme.primary || '#CEAE72';
  const bg = isLight ? '#FAF8F3' : '#06070C';
  const cardBg = isLight ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(169,122,57,0.15)' : 'rgba(255,255,255,0.08)';
  const textPrimary = isLight ? '#1A120A' : '#F5F1EA';
  const textSecondary = isLight ? '#7A5A38' : 'rgba(245,241,234,0.50)';
  const inputBg = isLight ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.06)';
  const inputBorder = isLight ? 'rgba(169,122,57,0.25)' : 'rgba(255,255,255,0.12)';

  const filtered = useMemo(() => {
    if (!query.trim()) return uniqueCatalog;
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return uniqueCatalog.filter(item => {
      const haystack = (item.label + ' ' + item.keywords + ' ' + item.category).toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return haystack.includes(q);
    });
  }, [query]);

  const handleSelect = useCallback((item: ScreenEntry) => {
    HapticsService.impact('light');
    Keyboard.dismiss();
    navigation.navigate(item.nav, item.navParams ?? {});
  }, [navigation]);

  const renderItem = useCallback(({ item, index }: { item: ScreenEntry; index: number }) => {
    const color = getCategoryColor(item.category);
    return (
      <Animated.View entering={FadeInDown.delay(index * 22).duration(240)}>
        <Pressable
          onPress={() => handleSelect(item)}
          style={({ pressed }) => [
            s.item,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              borderLeftColor: color,
              opacity: pressed ? 0.78 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          {/* Subtle left gradient glow */}
          <LinearGradient
            colors={[color + '18', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Icon circle */}
          <View style={[s.iconCircle, { backgroundColor: color + '1A', borderColor: color + '30' }]}>
            <Text style={s.itemEmoji}>{item.emoji}</Text>
          </View>

          {/* Text content */}
          <View style={s.textBlock}>
            <Text style={[s.itemLabel, { color: textPrimary }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[s.itemCategory, { color: color }]} numberOfLines={1}>
              {item.category}
            </Text>
          </View>

          {/* Arrow */}
          <ChevronRight size={16} color={color} strokeWidth={2} style={{ opacity: 0.7 }} />
        </Pressable>
      </Animated.View>
    );
  }, [cardBg, cardBorder, textPrimary, textSecondary, handleSelect]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: bg }]} edges={['top']}>
      {/* Header row */}
      <View style={s.headerRow}>
        <Pressable onPress={() => navigation.goBack()} style={s.backBtn} hitSlop={10}>
          <ArrowLeft size={22} color={accent} strokeWidth={1.8} />
        </Pressable>
        <View style={[s.inputWrap, { backgroundColor: inputBg, borderColor: inputBorder }]}>
          <Search size={16} color={textSecondary} strokeWidth={1.8} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder', 'Szukaj ekranu lub funkcji...')}
            placeholderTextColor={textSecondary}
            style={[s.input, { color: textPrimary }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <X size={16} color={textSecondary} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Result count */}
      <Animated.View entering={FadeIn.duration(200)} style={s.countRow}>
        <Text style={[s.countText, { color: textSecondary }]}>
          {query
            ? t('search.countFound', '{{n}} ekranow dla "{{q}}"', { n: filtered.length, q: query })
            : t('search.countAll', '{{n}} dostepnych', { n: filtered.length })}
        </Text>
      </Animated.View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.nav + item.label}
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={s.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyEmoji}>🔮</Text>
            <Text style={[s.emptyText, { color: textSecondary }]}>
              {t('search.noResults', 'Nie znaleziono ekranu dla "{{q}}"', { q: query })}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1 },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  backBtn: { padding: 4 },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  input: { flex: 1, fontSize: 15, padding: 0, margin: 0 },
  countRow: { paddingHorizontal: 20, paddingBottom: 10 },
  countText: { fontSize: 12, letterSpacing: 0.3 },
  listContent: { paddingHorizontal: 14, paddingBottom: 40 },

  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 9, borderRadius: 16,
    borderWidth: 1, borderLeftWidth: 3,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 52, height: 52, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  itemEmoji: { fontSize: 26 },
  textBlock: { flex: 1, gap: 3 },
  itemLabel: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  itemCategory: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },

  empty: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
});
