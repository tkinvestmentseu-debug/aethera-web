import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, View, Dimensions, Text, Platform
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Ellipse, G, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { PlatformPagerView } from '../components/PlatformPagerView';
import {
  ArrowRight, Sparkles, Moon, Star, Flame, Wind,
  Heart, Eye, BookOpen, Compass, Plus, Layers,
  Globe2, Droplets, MoonStar, Brain, Zap, Waves, CalendarDays, Target, Gem, Sun, CheckSquare2,
} from 'lucide-react-native';
import { getZodiacSign, ZODIAC_LABELS } from '../features/horoscope/utils/astrology';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useOracleStore } from '../store/useOracleStore';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { SoulEngineService } from '../core/services/soulEngine.service';
import i18n from '../core/i18n';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { navigateToDashboardSurface, navigateToMainTab } from '../navigation/navigationFallbacks';
import { TarotCardVisual } from '../features/tarot/components/TarotCardVisual';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { DailyCheckInScreen } from './DailyCheckInScreen';

const { width: SW } = Dimensions.get('window');

// ── Unikalne tła SVG dla każdego tematu ──────────────────────

const TarotBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.18}>
    <G>
      {[0,1,2,3,4,5].map(i => (
        <G key={i} transform={`translate(${40 + i*52}, ${20 + (i%2)*40}) rotate(${-15 + i*8})`}>
          <Rect x={-14} y={-22} width={28} height={44} rx={4} stroke={color} strokeWidth={1.2} fill="none"/>
          <Line x1={-8} y1={-10} x2={8} y2={-10} stroke={color} strokeWidth={0.8}/>
          <Circle cx={0} cy={4} r={5} stroke={color} strokeWidth={0.8} fill="none"/>
        </G>
      ))}
      {[0,1,2,3,4,5,6,7].map(i => (
        <G key={i} transform={`translate(${60 + i*38}, ${160 + (i%3)*18})`}>
          <Path d={`M0,-6 L1.8,1.8 L-3,0.6 L3,0.6 L-1.8,1.8 Z`} stroke={color} strokeWidth={0.8} fill="none"/>
        </G>
      ))}
    </G>
  </Svg>
);

const HoroscopeBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.15}>
    <G>
      <Circle cx={SW/2} cy={80} r={60} stroke={color} strokeWidth={1} fill="none" strokeDasharray="4 6"/>
      <Circle cx={SW/2} cy={80} r={40} stroke={color} strokeWidth={0.8} fill="none" strokeDasharray="2 4"/>
      <Circle cx={SW/2} cy={80} r={20} stroke={color} strokeWidth={0.6} fill="none"/>
      {Array.from({length:12}, (_,i) => {
        const a = (i*30 - 90) * Math.PI / 180;
        const x1 = SW/2 + Math.cos(a)*42; const y1 = 80 + Math.sin(a)*42;
        const x2 = SW/2 + Math.cos(a)*62; const y2 = 80 + Math.sin(a)*62;
        return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1}/>;
      })}
      {Array.from({length:12}, (_,i) => {
        const a = (i*30 - 90) * Math.PI / 180;
        const x = SW/2 + Math.cos(a)*75; const y = 80 + Math.sin(a)*75;
        return <Circle key={i} cx={x} cy={y} r={2.5} fill={color}/>;
      })}
    </G>
  </Svg>
);

const AstrologyBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.14}>
    <G>
      {[[50,40],[140,30],[250,60],[310,40],[180,90],[80,130],[260,120]].map(([x,y],i) => (
        <G key={i}>
          <Circle cx={x} cy={y} r={2} fill={color}/>
          {i < 6 && <Line x1={x} y1={y} x2={[[140,30],[250,60],[310,40],[180,90],[80,130],[260,120]][i][0]} y2={[[140,30],[250,60],[310,40],[180,90],[80,130],[260,120]][i][1]} stroke={color} strokeWidth={0.6} opacity={0.6}/>}
        </G>
      ))}
      <Circle cx={SW/2} cy={60} r={90} stroke={color} strokeWidth={0.6} fill="none" strokeDasharray="3 8"/>
      {Array.from({length:8}, (_,i) => {
        const a = i*45 * Math.PI/180;
        return <Path key={i} d={`M${SW/2},60 L${SW/2+Math.cos(a)*90},${60+Math.sin(a)*90}`} stroke={color} strokeWidth={0.4} opacity={0.4}/>;
      })}
    </G>
  </Svg>
);

const RitualsBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.16}>
    <G>
      <Path d={`M${SW/2},10 L${SW/2+4},30 L${SW/2},26 L${SW/2-4},30 Z`} stroke={color} strokeWidth={1.2} fill="none"/>
      {[0,1,2].map(i => (
        <Ellipse key={i} cx={SW/2} cy={50+i*30} rx={20-i*4} ry={8+i*4} stroke={color} strokeWidth={0.8} fill="none" opacity={0.7-i*0.2}/>
      ))}
      {Array.from({length:7}, (_,i) => {
        const a = (i*51) * Math.PI/180;
        const r = 70 + (i%3)*20;
        return <Circle key={i} cx={SW/2+Math.cos(a)*r} cy={100+Math.sin(a)*r*0.5} r={1.5} fill={color} opacity={0.6}/>;
      })}
      <Path d={`M${SW*0.2},180 C${SW*0.3},160 ${SW*0.4},140 ${SW/2},130 C${SW*0.6},140 ${SW*0.7},160 ${SW*0.8},180`} stroke={color} strokeWidth={1} fill="none" opacity={0.5}/>
    </G>
  </Svg>
);

const CleansingBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.14}>
    <G>
      {[0,1,2,3].map(i => (
        <Path key={i} d={`M${SW*0.1+i*SW*0.22},180 C${SW*0.1+i*SW*0.22+20},160 ${SW*0.1+i*SW*0.22+10},140 ${SW*0.1+i*SW*0.22+30},120`} stroke={color} strokeWidth={1.2} fill="none" opacity={0.8-i*0.15} strokeLinecap="round"/>
      ))}
      <Circle cx={SW/2} cy={90} r={50} stroke={color} strokeWidth={0.8} fill="none" strokeDasharray="3 5"/>
      <Circle cx={SW/2} cy={90} r={30} stroke={color} strokeWidth={0.6} fill="none" strokeDasharray="2 4"/>
      <Circle cx={SW/2} cy={90} r={12} stroke={color} strokeWidth={0.8} fill="none"/>
    </G>
  </Svg>
);

const SupportBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.14}>
    <G>
      <Path d={`M${SW/2},90 C${SW/2-30},70 ${SW/2-50},50 ${SW/2-20},40 C${SW/2-5},35 ${SW/2},45 ${SW/2},55 C${SW/2},45 ${SW/2+5},35 ${SW/2+20},40 C${SW/2+50},50 ${SW/2+30},70 ${SW/2},90 Z`} stroke={color} strokeWidth={1.4} fill="none"/>
      {[0,1,2].map(i => (
        <Path key={i} d={`M${SW/2},${110+i*22} C${SW/2-20},${100+i*22} ${SW/2-30},${90+i*22} ${SW/2-10},${80+i*22} C${SW/2-2},${77+i*22} ${SW/2},${82+i*22} ${SW/2},${87+i*22} C${SW/2},${82+i*22} ${SW/2+2},${77+i*22} ${SW/2+10},${80+i*22} C${SW/2+30},${90+i*22} ${SW/2+20},${100+i*22} ${SW/2},${110+i*22} Z`} stroke={color} strokeWidth={0.8} fill="none" opacity={0.6-i*0.15}/>
      ))}
    </G>
  </Svg>
);

const DreamsBg = ({ color }: { color: string }) => (
  <Svg width={SW} height={220} style={StyleSheet.absoluteFill} opacity={0.15}>
    <G>
      <Path d={`M${SW*0.65},40 C${SW*0.65-30},20 ${SW*0.65-60},25 ${SW*0.65-55},50 C${SW*0.65-50},70 ${SW*0.65-20},80 ${SW*0.65},70 C${SW*0.65+15},65 ${SW*0.65+20},50 ${SW*0.65},40 Z`} stroke={color} strokeWidth={1.4} fill="none"/>
      {[0,1,2,3,4].map(i => (
        <Circle key={i} cx={SW*0.15+i*SW*0.18} cy={140+Math.sin(i)*20} r={1.5+(i%2)} fill={color} opacity={0.5+i*0.1}/>
      ))}
      {[0,1,2].map(i => (
        <Ellipse key={i} cx={SW*0.3+i*SW*0.2} cy={170} rx={20-i*4} ry={4} stroke={color} strokeWidth={0.6} fill="none" opacity={0.5}/>
      ))}
    </G>
  </Svg>
);

// ── Dane ekranów ─────────────────────────────────────────────

const WORLD_TILE_DETAILS: Record<string, { label: string; subtitle: string; route: string; icon: any }[]> = {
  tarot: [
    { label: 'Karta dnia', subtitle: 'Jeden znak na cały dzień', route: 'DailyTarot', icon: Star },
    { label: 'Nowy odczyt', subtitle: 'Wejdź w pełną ceremonię talii', route: 'TarotDeckSelection', icon: Sparkles },
    { label: 'Wróżka', subtitle: 'Prowadzona konsultacja symboliczna', route: 'Wrozka', icon: Moon },
    { label: 'Partner', subtitle: 'Rozkład dla więzi i napięć', route: 'PartnerTarot', icon: Heart },
  ],
  horoscope: [
    { label: 'Horoskop', subtitle: 'Twój codzienny ton znaku', route: 'Horoscope', icon: Moon },
    { label: 'Chiński', subtitle: 'Druga warstwa rytmu dnia', route: 'ChineseHoroscope', icon: Star },
    { label: 'Zgodność', subtitle: 'Dynamika z drugą osobą', route: 'Compatibility', icon: Heart },
    { label: 'Księżyc', subtitle: 'Fazy i rytuały lunarne', route: 'LunarCalendar', icon: MoonStar },
    { label: 'Roczna Wizja', subtitle: 'Rok osobisty i prognoza roczna', route: 'AnnualForecast', icon: CalendarDays },
    { label: 'Karta urodzenia', subtitle: 'Mapa planet w chwili narodzin', route: 'NatalChart', icon: Compass },
    { label: 'Retrogradacje', subtitle: 'Kiedy planety cofają się', route: 'Retrogrades', icon: Layers },
    { label: 'Medytacja znaku', subtitle: 'Prowadzona praktyka twojego znaku', route: 'SignMeditation', icon: Sparkles },
  ],
  astrology: [
    { label: 'Gwiazdy', subtitle: 'Mapa nieba i aktywne tranzyty', route: 'Stars', icon: Star },
    { label: 'Numerologia', subtitle: 'Kod dnia i jego ciśnienie', route: 'Numerology', icon: Compass },
    { label: 'Matryca', subtitle: 'Twoje osie życia i lekcje', route: 'Matrix', icon: Layers },
    { label: 'Biorytmy', subtitle: 'Krzywa energii i koncentracji', route: 'Biorhythm', icon: Zap },
    { label: 'Tranzyty planet', subtitle: 'Pozycje planet i aspekty dziś', route: 'AstroTransits', icon: Globe2 },
  ],
  rituals: [
    { label: 'Poranny Rytuał', subtitle: '5 etapów porannej praktyki', route: 'MorningRitual', icon: Sun },
    { label: 'Rytuał dnia', subtitle: 'Najmocniejszy ruch na teraz', route: 'DailyRitualAI', icon: Flame },
    { label: 'Biblioteka', subtitle: 'Komnata praktyk i ceremonii', route: 'Rituals', icon: Layers },
    { label: 'Journeys', subtitle: 'Ścieżki głębszego procesu', route: 'Journeys', icon: Compass },
    { label: 'Intencje', subtitle: 'Artefakty i karty rytualne', route: 'IntentionCards', icon: Sparkles },
    { label: 'Mantra', subtitle: 'Spersonalizowana mantra wedyjska', route: 'MantraGenerator', icon: Sparkles },
    { label: 'Tablica Manifestacji', subtitle: 'Kosmiczna mapa 9 intencji', route: 'VisionBoard', icon: Target },
    { label: 'Ogień ceremonii', subtitle: 'Rytuał transformacji przez płomień', route: 'FireCeremony', icon: Flame },
    { label: 'Przodkowie', subtitle: 'Połączenie z linią genealogiczną', route: 'AncestralConnection', icon: BookOpen },
    { label: 'Nawyki Duchowe', subtitle: 'Śledź 12 codziennych praktyk', route: 'SpiritualHabits', icon: CheckSquare2 },
  ],
  cleansing: [
    { label: 'Oczyszczanie', subtitle: 'Uwolnij to, co zalega', route: 'Cleansing', icon: Wind },
    { label: 'Oddech', subtitle: 'Techniki oczyszczające oddechem', route: 'Breathwork', icon: Droplets },
    { label: 'Rytuał', subtitle: 'Ceremonia uwolnienia i powrotu', route: 'RitualCategorySelection', icon: Flame },
    { label: 'Fale', subtitle: 'Przestrajanie pola i nerwów', route: 'BinauralBeats', icon: Waves },
    { label: 'Tarcza ochronna', subtitle: 'Osłona pola energetycznego', route: 'ProtectionRitual', icon: Layers },
    { label: 'Kąpiel solna', subtitle: 'Rytuał oczyszczenia wodą i solą', route: 'SaltBath', icon: Droplets },
    { label: 'Listy do ognia', subtitle: 'Pisanie i puszczanie', route: 'ReleaseLetters', icon: BookOpen },
  ],
  support: [
    { label: 'Afirmacje', subtitle: 'Słowa wsparcia i miękkości', route: 'Affirmations', icon: Heart },
    { label: 'Kąpiel Dźwiękowa', subtitle: 'Uzdrawiające częstotliwości', route: 'SoundBath', icon: Waves },
    { label: 'Wdzięczność', subtitle: 'Trzy rzeczy, które zakotwiczają', route: 'Gratitude', icon: Sparkles },
    { label: 'Czakry', subtitle: 'Mapa energetyczna ciała', route: 'Chakra', icon: Eye },
    { label: 'Wewnętrzne dziecko', subtitle: 'Uzdrowienie dawnych ran', route: 'InnerChild', icon: Heart },
    { label: 'Ulga w lęku', subtitle: 'Techniki na kryzys i spokój', route: 'AnxietyRelief', icon: Droplets },
    { label: 'Współczucie dla siebie', subtitle: 'Metoda Kristin Neff', route: 'SelfCompassion', icon: Sparkles },
    { label: 'Częstotliwości', subtitle: 'Solfegio i uzdrawiający dźwięk', route: 'HealingFrequencies', icon: Waves },
    { label: 'Kotwice emocjonalne', subtitle: 'NLP i zasoby wewnętrzne', route: 'EmotionalAnchors', icon: Layers },
    { label: 'Kryształy', subtitle: 'Przewodnik i odczyt kryształowy', route: 'CrystalGuide', icon: Gem },
  ],
  dreams: [
    { label: 'Zapisz sen', subtitle: 'Złap obraz zanim zniknie', route: 'JournalEntry', icon: Moon },
    { label: 'Archiwum', subtitle: 'Powracające symbole i motywy', route: 'Dreams', icon: BookOpen },
    { label: 'Słownik', subtitle: 'Tropy snu i podpowiedzi', route: 'Knowledge', icon: Eye },
    { label: 'Interpretuj', subtitle: 'Pogłębiony odczyt znaczenia', route: 'DreamInterpreter', icon: Brain },
    { label: 'Świadome śnienie', subtitle: 'Lucid dreaming — wejdź w sen', route: 'LucidDreaming', icon: Moon },
    { label: 'Rytuał snu', subtitle: 'Wieczorny protokół 7 kroków', route: 'SleepRitual', icon: Sparkles },
  ],
};

const WORLD_DECK_LABELS: Record<string, { label: string; title: string; body: string }> = {
  tarot: { label: 'Komnata kart', title: 'Nie feed funkcji, tylko stół odczytu.', body: 'Tarot ma być osobnym światem z własnym ciężarem. Najpierw znak dnia, potem pełny rozkład, potem relacja i archiwum.' },
  horoscope: { label: 'Komnata znaku', title: 'Ton dnia zanim wejdziesz w szczegóły.', body: 'Ta warstwa zbiera znak, relację i zgodność, ale nie miesza ich z szeroką astrologią. To osobny świat codziennego prowadzenia.' },
  astrology: { label: 'Obserwatorium', title: 'Cykle, liczby i mapa nieba w jednym miejscu.', body: 'Tu wchodzisz po głębszy kontekst: planety, numerologię, matrycę i biorytmy. Ten świat ma patrzeć szerzej niż horoskop.' },
  rituals: { label: 'Komnata ceremonii', title: 'Intencja musi prowadzić do praktyki.', body: 'Rytuały nie są już listą. Ten świat ma prowadzić od wyboru praktyki do artefaktu, ścieżki i świadomego domknięcia.' },
  cleansing: { label: 'Pole uwolnienia', title: 'Oddech, rytm i uwalnianie napięcia.', body: 'To świat oczyszczania pola. Oddzielony od wsparcia i rytuałów, skupiony na ulżeniu, oczyszczeniu i powrocie do centrum.' },
  support: { label: 'Przestrzeń ukojenia', title: 'Nie wszystko wymaga intensywności.', body: 'Tu użytkownik ma znaleźć miękkość, afirmację, zapis i oddech. To sanktuarium troski, nie kolejny techniczny panel.' },
  dreams: { label: 'Archiwum nocy', title: 'Podświadomość dostaje własną scenę.', body: 'Sny, interpretacja i symbolika powinny tworzyć jeden osobny krajobraz, a nie być dodatkiem do innych modułów.' },
};

const THEME_SCREENS = [
  { id: 'tarot',     title: 'Tarot',       icon: Layers,   eyebrow: 'KARTA I SYMBOL',       color: '#A97A39', bg: TarotBg,     bgFrom: '#FBF5EC', bgTo: '#F5EAD8', darkBg: ['#120A02', '#1C1006', '#26160A'] as const },
  { id: 'horoscope', title: 'Horoskop',    icon: Moon,     eyebrow: 'ZNAK I TON DNIA',      color: '#7B6FAA', bg: HoroscopeBg, bgFrom: '#F4F0FA', bgTo: '#EAE4F5', darkBg: ['#080510', '#100C1A', '#160E26'] as const },
  { id: 'astrology', title: 'Astrologia',  icon: Globe2,   eyebrow: 'NIEBO I CYKLE',        color: '#4A7FA5', bg: AstrologyBg, bgFrom: '#EEF4FA', bgTo: '#E2EEF7', darkBg: ['#020810', '#060E1C', '#0A1428'] as const },
  { id: 'rituals',   title: 'Rytuały',     icon: Flame,    eyebrow: 'INTENCJA I CEREMONIA', color: '#B5622A', bg: RitualsBg,   bgFrom: '#FBF0E8', bgTo: '#F5E4D4', darkBg: ['#120602', '#1C0C04', '#261206'] as const },
  { id: 'cleansing', title: 'Oczyszczanie',icon: Droplets, eyebrow: 'UWOLNIENIE I ODDECH',  color: '#2E8B6A', bg: CleansingBg, bgFrom: '#EDFAF4', bgTo: '#DDF4EA', darkBg: ['#020E08', '#051410', '#081C14'] as const },
  { id: 'support',   title: 'Wsparcie',    icon: Heart,    eyebrow: 'UKOJENIE I OPIEKA',    color: '#A5506A', bg: SupportBg,   bgFrom: '#FAF0F4', bgTo: '#F5E2EA', darkBg: ['#120408', '#1C0810', '#260A16'] as const },
  { id: 'dreams',    title: 'Sen',         icon: MoonStar, eyebrow: 'SYMBOL I NOC',         color: '#5A5A9A', bg: DreamsBg,    bgFrom: '#F2F0FA', bgTo: '#E8E4F5', darkBg: ['#04030E', '#080618', '#0C0A22'] as const },
] as const;

// ── Animated tile button with spring press effect ──────────────
const WorldTile = React.memo(({ label, subtitle, icon: Icon, accent, onPress, isLight }: { label: string; subtitle: string; icon: React.ComponentType<any>; accent: string; onPress: () => void; isLight: boolean }) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[styles.tileWrap, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 13, stiffness: 360 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); }}
        style={[styles.tile, {
          borderColor: accent + '66',
          backgroundColor: isLight ? '#FFF4E4' : '#141928',
          shadowColor: accent,
          shadowOpacity: 0.40,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 8 },
          elevation: 10,
        }]}
      >
        {/* Background depth gradient */}
        <LinearGradient colors={[accent + '28', 'transparent', accent + '08']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
        {/* Top shimmer */}
        <LinearGradient
          colors={['transparent', accent + 'AA', 'transparent'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }}
          pointerEvents="none"
        />
        {/* Corner ornament — top right */}
        <View style={{ position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: accent + '88' }} pointerEvents="none" />
        {/* Corner ornament — bottom left */}
        <View style={{ position: 'absolute', bottom: 9, left: 10, width: 5, height: 5, borderBottomWidth: 1, borderLeftWidth: 1, borderColor: accent + '44' }} pointerEvents="none" />

        <View style={[styles.tileIconWrap, { backgroundColor: accent + '28', borderColor: accent + '66' }]}>
          <Icon color={accent} size={18} strokeWidth={1.8} />
        </View>
        <Typography variant="cardTitle" style={[styles.tileTitle, { color: accent }]}>{label}</Typography>
        <Typography variant="bodySmall" style={styles.tileSubtitle}>{subtitle}</Typography>
        <View style={[styles.tileArrow, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
          <ArrowRight color={accent} size={13} strokeWidth={1.8} />
        </View>
      </Pressable>
    </Animated.View>
  );
});

export const TodayScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, {
      defaultValue: i18n.language?.startsWith('en') ? en : pl,
      ...options,
    })
  ), [t]);
  const insets = useSafeAreaInsets();
  const { themeName, userData, streaks, dailyProgress } = useAppStore();
  const { entries } = useJournalStore();
  const { currentSession, pastSessions } = useOracleStore();
  const { dailyDraw, pastReadings, selectedDeckId } = useTarotStore();
  const theme = useMemo(() => getResolvedTheme(themeName), [themeName]);
  const isLight = theme.background.startsWith('#F');
  const dailyPlan = useMemo(() => SoulEngineService.generateDailyPlan(), []);

  // --- CheckIn auto-popup ---
  const [showCheckIn, setShowCheckIn] = React.useState(false);
  const [checkInType, setCheckInType] = React.useState<'morning' | 'evening'>('morning');

  React.useEffect(() => {
    const { experience, dailyProgress } = useAppStore.getState();
    if (!(experience?.checkInEnabled ?? true)) return;
    const hour  = new Date().getHours();
    const today = new Date().toISOString().split('T')[0];
    const prog  = dailyProgress[today] || {};
    let tid: ReturnType<typeof setTimeout> | null = null;
    if (hour >= 6 && hour < 12 && !prog.checkInShownMorning) {
      setCheckInType('morning');
      tid = setTimeout(() => setShowCheckIn(true), 1200);
    } else if (hour >= 19 && hour < 23 && !prog.checkInShownEvening) {
      setCheckInType('evening');
      tid = setTimeout(() => setShowCheckIn(true), 1200);
    }
    return () => { if (tid) clearTimeout(tid); };
  }, []);
  const firstName = userData.name?.trim() || 'Wędrowcze';
  const pagerRef = useRef<any>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const today = new Date().toISOString().split('T')[0];
  const todayProgress = dailyProgress[today] || {};
  const localizedThemeScreens = useMemo(() => THEME_SCREENS.map((screen, index) => {
    const englishTitles = ['Tarot', 'Horoscope', 'Astrology', 'Rituals', 'Cleansing', 'Support', 'Dream'];
    const englishEyebrows = ['CARD & SYMBOL', 'SIGN & DAILY TONE', 'SKY & CYCLES', 'INTENTION & CEREMONY', 'RELEASE & BREATH', 'SOOTHING & CARE', 'SYMBOL & NIGHT'];
    return {
      ...screen,
      title: tr(`today.themes.${screen.id}.title`, screen.title, englishTitles[index] || screen.title),
      eyebrow: tr(`today.themes.${screen.id}.eyebrow`, screen.eyebrow, englishEyebrows[index] || screen.eyebrow),
    };
  }), [tr]);

  const handleTabPress = useCallback((index: number) => {
    setActiveIndex(index);
    if (Platform.OS !== 'web') {
      pagerRef.current?.setPage(index);
    }
    const offset = Math.max(0, index * 110 - SW / 2 + 55);
    tabScrollRef.current?.scrollTo({ x: offset, animated: true });
  }, []);

  const handlePageChange = useCallback((index: number) => {
    setActiveIndex(index);
    const offset = Math.max(0, index * 110 - SW / 2 + 55);
    tabScrollRef.current?.scrollTo({ x: offset, animated: true });
  }, []);

  const getStats = (id: string) => {
    switch (id) {
      case 'tarot': return {
        sessions: pastReadings?.length || 0,
        streak: streaks.current,
        tone: dailyPlan.cardOfTheDay?.advice ? resolveUserFacingText(dailyPlan.cardOfTheDay.advice).slice(0, 72) : tr('today.tarot.toneFallback', 'Otwórz kartę dnia i przyjmij symboliczny znak.', 'Open the card of the day and receive the symbolic sign.'),
        progress: Math.min(100, (pastReadings?.length || 0) * 5),
        lastActivity: dailyDraw ? tr('today.tarot.lastActivityActive', 'Karta dnia aktywna', 'Card of the day active') : tr('today.tarot.lastActivityEmpty', 'Brak karty dziś', 'No card today'),
        actions: [
          { label: tr('today.tarot.actions.daily', 'Karta dnia', 'Card of the day'), route: 'DailyTarot' },
          { label: tr('today.tarot.actions.new', 'Nowy odczyt', 'New reading'), route: 'TarotDeckSelection' },
          { label: tr('today.tarot.actions.seer', 'Wróżka', 'Seer'), route: 'Wrozka' },
        ],
        secondaryActions: [
          { label: tr('today.tarot.secondary.partner', 'Tarot relacyjny', 'Relationship tarot'), route: 'PartnerTarot' },
          { label: tr('today.tarot.secondary.archive', 'Archiwum', 'Archive'), route: 'Journal' },
        ],
        insight: dailyPlan.cardOfTheDay?.advice ? resolveUserFacingText(dailyPlan.cardOfTheDay.advice).slice(0,120) : tr('today.tarot.insightFallback', 'Karta dnia niesie symbol — warto go sprawdzić przed ważną decyzja.', 'The card of the day carries a symbol — it is worth checking before an important decision.'),
      };
      case 'horoscope': return {
sessions: pastSessions.filter((s: any) => s.source === 'astrology').length,
        streak: streaks.current,
        tone: dailyPlan.astrologyGuidance?.headline?.slice(0, 72) || tr('today.horoscope.toneFallback', 'Sprawdź osobisty ton swojego znaku na dziś.', 'Check your sign’s personal tone for today.'),
        progress: Math.min(100, pastSessions.filter((s: any) => s.source === 'astrology').length * 8 + (dailyPlan.energyScore || 40)),
        lastActivity: tr('today.horoscope.lastActivity', 'Ton dnia załadowany', 'Daily tone loaded'),
        actions: [
          { label: tr('today.horoscope.actions.personal', 'Horoskop osobisty', 'Personal horoscope'), route: 'Horoscope' },
          { label: tr('today.horoscope.actions.chinese', 'Chiński horoskop', 'Chinese horoscope'), route: 'ChineseHoroscope' },
          { label: tr('today.horoscope.actions.compatibility', 'Zgodność', 'Compatibility'), route: 'Compatibility' },
        ],
        secondaryActions: [
          { label: tr('today.horoscope.secondary.partner', 'Horoskop partnera', 'Partner horoscope'), route: 'PartnerHoroscope' },
          { label: tr('today.horoscope.secondary.atlas', 'Atlas Znaków', 'Sign atlas'), route: 'ZodiacAtlas' },
        ],
        insight: dailyPlan.astrologyGuidance?.support?.slice(0,120) || tr('today.horoscope.insightFallback', 'Sprawdź jak ton znaku wpływa na dzisiejsze relacje.', 'See how the sign’s tone shapes today’s relationships.'),
      };
      case 'astrology': return {
sessions: pastSessions.filter((s: any) => s.source === 'astrology').length,
        streak: streaks.current,
        tone: tr('today.astrology.tone', 'Wejdź głębiej w fazy Księżyca, cykle i kosmiczne mapy.', 'Go deeper into moon phases, cycles, and cosmic maps.'),
        progress: 30,
        lastActivity: tr('today.astrology.lastActivity', 'Niebo na dziś aktywne', 'Today’s sky is active'),
        actions: [
          { label: tr('today.astrology.actions.stars', 'Gwiazdy i cykle', 'Stars and cycles'), route: 'Stars' },
          { label: tr('today.astrology.actions.numerology', 'Numerologia', 'Numerology'), route: 'Numerology' },
          { label: tr('today.astrology.actions.matrix', 'Matryca życia', 'Life matrix'), route: 'Matrix' },
        ],
        secondaryActions: [
          { label: tr('today.astrology.secondary.partnerMatrix', 'Matryca partnerska', 'Partner matrix'), route: 'PartnerMatrix' },
          { label: tr('today.astrology.secondary.transits', 'Tranzyty planet', 'Planetary transits'), route: 'AstroTransits' },
        ],
        insight: dailyPlan.astrologyGuidance?.chineseInsight?.slice(0,120) || tr('today.astrology.insightFallback', 'Warstwa nieba aktywuje konkretne energie — sprawdź pełny obraz.', 'The sky layer activates specific energies — check the full picture.'),
      };
      case 'rituals': return {
        sessions: (todayProgress.completedRituals || []).length,
        streak: streaks.current,
        tone: dailyPlan.ritualGuidance?.featured?.title ? `${tr('today.rituals.recommended', 'Polecany', 'Recommended')}: ${dailyPlan.ritualGuidance.featured.title}` : tr('today.rituals.toneFallback', 'Intencja, przebieg i domknięcie procesu.', 'Intention, ritual flow, and conscious closure.'),
        progress: Math.min(100, (dailyPlan.energyScore || 40) + entries.filter((e: any) => e.type === 'reflection').length * 4),
        lastActivity: todayProgress.ritualCompleted ? tr('today.rituals.lastActivityDone', 'Rytuał wykonany dziś', 'Ritual completed today') : tr('today.rituals.lastActivityEmpty', 'Brak rytuału dziś', 'No ritual today'),
        actions: [
          { label: tr('today.rituals.actions.meditation', 'Medytacja', 'Meditation'), route: 'Meditation' },
          { label: tr('today.rituals.actions.library', 'Lista rytuałów', 'Ritual library'), route: 'Rituals' },
          { label: tr('today.rituals.actions.daily', 'Rytuał dnia', 'Ritual of the day'), route: 'DailyRitualAI' },
        ],
        secondaryActions: [
          { label: tr('today.rituals.secondary.journeys', 'Journeys', 'Journeys'), route: 'Journeys' },
          { label: tr('today.rituals.secondary.yearCard', 'Karta Roku', 'Year card'), route: 'YearCard' },
        ],
        insight: dailyPlan.ritualGuidance?.whyToday?.slice(0,120) || tr('today.rituals.insightFallback', 'Rytuał dnia jest dobrany do aktualnego tonu energetycznego.', 'The ritual of the day is matched to the current energetic tone.'),
      };
      case 'cleansing': return {
sessions: pastSessions.filter((s: any) => s.source === 'cleansing').length,
        streak: streaks.current,
        tone: dailyPlan.patternSignal?.slice(0, 72) || tr('today.cleansing.toneFallback', 'Uwolnij to, co ciąży. Odzyskaj lekkość i własne centrum.', 'Release what weighs you down. Return to lightness and your own center.'),
        progress: 20,
        lastActivity: tr('today.cleansing.lastActivity', 'Gotowe do oczyszczenia', 'Ready for cleansing'),
        actions: [
          { label: tr('today.cleansing.actions.enter', 'Wejdź w oczyszczanie', 'Enter cleansing'), route: 'Cleansing' },
          { label: tr('today.cleansing.actions.release', 'Rytuał uwolnienia', 'Release ritual'), route: 'RitualCategorySelection' },
          { label: tr('today.cleansing.actions.breath', 'Oddech oczyszczający', 'Cleansing breathwork'), route: 'Breathwork' },
        ],
        secondaryActions: [
          { label: tr('today.cleansing.secondary.shadow', 'Praca z cieniem', 'Shadow work'), route: 'ShadowWork' },
          { label: tr('today.cleansing.secondary.crystal', 'Kryształowa Kula', 'Crystal ball'), route: 'CrystalBall' },
        ],
        insight: dailyPlan.patternSignal?.slice(0,120) || tr('today.cleansing.insightFallback', 'Oczyszczanie zaczyna się od oddechu i nazwania tego, co dziś ciąży.', 'Cleansing begins with breath and naming what feels heavy today.'),
      };
      case 'support': return {
sessions: pastSessions.filter((s: any) => s.source === 'affirmation').length,
        streak: streaks.current,
        tone: dailyPlan.affirmationGuidance?.featured?.text?.slice(0, 72) || tr('today.support.toneFallback', 'Ciche zakotwiczenie i ukojenie na dziś.', 'A quiet anchoring and soft support for today.'),
        progress: todayProgress.affirmationRead ? 80 : 15,
        lastActivity: todayProgress.affirmationRead ? tr('today.support.lastActivityDone', 'Afirmacja przeczytana', 'Affirmation completed') : tr('today.support.lastActivityWaiting', 'Afirmacja czeka', 'Affirmation is waiting'),
        actions: [
          { label: tr('today.support.actions.affirmations', 'Afirmacje', 'Affirmations'), route: 'Affirmations' },
          { label: tr('today.support.actions.journal', 'Dziennik', 'Journal'), route: 'Journal' },
          { label: tr('today.support.actions.energyJournal', 'Dziennik energii', 'Energy journal'), route: 'EnergyJournal' },
        ],
        secondaryActions: [
          { label: tr('today.support.secondary.moonRitual', 'Rytuał księżycowy', 'Moon ritual'), route: 'MoonRitual' },
          { label: tr('today.support.secondary.sleepHelper', 'Pomocnik snu', 'Sleep helper'), route: 'SleepHelper' },
        ],
        insight: dailyPlan.affirmationGuidance?.rationale?.slice(0,120) || tr('today.support.insightFallback', 'Afirmacja działa najgłębiej, gdy powtórzysz ją powoli trzy razy.', 'An affirmation works most deeply when you repeat it slowly three times.'),
      };
      case 'dreams': return {
        sessions: entries.filter(e => e.type === 'dream').length,
        streak: streaks.current,
        tone: tr('today.dreams.tone', 'Zapisz świeży sen lub sprawdź powracające symbole podświadomości.', 'Save a fresh dream or explore recurring symbols from the subconscious.'),
        progress: Math.min(100, entries.filter(e => e.type === 'dream').length * 8),
        lastActivity: entries.find(e => e.type === 'dream') ? tr('today.dreams.lastActivityDone', 'Sen zapisany', 'Dream saved') : tr('today.dreams.lastActivityEmpty', 'Brak zapisów snów', 'No dream entries yet'),
        actions: [
          { label: tr('today.dreams.actions.archive', 'Archiwum snów', 'Dream archive'), route: 'Dreams' },
          { label: tr('today.dreams.actions.save', 'Zapisz sen', 'Save dream'), route: 'JournalEntry' },
          { label: tr('today.dreams.actions.symbols', 'Słownik symboli', 'Symbol dictionary'), route: 'Knowledge' },
        ],
        secondaryActions: [
          { label: tr('today.dreams.secondary.ai', 'AI interpretacja', 'AI interpretation'), route: 'DreamInterpreter' },
          { label: tr('today.dreams.secondary.reports', 'Raporty', 'Reports'), route: 'Reports' },
        ],
        insight: tr('today.dreams.insight', 'Sen zapisany zaraz po przebudzeniu daje 5x więcej materiału symbolicznego.', 'A dream captured right after waking gives five times more symbolic material.'),
      };
      default: return { sessions: 0, streak: 0, tone: '', progress: 0, lastActivity: '', actions: [], secondaryActions: [], insight: '' };
    }
  };

  const handleAction = (id: string, route: string) => {
    if (route === 'OracleTab') { navigateToMainTab(navigation, 'Oracle'); return; }
    navigation.navigate(route);
  };

  const userZodiacSign = userData.birthDate ? (() => {
    try { return getZodiacSign(userData.birthDate); } catch { return null; }
  })() : null;

  const getTimeGreeting = () => {
    const h = new Date().getHours();
    if (h < 6)  return tr('today.greeting.night', 'Dobranoc', 'Good night');
    if (h < 12) return tr('today.greeting.morning', 'Dzień dobry', 'Good morning');
    if (h < 18) return tr('today.greeting.day', 'Witaj', 'Welcome');
    return tr('today.greeting.evening', 'Dobry wieczór', 'Good evening');
  };

  const getWorldTiles = (id: string): { label: string; subtitle: string; route: string; icon: any }[] => {
    return (WORLD_TILE_DETAILS[id] || []).map((tile, index) => ({
      ...tile,
      label: tr(`today.worldTiles.${id}.${index}.label`, tile.label, resolveUserFacingText(tile.label)),
      subtitle: tr(`today.worldTiles.${id}.${index}.subtitle`, tile.subtitle, resolveUserFacingText(tile.subtitle)),
    }));
  };

  const renderWorldHero = (screen: any): React.ReactNode => {
    const accent = screen.color;
    const heroBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
    const heroText = isLight ? '#1A1410' : '#F0EAF8';
    const heroSub = isLight ? '#6A5A48' : '#A090C0';

    switch (screen.id) {

      case 'tarot': {
        const planCard = dailyPlan.cardOfTheDay;
        const isDrawn = Boolean(dailyDraw && dailyDraw.date === today);
        const activeCard = isDrawn ? dailyDraw!.card : planCard;
        const tarotDeck = getTarotDeckById(dailyDraw?.deckId || selectedDeckId);
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <View style={styles.heroCardRow}>
              <View style={styles.heroCardText}>
            <Text style={[styles.heroEyebrow, { color: accent }]}>🃏 {tr('today.tarot.heroEyebrow', 'KARTA DNIA', 'CARD OF THE DAY')}</Text>
                <Text style={[styles.heroTitle, { color: heroText }]} numberOfLines={1}>
                  {activeCard
                    ? resolveUserFacingText(activeCard.name)
                    : tr('today.tarot.heroTitleFallback', 'Otwórz kartę dnia', 'Open the card of the day')}
                </Text>
                <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
                  {activeCard
                    ? resolveUserFacingText(activeCard.advice).slice(0, 80)
                    : tr(
                        'today.tarot.heroSubFallback',
                        'Symboliczny znak czeka na odczytanie.',
                        'A symbolic sign is waiting to be read.',
                      )}
                </Text>
              </View>
              <TarotCardVisual
                deck={tarotDeck}
                card={isDrawn ? dailyDraw!.card : undefined}
                isReversed={isDrawn ? dailyDraw!.isReversed : false}
                faceDown={!isDrawn}
                size="small"
              />
            </View>
          </Animated.View>
        );
      }

      case 'horoscope': {
        const moon = dailyPlan.moonPhase;
        const sign = userZodiacSign;
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>{t('horoscope.yourSign')}</Text>
            <View style={styles.heroRow}>
              <Text style={[styles.heroTitle, { color: heroText, flex: 1 }]} numberOfLines={1}>
                {sign
                  ? (ZODIAC_LABELS[sign] || sign)
                  : tr('today.horoscope.heroTitleFallback', 'Horoskop osobisty', 'Personal horoscope')}
              </Text>
              <View style={[styles.heroBadge, { borderColor: accent + '44', backgroundColor: accent + '14' }]}>
                <Text style={[styles.heroBadgeText, { color: accent }]}>
                  {moon?.icon || '🌙'} {moon?.name || tr('today.horoscope.moonFallback', 'Faza Księżyca', 'Moon phase')}
                </Text>
              </View>
            </View>
            <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
              {dailyPlan.astrologyGuidance?.headline?.slice(0, 90)
                || tr('today.horoscope.heroSubFallback', 'Sprawdź ton swojego znaku na dziś.', 'Check the tone of your sign for today.')}
            </Text>
          </Animated.View>
        );
      }

      case 'astrology': {
        const moon = dailyPlan.moonPhase;
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>
              {tr('today.astrology.heroEyebrow', 'ENERGIA NIEBA', 'SKY ENERGY')}
            </Text>
            <View style={styles.heroRow}>
              <Text style={[styles.heroTitle, { color: heroText, flex: 1 }]} numberOfLines={1}>
                {moon?.name || tr('today.astrology.heroTitleFallback', 'Faza Księżyca', 'Moon phase')}
              </Text>
              <Text style={[styles.heroMoon, { color: accent }]}>{moon?.icon || '🌙'}</Text>
            </View>
            <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
              {dailyPlan.astrologyGuidance?.chineseInsight?.slice(0, 90)
                || tr('today.astrology.heroSubFallback', 'Niebo aktywuje konkretne energie dziś.', 'The sky is activating specific energies today.')}
            </Text>
          </Animated.View>
        );
      }

      case 'rituals': {
        const ritual = dailyPlan.ritualGuidance?.featured;
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>
              {tr('today.rituals.heroEyebrow', 'RYTUAŁ DNIA', 'RITUAL OF THE DAY')}
            </Text>
            <Text style={[styles.heroTitle, { color: heroText }]} numberOfLines={1}>
              {ritual?.title || tr('today.rituals.heroTitleFallback', 'Rytuał dnia czeka', 'Your ritual of the day is waiting')}
            </Text>
            <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
              {ritual
                ? `${ritual.category} · ${ritual.duration}`
                : tr('today.rituals.heroSubFallback', 'Intencja, przebieg i domknięcie procesu.', 'Intention, flow, and a conscious closing of the process.')}
            </Text>
          </Animated.View>
        );
      }

      case 'cleansing': {
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>
              {tr('today.cleansing.heroEyebrow', 'CO DZIŚ PUŚCIĆ', 'WHAT TO RELEASE TODAY')}
            </Text>
            <Text style={[styles.heroTitle, { color: heroText }]} numberOfLines={1}>
              {tr('today.cleansing.heroTitle', 'Sygnał oczyszczenia', 'Cleansing signal')}
            </Text>
            <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
              {dailyPlan.patternSignal?.slice(0, 90)
                || tr('today.cleansing.heroSubFallback', 'Uwolnij to, co ciąży. Odzyskaj lekkość i własne centrum.', 'Release what feels heavy. Return to lightness and your own center.')}
            </Text>
          </Animated.View>
        );
      }

      case 'support': {
        const affirmation = dailyPlan.affirmationGuidance?.featured?.text;
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>{t('portal.daily_affirmation')}</Text>
            <Text style={[styles.heroAffirmation, { color: heroText }]} numberOfLines={3}>
              {affirmation
                ? `„${affirmation}"`
                : tr('today.support.heroFallback', 'Ciche zakotwiczenie i ukojenie na dziś.', 'A quiet anchoring and soft support for today.')}
            </Text>
          </Animated.View>
        );
      }

      case 'dreams': {
        const lastDream = entries.find(e => e.type === 'dream');
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(500)} style={[styles.heroBlock, { borderColor: accent + '33', backgroundColor: heroBg }]}>
            <LinearGradient colors={[accent + '1A', accent + '06', 'transparent']} style={StyleSheet.absoluteFill}/>
            <Text style={[styles.heroEyebrow, { color: accent }]}>
              {tr('today.dreams.heroEyebrow', 'SYMBOLARIUM NOCY', 'NIGHT SYMBOLARIUM')}
            </Text>
            <Text style={[styles.heroTitle, { color: heroText }]} numberOfLines={1}>
              {lastDream
                ? (lastDream.title || tr('today.dreams.heroTitleSavedFallback', 'Ostatni sen', 'Last dream'))
                : tr('today.dreams.heroTitleEmpty', 'Zapisz świeży sen', 'Save a fresh dream')}
            </Text>
            <Text style={[styles.heroSub, { color: heroSub }]} numberOfLines={2}>
              {lastDream
                ? tr('today.dreams.heroSubSaved', 'Sen zapisany — sprawdź powracające symbole.', 'Dream saved — review recurring symbols.')
                : tr('today.dreams.heroSubEmpty', 'Sen zapisany zaraz po przebudzeniu daje 5x więcej materiału.', 'A dream recorded right after waking gives five times more material.')}
            </Text>
          </Animated.View>
        );
      }

      default: return null;
    }
  };

  const renderPage = (screen: any) => {
    const stats = getStats(screen.id);
    const Icon = screen.icon;
    const BgComponent = screen.bg;
    const accent = screen.color;

    return (
      <View key={screen.id} style={styles.page}>
        <LinearGradient colors={isLight ? [screen.bgFrom, screen.bgTo, '#F0E8DE'] : screen.darkBg} style={StyleSheet.absoluteFill}/>
        <BgComponent color={accent}/>

        <ScrollView
          contentContainerStyle={[styles.pageScroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'tight') + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {renderWorldHero(screen)}

          {/* ── WIDGET GLOWNY ── */}
          <View style={[styles.mainWidget, {
            borderColor: accent + '44',
            backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
            shadowColor: accent,
          }]}>
            <LinearGradient colors={[accent + '28', accent + '0A', 'transparent']} style={StyleSheet.absoluteFill}/>
            {/* Accent top-bar line */}
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, borderTopLeftRadius: 22, borderTopRightRadius: 22, backgroundColor: accent + '77' }} pointerEvents="none" />

            {/* Header widgetu */}
            <View style={styles.widgetHeader}>
              <View style={[styles.widgetIcon, { borderColor: accent + '55', backgroundColor: accent + '18', shadowColor: accent }]}>
                <Icon color={accent} size={24} strokeWidth={1.6}/>
              </View>
              <View style={styles.widgetHeaderText}>
                <Text style={[styles.widgetEyebrow, { color: accent }]}>{screen.eyebrow}</Text>
                <View style={[styles.archetypePill, { borderColor: accent + '33', backgroundColor: accent + '0A' }]}>
                  <Text style={[styles.archetypeText, { color: accent }]}>{dailyPlan.archetype.name}</Text>
                </View>
                <Text style={[styles.widgetTitle, { color: isLight ? '#1A1410' : '#F0EAF8' }]}>{screen.title}</Text>
              </View>
              <View style={[styles.widgetStreakBadge, { borderColor: accent + '44', backgroundColor: accent + '14' }]}>
                <Sparkles color={accent} size={11} strokeWidth={2}/>
                <Text style={[styles.widgetStreakText, { color: accent }]}>{stats.streak}d</Text>
              </View>
            </View>

            {/* Ton dnia — GLOWNY INSIGHT */}
            <View style={[styles.insightBlock, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', borderColor: accent + '22' }]}>
              <Text style={[styles.insightEyebrow, { color: accent }]}>{t('home.todayProgress')}</Text>
              <Text numberOfLines={4} ellipsizeMode="tail" style={[styles.insightText, { color: isLight ? '#1A1410' : '#E8E0F0' }]}>{stats.tone}</Text>
            </View>

            {/* Metryki 3 kolumny */}
            <View style={[styles.metricsStrip, { borderTopColor: accent + '22', borderBottomColor: accent + '22' }]}>
              {[
                {
                  val: stats.sessions === 0 ? tr('today.metrics.startValue', 'Start', 'Start') : String(stats.sessions),
                  label: stats.sessions === 0 ? tr('today.metrics.startLabel', 'Zacznij', 'Begin') : tr('today.metrics.sessionsLabel', 'Sesji', 'Sessions'),
                },
                {
                  val: stats.streak === 0 ? '—' : String(stats.streak),
                  label: stats.streak === 0 ? tr('today.metrics.rhythmLabel', 'Rytm', 'Rhythm') : tr('today.metrics.streakLabel', 'Pasmo', 'Streak'),
                },
                {
                  val: stats.progress === 0 ? '—' : stats.progress + '%',
                  label: tr('today.metrics.vibrationLabel', 'Wibracja', 'Vibration'),
                },
              ].map((m, i) => (
                <React.Fragment key={m.label}>
                  {i > 0 && <View style={[styles.metricsDivider, { backgroundColor: accent + '28' }]}/>}
                  <View style={styles.metricsItem}>
                    <Text style={[styles.metricsVal, { color: accent }]}>{m.val}</Text>
                    <Text style={[styles.metricsLabel, { color: isLight ? '#9A8A78' : '#B0A0D0' }]}>{m.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            {stats.sessions === 0 && stats.streak === 0 && activeIndex === 0 && (
              <View style={[styles.newUserHint, { borderColor: accent + '22', backgroundColor: accent + '08' }]}>
                <Text style={[styles.newUserHintText, { color: accent }]}>{tr('today.newUserHint', 'Pierwsze wejście buduje Twój osobisty rytm i lepsze rekomendacje dnia', 'Your first steps build a personal rhythm and stronger daily recommendations')}</Text>
              </View>
            )}
            {/* Ostatnia aktywnosc */}
            <View style={styles.lastActivityRow}>
              <View style={[styles.lastActivityDot, { backgroundColor: accent }]}/>
              <Text style={[styles.lastActivityText, { color: isLight ? '#7A6A58' : '#B0A0D0' }]}>{stats.lastActivity}</Text>
            </View>
          </View>

                    {stats.insight ? (
            <View style={[styles.insightCard, { borderColor: accent + '30', backgroundColor: accent + '0E' }]}>
              <Text style={[styles.insightCardLabel, { color: accent }]}>{t('home.magicOfDay')}</Text>
              <Text numberOfLines={5} ellipsizeMode="tail" style={[styles.insightCardText, { color: isLight ? '#2A1E14' : '#E0D8F0' }]}>{stats.insight}</Text>
            </View>
          ) : null}
          {/* ── TILE GRID ── */}
          <View style={styles.tileRow}>
            {getWorldTiles(screen.id).map((tile) => (
              <WorldTile
                key={tile.label}
                label={tile.label}
                subtitle={tile.subtitle}
                icon={tile.icon}
                accent={accent}
                isLight={isLight}
                onPress={() => handleAction(screen.id, tile.route)}
              />
            ))}
          </View>

          {(stats as any).secondaryActions?.length > 0 && (
            <View style={[styles.actionsWrap, { marginTop: 4 }]}>
              <Text style={[styles.actionsTitle, { color: isLight ? '#8A7A6A' : accent + 'BB' }]}>{t('home.seeMore')}</Text>
              {(stats as any).secondaryActions.map((action: any) => (
                <Pressable
                  key={action.label}
                  onPress={() => handleAction(screen.id, action.route)}
                  style={[styles.actionRow, { backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)', borderColor: accent + '44' }]}
                >
                  <View style={[styles.actionRowDot, { backgroundColor: accent + '33', borderColor: accent + '55' }]}>
                    <ArrowRight color={accent} size={14} strokeWidth={1.8} />
                  </View>
                  <Text numberOfLines={1} style={[styles.actionRowLabel, { color: isLight ? '#2A1F0E' : '#EDE6D8', fontWeight: '600', fontSize: 14, flex: 1 }]}>
                    {action.label}
                  </Text>
                  <ArrowRight color={accent} size={14} strokeWidth={1.6} style={{ opacity: 0.5 }} />
                </Pressable>
              ))}
            </View>
          )}
          <EndOfContentSpacer size="standard"/>
        </ScrollView>
      </View>
    );
  };

  const activeScreen = localizedThemeScreens[activeIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isLight
          ? [localizedThemeScreens[activeIndex].bgFrom, localizedThemeScreens[activeIndex].bgTo]
          : localizedThemeScreens[activeIndex].darkBg}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={styles.safeArea}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerEyebrow, { color: localizedThemeScreens[activeIndex].color }]}>{localizedThemeScreens[activeIndex].eyebrow}</Text>
            <Text style={[styles.headerTitle, { color: isLight ? '#1A1410' : '#F0E8D8' }]}>{getTimeGreeting()}, {firstName}</Text>
            <Text style={[styles.headerSubtitle, { color: isLight ? '#5A4A38' : '#9A8A78' }]}>{
              localizedThemeScreens[activeIndex].id === 'tarot' ? tr('today.headerSub.tarot', 'Karta, symbol i rytuał odczytu.', 'Card, symbol, and the ritual of reading.') :
              localizedThemeScreens[activeIndex].id === 'horoscope' ? tr('today.headerSub.horoscope', 'Znak, ton i codzienne prowadzenie.', 'Sign, tone, and daily guidance.') :
              localizedThemeScreens[activeIndex].id === 'astrology' ? tr('today.headerSub.astrology', 'Niebo, cykle i kosmiczne mapy.', 'Sky, cycles, and cosmic maps.') :
              localizedThemeScreens[activeIndex].id === 'rituals' ? tr('today.headerSub.rituals', 'Intencja, ceremonia i domknięcie.', 'Intention, ceremony, and conscious closure.') :
              localizedThemeScreens[activeIndex].id === 'cleansing' ? tr('today.headerSub.cleansing', 'Uwolnij to, co ciąży. Odetchnij.', 'Release what weighs on you. Breathe.') :
              localizedThemeScreens[activeIndex].id === 'support' ? tr('today.headerSub.support', 'Ukojenie, afirmacja i cisza.', 'Soothing, affirmation, and silence.') :
              localizedThemeScreens[activeIndex].id === 'dreams' ? tr('today.headerSub.dreams', 'Symbol, noc i archiwum snów.', 'Symbol, night, and the archive of dreams.') :
              tr('today.headerSub.default', 'Zacznij od swojego rytmu, nie od nadmiaru.', 'Begin from your own rhythm, not from excess.')
            }</Text>
            <View style={[styles.moonPill, { borderColor: localizedThemeScreens[activeIndex].color + '55', backgroundColor: isLight ? 'rgba(255,255,255,0.7)' : localizedThemeScreens[activeIndex].color + '14' }]}>
              <Text style={styles.moonEmoji}>{dailyPlan.moonPhase.icon}</Text>
              <Text style={[styles.moonName, { color: localizedThemeScreens[activeIndex].color }]}>{dailyPlan.moonPhase.name}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => navigateToMainTab(navigation, 'Profile')}
            style={styles.avatarWrap}
          >
            <Text style={[styles.avatarEyebrow, { color: localizedThemeScreens[activeIndex].color }]}>✦ {t('nav.profile').toUpperCase()}</Text>
            <ProfileAvatar
              uri={userData.avatarUri}
              name={firstName}
              fallbackText={firstName.charAt(0).toUpperCase()}
              size={52}
              primary={isLight ? '#A97A39' : '#C8A860'}
              borderColor={isLight ? 'rgba(169,122,57,0.3)' : 'rgba(200,168,96,0.4)'}
              backgroundColor={isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'}
              textColor={isLight ? '#A97A39' : '#C8A860'}
            />
            <View style={styles.avatarAddRow}>
              <Plus color={isLight ? '#A97A39' : '#C8A860'} size={11} strokeWidth={2.5}/>
              <Text style={[styles.avatarAddText, { color: isLight ? '#A97A39' : '#C8A860' }]}>👤 {t('nav.profile').toUpperCase()}</Text>
            </View>
          </Pressable>
        </View>

        {/* ── TABY ── */}
        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRail}
          style={styles.tabBar}
        >
          {localizedThemeScreens.map((screen, index) => {
            const active = activeIndex === index;
            return (
              <Pressable
                key={screen.id}
                onPress={() => handleTabPress(index)}
                style={[
                  styles.tab,
                  { borderColor: isLight ? 'rgba(169,122,57,0.2)' : 'rgba(255,255,255,0.12)', backgroundColor: isLight ? '#FFF8EE' : 'rgba(255,255,255,0.05)' },
                  active && { borderColor: screen.color, backgroundColor: isLight ? screen.color : screen.color + 'EE' },
                ]}
              >
                <Text style={[styles.tabText, { color: isLight ? '#8A7A6A' : 'rgba(255,255,255,0.5)' }, active && { color: '#FFFFFF', fontWeight: '800' }]}>
                  {screen.title.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── PAGER ── */}
        <PlatformPagerView
          ref={pagerRef}
          style={styles.pager}
          initialPage={0}
          overdrag={false}
          onPageSelected={(e: any) => handlePageChange(e.nativeEvent.position)}
        >
          {Platform.OS === 'web' ? renderPage(activeScreen) : localizedThemeScreens.map(renderPage)}
        </PlatformPagerView>

      </SafeAreaView>

      {/* CheckIn auto-popup */}
      {showCheckIn && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <DailyCheckInScreen
            type={checkInType}
            onComplete={(data: any) => {
              const { updateDailyProgress } = useAppStore.getState();
              const today = new Date().toISOString().split('T')[0];
              updateDailyProgress(today, {
                mood:        data.mood,
                energyLevel: data.energy,
                ...(checkInType === 'morning'
                  ? { checkInShownMorning: true }
                  : { checkInShownEvening: true }),
              });
              setShowCheckIn(false);
            }}
            onSkip={() => {
              const { updateDailyProgress } = useAppStore.getState();
              const today = new Date().toISOString().split('T')[0];
              updateDailyProgress(today,
                checkInType === 'morning'
                  ? { checkInShownMorning: true }
                  : { checkInShownEvening: true },
              );
              setShowCheckIn(false);
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerEyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2.5, color: '#A97A39', opacity: 0.7, marginBottom: 2 },
  headerTitle: { fontSize: 30, fontWeight: '400', color: '#1A1410', letterSpacing: -0.6, lineHeight: 36, fontFamily: 'serif' },
  headerSubtitle: { fontSize: 14, color: '#5A4A38', opacity: 0.72, marginTop: 4, lineHeight: 20 },

  avatarWrap: { alignItems: 'center', gap: 4 },
  avatarEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.2, color: '#A97A39', opacity: 0.7 },
  avatarAddRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  avatarAddText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.0, color: '#A97A39' },

  tabBar: { flexGrow: 0, maxHeight: 48 },
  tabRail: { paddingHorizontal: 22, gap: 8, paddingVertical: 6, alignItems: 'center' },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(169,122,57,0.2)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tabText: { fontSize: 12, fontWeight: '600', letterSpacing: 1.2, color: '#8A7A6A' },

  pager: { flex: 1 },
  page: { flex: 1 },
  pageScroll: { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 16 },

  // Stats card
  statsCard: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#8B6A3A',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: 'rgba(169,122,57,0.14)',
  },
  statsTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statsMeta: { flex: 1, gap: 2 },
  eyebrowText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  screenTitleText: { fontSize: 24, fontWeight: '600', letterSpacing: -0.4, fontFamily: 'serif' },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  streakText: { fontSize: 12, fontWeight: '700' },

  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  progressBg: { flex: 1, height: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.06)', overflow: 'hidden' },
  progressBar: { height: '100%', borderRadius: 999 },
  progressLabel: { fontSize: 11, fontWeight: '600', minWidth: 32, textAlign: 'right' },

  metricsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginTop: 16 },
  metricItem: { alignItems: 'center', gap: 3, flex: 1 },
  metricVal: { fontSize: 20, fontWeight: '700' },
  metricLabel: { fontSize: 11, color: '#8A7A6A' },
  metricDiv: { width: 1, height: 28 },

  lastRow: { flexDirection: 'row', paddingTop: 12, marginTop: 12, borderTopWidth: 1 },
  lastLabel: { fontSize: 12, fontWeight: '600' },
  lastVal: { fontSize: 12, color: '#5A4A38', flex: 1 },

  // Tone
  toneCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(169,122,57,0.12)',
  },
  cardEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.9, marginBottom: 8, textTransform: 'uppercase' },
  toneText: { fontSize: 15, color: '#2A1E14', lineHeight: 24, fontWeight: '300' },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },

  // Nowe style widgetu
  mainWidget: {
    marginHorizontal: 0,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.90)',
    shadowColor: '#8B6A3A',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  widgetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  widgetIcon: { width: 50, height: 50, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  widgetHeaderText: { flex: 1, gap: 2 },
  widgetEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  widgetTitle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.4, fontFamily: 'serif' },
  widgetStreakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999, borderWidth: 1 },
  widgetStreakText: { fontSize: 12, fontWeight: '700' },
  insightBlock: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  insightEyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 6 },
  insightText: { fontSize: 15, lineHeight: 23, fontWeight: '300' },
  userSummary: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  userSummaryLeft: { flex: 1, gap: 8 },
  userGreeting: { fontSize: 12, fontWeight: '500' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBgWide: { flex: 1, height: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.07)', overflow: 'hidden' },
  progressFillWide: { height: '100%', borderRadius: 999 },
  progressPct: { fontSize: 12, fontWeight: '700', minWidth: 35, textAlign: 'right' },
  metricsStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 12 },
  metricsItem: { flex: 1, alignItems: 'center', gap: 3 },
  metricsVal: { fontSize: 20, fontWeight: '700' },
  metricsLabel: { fontSize: 11, color: '#8A7A6A' },
  metricsDivider: { width: 1, height: 28 },
  lastActivityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastActivityDot: { width: 6, height: 6, borderRadius: 3, opacity: 0.7 },
  lastActivityText: { fontSize: 12, flex: 1 },
  actionsWrap: { gap: 10, marginTop: 10 },
  actionsTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8, marginBottom: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  actionRowDot: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionRowLabel: { fontSize: 14, lineHeight: 21, letterSpacing: 0.05 },
  worldManifest: { borderRadius: 22, borderWidth: 1, padding: 18, marginBottom: 14, overflow: 'hidden' },
  worldManifestTitle: { marginTop: 10, fontSize: 24, lineHeight: 30 },
  worldManifestBody: { marginTop: 10, lineHeight: 22 },
  insightCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 12 },
  insightCardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.8, marginBottom: 6 },
  insightCardText: { fontSize: 14, lineHeight: 22, fontWeight: '300' },

  // Hero block styles
  heroBlock: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  heroCardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCardText: { flex: 1 },
  heroEyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.5, lineHeight: 30, marginBottom: 6, fontFamily: 'serif' },
  heroSub: { fontSize: 13, lineHeight: 19, fontWeight: '300', opacity: 0.85 },
  heroAffirmation: { fontSize: 20, fontWeight: '300', lineHeight: 30, fontStyle: 'italic', letterSpacing: 0.15, fontFamily: 'serif' },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1 },
  heroBadgeText: { fontSize: 11, fontWeight: '600' },
  heroMoon: { fontSize: 22, marginLeft: 8 },

  // Tile grid
  tileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18, marginTop: 10 },
  tileWrap: { width: (SW - layout.padding.screen * 2 - 10) / 2 },
  tile: { alignItems: 'flex-start', justifyContent: 'flex-start', borderRadius: 22, borderWidth: 1.2, paddingVertical: 16, paddingHorizontal: 14, minHeight: 130 },
  tileIconWrap: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  tileTitle: { fontSize: 15, lineHeight: 20 },
  tileSubtitle: { marginTop: 6, lineHeight: 18, opacity: 0.78, color: 'rgba(245,241,234,0.74)' },
  tileArrow: { marginTop: 'auto', width: 32, height: 32, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },

  newUserHint: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, marginTop: 2 },
  newUserHintText: { fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.3 },

  // Moon pill
  moonPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, borderWidth: 1, marginTop: 8 },
  moonEmoji: { fontSize: 16 },
  moonName: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },

  // Archetype badge
  archetypePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, marginTop: 3, marginBottom: 2 },
  archetypeText: { fontSize: 9, fontWeight: '700', letterSpacing: 1.6 },


});



