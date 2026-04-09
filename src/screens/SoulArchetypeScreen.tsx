// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  Dimensions,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, G, Defs, RadialGradient, Stop, Polygon, Line } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated';
import { ChevronLeft, Star, Sparkles, ChevronRight, ChevronDown, ChevronUp, Wand2, BookOpen, Flame } from 'lucide-react-native';
import { useTheme } from '../core/hooks/useTheme';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#A855F7';

// Animated SVG wrapper — must be at MODULE LEVEL
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    id: 'sage', name: 'Mędrzec', icon: '🦉', color: '#818CF8', shadow: 'Dogmatyzm',
    symbol: 'eye',
    strengths: ['Głęboka wiedza', 'Analityczny umysł', 'Szukanie prawdy'],
    gifts: 'Rozumiesz rzeczy na poziomie, który inni rzadko osiągają. Twoja wiedza jest darem dla świata.',
    wound: 'Możesz bać się bycia postrzeganym jako głupi lub ignorant. Często nie ufasz własnym uczuciom.',
    path: 'Pozwól sobie nie wiedzieć. Ucz się przez doświadczenie, nie tylko przez umysł.',
    dailyPractices: [
      'Czytaj 20 minut dziennie',
      'Zapisuj 3 obserwacje o sobie',
      'Praktykuj ciszę zamiast odpowiadać natychmiast',
    ],
  },
  {
    id: 'lover', name: 'Kochanek', icon: '🌹', color: '#F472B6', shadow: 'Uzależnienie',
    symbol: 'heart',
    strengths: ['Głęboka empatia', 'Pasja i intensywność', 'Piękno we wszystkim'],
    gifts: 'Widzisz piękno wszędzie. Twoja miłość do życia jest zaraźliwa i uzdrawiająca.',
    wound: 'Możesz tracić siebie w relacjach lub uzależniać wartość od miłości innych.',
    path: 'Naucz się kochać siebie niezależnie od zewnętrznego potwierdzenia.',
    dailyPractices: [
      'Wyraź wdzięczność 3 osobom',
      'Stwórz coś pięknego (nawet małego)',
      'Powiedz "kocham" — sobie najpierw',
    ],
  },
  {
    id: 'warrior', name: 'Wojownik', icon: '⚔️', color: '#EF4444', shadow: 'Brutalność',
    symbol: 'sword',
    strengths: ['Odwaga i determinacja', 'Jasność celu', 'Ochrona słabszych'],
    gifts: 'Potrafisz walczyć o to, co ważne. Twoja siła broni i inspiruje.',
    wound: 'Możesz używać siły gdy nie jest potrzebna lub bać się wrażliwości jako słabości.',
    path: 'Odkryj, że prawdziwa siła to zdolność do miłości, nie tylko walki.',
    dailyPractices: [
      'Ustaw 1 granicę dziś',
      'Ćwicz przez 20 minut',
      'Obroń kogoś potrzebującego wsparcia',
    ],
  },
  {
    id: 'creator', name: 'Twórca', icon: '🎨', color: '#F59E0B', shadow: 'Perfekcjonizm',
    symbol: 'star',
    strengths: ['Kreatywność i innowacja', 'Wizja nowych możliwości', 'Ekspresja artystyczna'],
    gifts: 'Widzisz rzeczy, których inni nie widzą. Twoja twórczość zmienia świat.',
    wound: 'Możesz blokować się przed tworzeniem z powodu lęku przed oceną.',
    path: 'Twórz bez względu na efekt. Proces jest ważniejszy niż doskonałość.',
    dailyPractices: [
      'Poświęć 15 minut na tworzenie bez oceniania',
      'Zapisz 3 pomysły które masz',
      'Zrób coś nowego w rutynie',
    ],
  },
  {
    id: 'caregiver', name: 'Opiekun', icon: '🤱', color: '#34D399', shadow: 'Poświęcenie',
    symbol: 'cross',
    strengths: ['Bezwarunkowa miłość', 'Troska i wsparcie', 'Umiejętność słuchania'],
    gifts: 'Twoja troska uzdrawia. Ludzie czują się przy tobie bezpiecznie i kochani.',
    wound: 'Możesz zaniedbywać własne potrzeby i odczuwać winę za ich wyrażanie.',
    path: 'Napełnij własny kubek, by móc nalewać innym. Troska o siebie jest dawaniem.',
    dailyPractices: [
      'Zadbaj o siebie najpierw — jeden gest troski',
      'Powiedz "nie" jeśli potrzebujesz',
      'Zauważ kto o ciebie dba',
    ],
  },
  {
    id: 'seeker', name: 'Poszukiwacz', icon: '🧭', color: '#06B6D4', shadow: 'Ucieczka',
    symbol: 'compass',
    strengths: ['Ciekawość i otwartość', 'Odwaga bycia innym', 'Wolność ducha'],
    gifts: 'Twoja wolność i ciekawość otwierają nowe horyzonty dla siebie i innych.',
    wound: 'Możesz bać się zakorzenień, myląc stabilność z więzieniem.',
    path: 'Odkryj, że prawdziwa wolność rodzi się wewnątrz, nie w ciągłym ruchu.',
    dailyPractices: [
      'Idź nową drogą — dosłownie lub metaforycznie',
      'Ucz się czegoś zupełnie nowego',
      'Medytuj nad pytaniem bez szukania odpowiedzi',
    ],
  },
  {
    id: 'magician', name: 'Mag', icon: '🔮', color: '#7C3AED', shadow: 'Manipulacja',
    symbol: 'spiral',
    strengths: ['Transformacja rzeczywistości', 'Widzenie wzorców', 'Moc manifestacji'],
    gifts: 'Rozumiesz jak myśl tworzy rzeczywistość. Twoja wiedza jest transformująca.',
    wound: 'Możesz używać swojej mocy do kontrolowania zamiast transformowania.',
    path: 'Używaj mocy do służenia, nie dominowania. Twoja magia służy całości.',
    dailyPractices: [
      'Wizualizuj przez 5 minut swoje intencje',
      'Zauważ synchroniczności dnia',
      'Transformuj jedną negatywną myśl w lekcję',
    ],
  },
  {
    id: 'ruler', name: 'Władca', icon: '👑', color: '#D4A853', shadow: 'Tyran',
    symbol: 'crown',
    strengths: ['Naturalne przywództwo', 'Wizja i organizacja', 'Tworzenie porządku'],
    gifts: 'Potrafisz prowadzić innych i tworzyć struktury, które służą wielu.',
    wound: 'Możesz kontrolować z lęku przed chaosem zamiast przewodzić z miłości.',
    path: 'Przywódca służy tym, którymi przewodzi. Twoja moc jest dla wszystkich.',
    dailyPractices: [
      'Zaplanuj coś ważnego dla grupy',
      'Deleguj jedno zadanie',
      'Oceń: czy prowadzę z miłości czy z lęku?',
    ],
  },
];

const QUIZ = [
  {
    q: 'Co jest dla ciebie najważniejsze?',
    options: [
      { label: 'Wiedza i prawda', arch: 'sage' },
      { label: 'Miłość i piękno', arch: 'lover' },
      { label: 'Siła i sprawiedliwość', arch: 'warrior' },
      { label: 'Tworzenie i ekspresja', arch: 'creator' },
    ],
  },
  {
    q: 'Jak radzisz sobie w kryzysie?',
    options: [
      { label: 'Analizuję i szukam rozwiązań', arch: 'sage' },
      { label: 'Wsperam i jestem z innymi', arch: 'caregiver' },
      { label: 'Walczę i działam', arch: 'warrior' },
      { label: 'Szukam nowej drogi', arch: 'seeker' },
    ],
  },
  {
    q: 'Co daje ci największą radość?',
    options: [
      { label: 'Odkrywanie i nauka', arch: 'seeker' },
      { label: 'Tworzenie i wyobraźnia', arch: 'creator' },
      { label: 'Głębokie połączenie z innymi', arch: 'lover' },
      { label: 'Transformacja i zmiana', arch: 'magician' },
    ],
  },
  {
    q: 'Jak reagujesz na niesprawiedliwość?',
    options: [
      { label: 'Analizuję źródło problemu', arch: 'sage' },
      { label: 'Walczę otwarcie', arch: 'warrior' },
      { label: 'Pomagam ofiarom', arch: 'caregiver' },
      { label: 'Tworzę nowe zasady', arch: 'ruler' },
    ],
  },
  {
    q: 'Czego najbardziej pragniesz?',
    options: [
      { label: 'Transformacji i przemiany', arch: 'magician' },
      { label: 'Ekspresji i tworzenia', arch: 'creator' },
      { label: 'Wolności i przygody', arch: 'seeker' },
      { label: 'Porządku i sprawiedliwości', arch: 'ruler' },
    ],
  },
];

const TOTAL_STEPS = QUIZ.length;

// ─────────────────────────────────────────────────────────────────────────────
// ARCHETYPE SVG SYMBOL — animated, shown during quiz
// ─────────────────────────────────────────────────────────────────────────────

const ArchetypeSymbol = ({ symbolId, color, size = 80 }: { symbolId: string; color: string; size?: number }) => {
  const r = size / 2;
  const strokeWidth = 1.5;

  const renderSymbol = () => {
    switch (symbolId) {
      case 'eye':
        return (
          <>
            <Path d={`M${r * 0.2} ${r} Q${r} ${r * 0.3} ${r * 1.8} ${r} Q${r} ${r * 1.7} ${r * 0.2} ${r} Z`}
              stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Circle cx={r} cy={r} r={r * 0.25} fill={color} opacity={0.7} />
            <Circle cx={r} cy={r} r={r * 0.1} fill={color} />
          </>
        );
      case 'heart':
        return (
          <Path d={`M${r} ${r * 1.5} C${r * 0.2} ${r * 1.1} ${r * 0.1} ${r * 0.4} ${r * 0.5} ${r * 0.4} C${r * 0.7} ${r * 0.4} ${r} ${r * 0.6} ${r} ${r * 0.8} C${r} ${r * 0.6} ${r * 1.3} ${r * 0.4} ${r * 1.5} ${r * 0.4} C${r * 1.9} ${r * 0.4} ${r * 1.8} ${r * 1.1} ${r} ${r * 1.5} Z`}
            stroke={color} strokeWidth={strokeWidth} fill={color + '30'} />
        );
      case 'sword':
        return (
          <>
            <Line x1={r} y1={r * 0.15} x2={r} y2={r * 1.75} stroke={color} strokeWidth={strokeWidth * 1.5} strokeLinecap="round" />
            <Line x1={r * 0.4} y1={r * 1.1} x2={r * 1.6} y2={r * 1.1} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
            <Circle cx={r} cy={r * 1.75} r={r * 0.08} fill={color} />
          </>
        );
      case 'star':
        return (
          <Polygon
            points={[0, 1, 2, 3, 4].map(i => {
              const angle = (i * 72 - 90) * Math.PI / 180;
              const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180;
              const outer = `${r + r * 0.75 * Math.cos(angle)},${r + r * 0.75 * Math.sin(angle)}`;
              const inner = `${r + r * 0.35 * Math.cos(innerAngle)},${r + r * 0.35 * Math.sin(innerAngle)}`;
              return `${outer} ${inner}`;
            }).join(' ')}
            stroke={color} strokeWidth={strokeWidth} fill={color + '25'} strokeLinejoin="round"
          />
        );
      case 'cross':
        return (
          <>
            <Line x1={r} y1={r * 0.25} x2={r} y2={r * 1.75} stroke={color} strokeWidth={strokeWidth * 1.5} strokeLinecap="round" />
            <Line x1={r * 0.4} y1={r * 0.7} x2={r * 1.6} y2={r * 0.7} stroke={color} strokeWidth={strokeWidth * 1.5} strokeLinecap="round" />
            <Circle cx={r} cy={r * 0.7} r={r * 0.06} fill={color} />
          </>
        );
      case 'compass':
        return (
          <>
            <Circle cx={r} cy={r} r={r * 0.8} stroke={color} strokeWidth={strokeWidth} fill="none" />
            <Polygon points={`${r},${r * 0.3} ${r * 0.85},${r * 1.1} ${r},${r * 0.95} ${r * 1.15},${r * 1.1}`}
              fill={color} opacity={0.8} />
            <Circle cx={r} cy={r} r={r * 0.06} fill={color} />
          </>
        );
      case 'spiral':
        return (
          <Path
            d={`M${r} ${r} m-${r * 0.1} 0 a${r * 0.1} ${r * 0.1} 0 1 1 ${r * 0.2} 0 a${r * 0.3} ${r * 0.3} 0 1 1 -${r * 0.6} 0 a${r * 0.5} ${r * 0.5} 0 1 1 ${r} 0`}
            stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round"
          />
        );
      case 'crown':
        return (
          <>
            <Path d={`M${r * 0.3} ${r * 1.3} L${r * 0.3} ${r * 0.8} L${r} ${r * 0.35} L${r * 1.7} ${r * 0.8} L${r * 1.7} ${r * 1.3} Z`}
              stroke={color} strokeWidth={strokeWidth} fill={color + '20'} />
            <Line x1={r * 0.3} y1={r * 1.3} x2={r * 1.7} y2={r * 1.3} stroke={color} strokeWidth={strokeWidth * 1.2} strokeLinecap="round" />
            <Circle cx={r} cy={r * 0.35} r={r * 0.09} fill={color} />
            <Circle cx={r * 0.3} cy={r * 0.8} r={r * 0.07} fill={color} />
            <Circle cx={r * 1.7} cy={r * 0.8} r={r * 0.07} fill={color} />
          </>
        );
      default:
        return <Circle cx={r} cy={r} r={r * 0.5} stroke={color} strokeWidth={strokeWidth} fill="none" />;
    }
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {renderSymbol()}
    </Svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED HERO — rotating rings + archetype symbol
// ─────────────────────────────────────────────────────────────────────────────

const RotatingHero = ({ currentArchSymbol, currentArchColor }: { currentArchSymbol: string; currentArchColor: string }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const pulse = useSharedValue(1);
  const SIZE = 140;
  const R = SIZE / 2;

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 8000, easing: Easing.linear }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 12000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1, true,
    );
    return () => {
      cancelAnimation(rot1);
      cancelAnimation(rot2);
      cancelAnimation(pulse);
    };
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot1.value}deg` }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot2.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', height: SIZE + 20, marginBottom: 8 }}>
      {/* Outer rotating ring */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring1Style]}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle cx={R} cy={R} r={R - 4} stroke={currentArchColor} strokeWidth={1}
            strokeDasharray="6 10" fill="none" opacity={0.45} />
        </Svg>
      </Animated.View>
      {/* Inner counter-rotating ring */}
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, ring2Style]}>
        <Svg width={SIZE - 20} height={SIZE - 20} viewBox={`0 0 ${SIZE - 20} ${SIZE - 20}`}>
          <Circle cx={(SIZE - 20) / 2} cy={(SIZE - 20) / 2} r={(SIZE - 20) / 2 - 4}
            stroke={currentArchColor} strokeWidth={0.8} strokeDasharray="3 14"
            fill="none" opacity={0.3} />
        </Svg>
      </Animated.View>
      {/* Pulsing symbol */}
      <Animated.View style={[pulseStyle, { alignItems: 'center', justifyContent: 'center' }]}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: currentArchColor + '18',
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: currentArchColor + '40',
        }}>
          <ArchetypeSymbol symbolId={currentArchSymbol} color={currentArchColor} size={46} />
        </View>
      </Animated.View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS BAR
// ─────────────────────────────────────────────────────────────────────────────

const QuizProgressBar = ({ step, total, color }: { step: number; total: number; color: string }) => {
  const progress = useSharedValue((step / total) * 100);

  useEffect(() => {
    progress.value = withTiming(((step + 1) / total) * 100, { duration: 400, easing: Easing.out(Easing.quad) });
  }, [step]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  return (
    <View style={{ marginBottom: 18 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: color, fontSize: 10, letterSpacing: 2, fontWeight: '600' }}>
          PYTANIE {step + 1} / {total}
        </Text>
        <Text style={{ color: color + '80', fontSize: 10 }}>
          {Math.round(((step + 1) / total) * 100)}%
        </Text>
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: color + '20', overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 2, backgroundColor: color }, barStyle]} />
      </View>
      {/* Step dots */}
      <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, justifyContent: 'center' }}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={{
            width: i <= step ? 18 : 6, height: 6, borderRadius: 3,
            backgroundColor: i <= step ? color : color + '28',
          }} />
        ))}
      </View>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ARCH GRID CARD — expanded accordion with gradient
// ─────────────────────────────────────────────────────────────────────────────

const ArchGridCard = ({
  arch, isExpanded, onToggle, textColor, subColor, cardBg, cardBorder,
}: {
  arch: typeof ARCHETYPES[0];
  isExpanded: boolean;
  onToggle: () => void;
  textColor: string;
  subColor: string;
  cardBg: string;
  cardBorder: string;
}) => {
  return (
    <Animated.View entering={FadeInDown.duration(400)}>
      <Pressable
        onPress={onToggle}
        style={[
          styles.archCard,
          {
            backgroundColor: isExpanded ? arch.color + '10' : cardBg,
            borderColor: isExpanded ? arch.color + '60' : cardBorder,
            shadowColor: arch.color,
            shadowOffset: { width: 0, height: isExpanded ? 6 : 2 },
            shadowOpacity: isExpanded ? 0.22 : 0.06,
            shadowRadius: isExpanded ? 12 : 4,
            elevation: isExpanded ? 6 : 2,
          },
        ]}
      >
        {/* Header row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={[styles.archIconWrap, { backgroundColor: arch.color + '1A', borderColor: arch.color + '30' }]}>
            <Text style={{ fontSize: 24 }}>{arch.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>{arch.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: arch.color + '70' }} />
              <Text style={{ color: arch.color + 'AA', fontSize: 10, letterSpacing: 1.2 }}>
                CIEŃ: {arch.shadow.toUpperCase()}
              </Text>
            </View>
          </View>
          {isExpanded
            ? <ChevronUp size={16} color={arch.color} />
            : <ChevronDown size={16} color={subColor} />
          }
        </View>

        {/* Strengths badges (always visible) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
          {arch.strengths.map(s => (
            <View key={s} style={[styles.tag, { backgroundColor: arch.color + '15', borderColor: arch.color + '28' }]}>
              <Text style={{ color: arch.color, fontSize: 10, fontWeight: '500' }}>{s}</Text>
            </View>
          ))}
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 14 }}>
            {/* Gradient divider */}
            <LinearGradient
              colors={[arch.color + '00', arch.color + '40', arch.color + '00']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ height: 1, marginBottom: 14 }}
            />

            {/* Gifts */}
            <View style={[styles.expandSection, { backgroundColor: arch.color + '0D', borderColor: arch.color + '20' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sparkles size={12} color={arch.color} />
                <Text style={{ color: arch.color, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>{t('soulArchetype.dary', 'DARY')}</Text>
              </View>
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{arch.gifts}</Text>
            </View>

            {/* Wound */}
            <View style={[styles.expandSection, { backgroundColor: arch.color + '08', borderColor: arch.color + '18', marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Flame size={12} color={arch.color} />
                <Text style={{ color: arch.color, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>{t('soulArchetype.rana_do_uzdrowieni', 'RANA DO UZDROWIENIA')}</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 13, lineHeight: 20 }}>{arch.wound}</Text>
            </View>

            {/* Path */}
            <View style={[styles.expandSection, { backgroundColor: arch.color + '0A', borderColor: arch.color + '15', marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <BookOpen size={12} color={arch.color} />
                <Text style={{ color: arch.color, fontSize: 10, letterSpacing: 1.5, fontWeight: '700' }}>{t('soulArchetype.sciezka_rozwoju', 'ŚCIEŻKA ROZWOJU')}</Text>
              </View>
              <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{arch.path}</Text>
            </View>
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY PRACTICES SECTION
// ─────────────────────────────────────────────────────────────────────────────

const DailyPracticesSection = ({
  practices, color, textColor, subColor,
}: {
  practices: string[];
  color: string;
  textColor: string;
  subColor: string;
}) => {
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(500)}>
      <View style={[styles.practiceSectionWrap, { borderColor: color + '30' }]}>
        <LinearGradient
          colors={[color + '18', color + '06']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: color + '25', alignItems: 'center', justifyContent: 'center' }}>
            <Wand2 size={14} color={color} />
          </View>
          <Text style={{ color, fontSize: 12, letterSpacing: 2, fontWeight: '700' }}>{t('soulArchetype.dzien_z_archetypem', 'DZIEŃ Z ARCHETYPEM')}</Text>
        </View>
        <Text style={{ color: subColor, fontSize: 12, marginBottom: 12, lineHeight: 18 }}>
          {t('soulArchetype.3_praktyki_na_dzis_ktore', '3 praktyki na dziś, które przebudzą Twój archetyp:')}
        </Text>
        {practices.map((p, i) => (
          <Animated.View
            key={p}
            entering={FadeInDown.delay(300 + i * 120).duration(400)}
            style={[styles.practiceRow, { borderColor: color + '20', backgroundColor: color + '0C' }]}
          >
            <View style={[styles.practiceNumber, { backgroundColor: color + '30', borderColor: color + '50' }]}>
              <Text style={{ color, fontSize: 11, fontWeight: '800' }}>{i + 1}</Text>
            </View>
            <Text style={{ color: textColor, fontSize: 13, flex: 1, lineHeight: 20 }}>{p}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export const SoulArchetypeScreen = ({ navigation }: any) => {
  // useTheme at the TOP of the component — never inside useMemo/useCallback
  const { currentTheme, isLight } = useTheme();

  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const isFavoriteItem = useAppStore(s => s.isFavoriteItem);
  const removeFavoriteItem = useAppStore(s => s.removeFavoriteItem);

  const { t } = useTranslation();

  const textColor = isLight ? '#1A0040' : '#F8F0FF';
  const subColor = isLight ? 'rgba(26,0,64,0.5)' : 'rgba(248,240,255,0.5)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.08)';
  const isDark = !isLight;

  const [activeTab, setActiveTab] = useState<'quiz' | 'archetypes' | 'result'>('quiz');
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<typeof ARCHETYPES[0] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // Symbol/color shown in hero during quiz — tracks current question's first option
  const heroSymbol = ARCHETYPES.find(a => a.id === QUIZ[quizStep]?.options[0]?.arch)?.symbol ?? 'spiral';
  const heroColor = ARCHETYPES.find(a => a.id === QUIZ[quizStep]?.options[0]?.arch)?.color ?? ACCENT;

  // AI call after quiz completion
  const fetchAiInterpretation = useCallback(async (archResult: typeof ARCHETYPES[0]) => {
    setAiLoading(true);
    setAiInterpretation('');
    try {
      const aiPrompt = `Jesteś mistycznym przewodnikiem archetypów. Użytkownik odkrył, że jego dominującym archetypem jest "${archResult.name}". Napisz krótką (3 zdania) mistyczną interpretację: jak ten archetyp objawia się w jego życiu duchowym, jakie ma dary i wyzwania. Bądź poetycki i głęboki.`;
      const resp = await AiService.chatWithOracle([{ role: 'user', content: aiPrompt }], 'pl');
      setAiInterpretation(resp);
    } catch {
      setAiInterpretation('Twój archetyp jest żywą siłą — rozmawiaj z nim w ciszy, a odpowie Ci własnym głosem duszy.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  const answerQuiz = useCallback((arch: string) => {
    HapticsService.impactMedium();
    const newAnswers = [...quizAnswers, arch];
    if (quizStep < QUIZ.length - 1) {
      setQuizAnswers(newAnswers);
      setQuizStep(q => q + 1);
    } else {
      const counts = newAnswers.reduce<Record<string, number>>(
        (acc, a) => ({ ...acc, [a]: (acc[a] || 0) + 1 }), {},
      );
      const topArch = Object.keys(counts).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0];
      const found = ARCHETYPES.find(a => a.id === topArch) || ARCHETYPES[0];
      setResult(found);
      setActiveTab('result');
      HapticsService.notify();
      fetchAiInterpretation(found);
    }
  }, [quizAnswers, quizStep, fetchAiInterpretation]);

  const resetQuiz = useCallback(() => {
    setQuizStep(0);
    setQuizAnswers([]);
    setResult(null);
    setAiInterpretation('');
    setActiveTab('quiz');
  }, []);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      {/* Background gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={isDark ? ['#080014', '#0E0020', '#140030'] : ['#FAF5FF', '#F7F0FF', '#F5EBFF']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>{t('soulArchetype.odkryj_siebie', 'ODKRYJ SIEBIE')}</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>{t('soulArchetype.archetyp_duszy', 'Archetyp Duszy')}</Text>
        </View>
        <Pressable
          style={styles.starBtn} hitSlop={12}
          onPress={() => {
            HapticsService.impact('light');
            if (isFavoriteItem('soul-archetype')) {
              removeFavoriteItem('soul-archetype');
            } else {
              addFavoriteItem({
                id: 'soul-archetype',
                label: 'Archetyp duszy',
                route: 'SoulArchetype',
                params: {},
                icon: 'Sparkles',
                color: ACCENT,
                addedAt: new Date().toISOString(),
              });
            }
          }}
        >
          <Star
            size={18} color={isFavoriteItem('soul-archetype') ? ACCENT : subColor}
            strokeWidth={1.8} fill={isFavoriteItem('soul-archetype') ? ACCENT : 'none'}
          />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabRow}>
        {([['quiz', 'Quiz'], ['archetypes', 'Wszystkie'], ['result', 'Mój']] as const).map(([tab, label]) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}
            >
              <Text style={[styles.tabLabel, { color: active ? '#fff' : subColor }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen }}>

        {/* ── QUIZ TAB ── */}
        {activeTab === 'quiz' && (
          <Animated.View entering={FadeIn.duration(350)} key={`quiz-${quizStep}`}>
            {/* Animated SVG hero */}
            <View style={{ alignItems: 'center', marginBottom: 4, marginTop: 4 }}>
              <RotatingHero currentArchSymbol={heroSymbol} currentArchColor={heroColor} />
            </View>

            {/* Progress bar */}
            <QuizProgressBar step={quizStep} total={TOTAL_STEPS} color={ACCENT} />

            {/* Question card */}
            <View style={[styles.quizCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '28' }]}>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', lineHeight: 26, marginBottom: 20 }}>
                {QUIZ[quizStep].q}
              </Text>
              {QUIZ[quizStep].options.map((opt, i) => {
                const optArch = ARCHETYPES.find(a => a.id === opt.arch);
                return (
                  <Pressable
                    key={i}
                    onPress={() => answerQuiz(opt.arch)}
                    style={({ pressed }) => [
                      styles.quizOption,
                      {
                        backgroundColor: pressed ? (optArch?.color ?? ACCENT) + '18' : cardBg,
                        borderColor: pressed ? (optArch?.color ?? ACCENT) + '60' : cardBorder,
                      },
                    ]}
                  >
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: (optArch?.color ?? ACCENT) + '20', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ fontSize: 13 }}>{optArch?.icon ?? '✦'}</Text>
                    </View>
                    <Text style={{ color: textColor, fontSize: 14, flex: 1, lineHeight: 20 }}>{opt.label}</Text>
                    <ChevronRight size={16} color={subColor} />
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* ── ARCHETYPES TAB ── */}
        {activeTab === 'archetypes' && (
          <>
            <Animated.View entering={FadeInDown.duration(300)} style={{ marginBottom: 14, marginTop: 4 }}>
              <Text style={{ color: subColor, fontSize: 12, lineHeight: 20, textAlign: 'center' }}>
                {t('soulArchetype.odkryj_8_archetypow_duszy_kazdy', 'Odkryj 8 archetypów duszy. Każdy niesie unikalne dary, rany i ścieżkę wzrostu.')}
              </Text>
            </Animated.View>
            {ARCHETYPES.map((arch, i) => (
              <View key={arch.id} style={{ marginBottom: 10 }}>
                <ArchGridCard
                  arch={arch}
                  isExpanded={expanded === arch.id}
                  onToggle={() => { HapticsService.impactLight(); setExpanded(arch.id === expanded ? null : arch.id); }}
                  textColor={textColor}
                  subColor={subColor}
                  cardBg={cardBg}
                  cardBorder={cardBorder}
                />
              </View>
            ))}
          </>
        )}

        {/* ── RESULT TAB — has result ── */}
        {activeTab === 'result' && result && (
          <Animated.View entering={FadeInDown.duration(600)}>
            {/* Hero result card */}
            <View style={[styles.resultCard, { borderColor: result.color + '35' }]}>
              <LinearGradient
                colors={[result.color + '22', result.color + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              {/* Animated symbol */}
              <View style={{ alignItems: 'center', marginBottom: 8 }}>
                <RotatingHero currentArchSymbol={result.symbol} currentArchColor={result.color} />
              </View>
              <Text style={{ color: result.color, fontSize: 11, letterSpacing: 3, marginBottom: 4, fontWeight: '600' }}>
                {t('soulArchetype.twoj_archetyp', 'TWÓJ ARCHETYP')}
              </Text>
              <Text style={{ color: textColor, fontSize: 32, fontWeight: '800', marginBottom: 6 }}>
                {result.icon} {result.name}
              </Text>
              <Text style={{ color: subColor, fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 16, paddingHorizontal: 8 }}>
                {result.gifts}
              </Text>

              {/* Strengths row */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
                {result.strengths.map(s => (
                  <View key={s} style={[styles.tag, { backgroundColor: result.color + '1A', borderColor: result.color + '35' }]}>
                    <Text style={{ color: result.color, fontSize: 11, fontWeight: '500' }}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Wound */}
              <View style={[styles.infoBox, { backgroundColor: result.color + '10', borderColor: result.color + '28' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Flame size={12} color={result.color} />
                  <Text style={{ color: result.color, fontSize: 10, letterSpacing: 2, fontWeight: '700' }}>{t('soulArchetype.rana_do_uzdrowieni_1', 'RANA DO UZDROWIENIA')}</Text>
                </View>
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{result.wound}</Text>
              </View>

              {/* Path */}
              <View style={[styles.infoBox, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 8 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <BookOpen size={12} color={result.color} />
                  <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2, fontWeight: '700' }}>{t('soulArchetype.sciezka_rozwoju_1', 'ŚCIEŻKA ROZWOJU')}</Text>
                </View>
                <Text style={{ color: textColor, fontSize: 13, lineHeight: 20 }}>{result.path}</Text>
              </View>
            </View>

            {/* AI Interpretation */}
            <Animated.View entering={FadeInDown.delay(300).duration(500)} style={{ marginTop: 14 }}>
              <View style={[styles.aiCard, { borderColor: result.color + '35' }]}>
                <LinearGradient
                  colors={isDark ? ['rgba(124,58,237,0.12)', 'rgba(168,85,247,0.06)'] : ['rgba(168,85,247,0.08)', 'rgba(168,85,247,0.03)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: result.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color={result.color} />
                  </View>
                  <Text style={{ color: result.color, fontSize: 11, letterSpacing: 2, fontWeight: '700' }}>{t('soulArchetype.mistyczna_interpreta', 'MISTYCZNA INTERPRETACJA')}</Text>
                </View>
                {aiLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                    <ActivityIndicator size="small" color={result.color} />
                    <Text style={{ color: subColor, fontSize: 13 }}>{t('soulArchetype.odczytuje_twoj_archetyp', 'Odczytuję Twój archetyp...')}</Text>
                  </View>
                ) : (
                  <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>
                    {aiInterpretation || '...'}
                  </Text>
                )}
              </View>
            </Animated.View>

            {/* Daily practices */}
            <View style={{ marginTop: 14 }}>
              <DailyPracticesSection
                practices={result.dailyPractices}
                color={result.color}
                textColor={textColor}
                subColor={subColor}
              />
            </View>

            {/* Retake button */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={{ alignItems: 'center', marginTop: 18 }}>
              <Pressable
                onPress={resetQuiz}
                style={[styles.retakeBtn, { borderColor: result.color + '50', backgroundColor: result.color + '10' }]}
              >
                <Sparkles size={14} color={result.color} />
                <Text style={{ color: result.color, fontSize: 13, fontWeight: '600' }}>{t('soulArchetype.powtorz_quiz', 'Powtórz quiz')}</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}

        {/* ── RESULT TAB — no result yet ── */}
        {activeTab === 'result' && !result && (
          <Animated.View entering={FadeInDown.duration(400)} style={{ alignItems: 'center', paddingTop: 40 }}>
            {/* Placeholder spinning hero */}
            <RotatingHero currentArchSymbol="spiral" currentArchColor={ACCENT} />
            <Text style={{ color: textColor, fontSize: 17, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>
              {t('soulArchetype.jeszcze_nie_znasz_swojego_archetypu', 'Jeszcze nie znasz swojego archetypu')}
            </Text>
            <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Wypełnij 5-pytaniowy quiz, aby odkryć{'\n'}swój dominujący archetyp duszy
            </Text>
            <Pressable
              onPress={() => { HapticsService.impactLight(); setActiveTab('quiz'); }}
              style={[styles.retakeBtn, { borderColor: ACCENT + '50', backgroundColor: ACCENT + '12' }]}
            >
              <Sparkles size={14} color={ACCENT} />
              <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '600' }}>{t('soulArchetype.przejdz_do_quizu', 'Przejdź do quizu')}</Text>
            </Pressable>
          </Animated.View>
        )}

        <EndOfContentSpacer size="standard" />
      </ScrollView>
        </SafeAreaView>
</View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: layout.padding.screen, paddingBottom: 12,
    gap: 12, paddingTop: 6,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 12 },
  tabChip: {
    flex: 1, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)', backgroundColor: 'rgba(168,85,247,0.06)',
    alignItems: 'center',
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  quizCard: { borderRadius: 20, borderWidth: 1, padding: 20, marginBottom: 8 },
  quizOption: {
    borderRadius: 14, borderWidth: 1, padding: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 9,
  },
  archCard: {
    borderRadius: 18, borderWidth: 1, padding: 14, overflow: 'hidden',
  },
  archIconWrap: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  expandSection: { borderRadius: 12, borderWidth: 1, padding: 12 },
  resultCard: {
    borderRadius: 24, borderWidth: 1, padding: 24,
    alignItems: 'center', overflow: 'hidden', marginTop: 4,
  },
  infoBox: { borderRadius: 14, borderWidth: 1, padding: 14, width: '100%', marginBottom: 4 },
  aiCard: { borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden' },
  practiceSectionWrap: {
    borderRadius: 18, borderWidth: 1, padding: 16, overflow: 'hidden',
  },
  practiceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8,
  },
  practiceNumber: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  retakeBtn: {
    flexDirection: 'row', gap: 7, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 16, borderWidth: 1, alignItems: 'center',
  },
});
