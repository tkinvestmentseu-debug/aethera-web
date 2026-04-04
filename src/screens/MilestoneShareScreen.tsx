// @ts-nocheck
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TextInput,
  Share,
  Clipboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Path,
  G,
  Line,
  Rect,
  Text as SvgText,
  Defs,
  RadialGradient as SvgRadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
  Ellipse,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { HapticsService } from '../core/services/haptics.service';
import {
  ChevronLeft,
  Share2,
  Sparkles,
  Copy,
  Check,
  Download,
  Instagram,
  MessageCircle,
  Star,
  Award,
  Zap,
  Trophy,
  Crown,
  Flame,
  Heart,
  BookOpen,
  Moon,
  Users,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');
const GOLD = '#D4AF37';
const GOLD2 = '#CEAE72';
const PURPLE = '#A78BFA';
const TEAL = '#6EE7B7';
const CARD_W = SW - layout.padding.screen * 2;

// ─── Milestone definitions ────────────────────────────────────────────────────

const MILESTONE_DATA: Record<string, {
  color: string; color2: string; emoji: string; rarity: string; rarityColor: string;
  archetype: string; quote: string; quoteAuthor: string; affirmation: string;
  nextMilestone: string; nextMilestonePts: number; celebration: string;
}> = {
  streak: {
    color: '#F59E0B', color2: '#D97706', emoji: '🔥', rarity: 'EPICZNE',
    rarityColor: '#A78BFA', archetype: 'Kapłan / Kapłanka',
    quote: 'Dyscyplina to najwyższa forma miłości własnej.',
    quoteAuthor: 'Rumi',
    affirmation: 'Moja regularność jest formą modlitwy. Każdy dzień to akt oddania wobec siebie.',
    nextMilestone: '30 dni z rzędu', nextMilestonePts: 30,
    celebration: 'Twoja duszą ognista! Paliwa rytuału nie sposób ugasić.',
  },
  meditation: {
    color: '#34D399', color2: '#059669', emoji: '🌿', rarity: 'RZADKIE',
    rarityColor: '#60A5FA', archetype: 'Mędrzec',
    quote: 'Cisza to język Boga. Wszystko inne to słabe tłumaczenie.',
    quoteAuthor: 'Rumi',
    affirmation: 'W ciszy odnajduję siebie. Każdy oddech przybliża mnie do mojej prawdy.',
    nextMilestone: '50 minut medytacji', nextMilestonePts: 50,
    celebration: 'Osiągnąłeś głębię, której wielu szuka całe życie.',
  },
  journal: {
    color: '#818CF8', color2: '#6366F1', emoji: '📖', rarity: 'RZADKIE',
    rarityColor: '#60A5FA', archetype: 'Pisarz duszy',
    quote: 'Pisanie to modlitwa, którą możesz przeczytać ponownie.',
    quoteAuthor: 'Nieznany',
    affirmation: 'Moje słowa mają moc. Każdy wpis jest krokiem ku głębszemu zrozumieniu siebie.',
    nextMilestone: '50 wpisów', nextMilestonePts: 50,
    celebration: 'Twoja historia zasługuje na bycie opowiedzianą.',
  },
  gratitude: {
    color: '#F472B6', color2: '#EC4899', emoji: '✨', rarity: 'POSPOLITE',
    rarityColor: '#86EFAC', archetype: 'Kochający',
    quote: 'Wdzięczność zmienia to, co mamy, w wystarczające.',
    quoteAuthor: 'Melody Beattie',
    affirmation: 'Moje serce jest otwarte na piękno każdego dnia. Wdzięczność jest moją siłą.',
    nextMilestone: '30 dni wdzięczności', nextMilestonePts: 30,
    celebration: 'Twoje serce widzi piękno tam, gdzie inni widzą zwykłość.',
  },
  tarot: {
    color: '#C084FC', color2: '#A855F7', emoji: '🔮', rarity: 'EPICZNE',
    rarityColor: '#A78BFA', archetype: 'Wieszczek',
    quote: 'Karty nie mówią, co się stanie. Mówią, co jest w Tobie.',
    quoteAuthor: 'Aethera',
    affirmation: 'Moja intuicja jest moim przewodnikiem. Widzę prawdę ukrytą w symbolach.',
    nextMilestone: '100 odczytów', nextMilestonePts: 100,
    celebration: 'Arkan tańczy wokół Twojej duszy z radością.',
  },
  default: {
    color: GOLD, color2: '#B8860B', emoji: '⭐', rarity: 'LEGENDARNE',
    rarityColor: '#FCD34D', archetype: 'Poszukiwacz',
    quote: 'Podróż tysiąca mil zaczyna się od jednego kroku.',
    quoteAuthor: 'Laozi',
    affirmation: 'Jestem na właściwej ścieżce. Każdy krok przybliża mnie do mojej prawdy.',
    nextMilestone: 'Kolejne osiągnięcie', nextMilestonePts: 10,
    celebration: 'Twoja dusza rozkwita jak kwiat w świetle świadomości.',
  },
};

const getMilestoneData = (badgeId: string = '') => {
  const id = badgeId.toLowerCase();
  for (const key of Object.keys(MILESTONE_DATA)) {
    if (id.includes(key)) return MILESTONE_DATA[key];
  }
  return MILESTONE_DATA.default;
};

// ─── Spiritual meanings ───────────────────────────────────────────────────────

const SPIRITUAL_MEANINGS: Record<string, string> = {
  streak: 'Regularność to forma miłości do siebie. Twoja dyscyplina stała się rytuałem, a rytm — modlitwą. Każdy dzień, w którym wracasz do praktyki, jest dowodem, że Twoja dusza jest ważniejsza od wygody.',
  meditation: 'Milczenie jest drzwiami. Każda minuta medytacji rozszerza Twoją zdolność do obecności i spokoju. Nauczyłeś się słuchać ciszy, a w ciszy usłyszeć siebie.',
  journal: 'Pisanie to tworzenie. Przelewając słowa na papier, czynisz niewidzialne widzialnym. Twoje wnętrze zasługuje na świadka, a Ty stałeś się własnym kronikaorzem duszy.',
  gratitude: 'Wdzięczność to mistyczny klucz, który otwiera bramę obfitości. Widząc piękno w codzienności, zapraszasz więcej piękna do swojego życia.',
  tarot: 'Karty Tarota są zwierciadłem, nie wyrocznią. Twoja gotowość do patrzenia w głąb siebie i przyjmowania tego, co widzisz, jest rzadkim darem.',
  default: 'Każde osiągnięcie jest krokiem na spirali wzrostu duszy. Nie chodzi o cel — chodzi o to, kim stajesz się w drodze. Twoja determinacja jest dowodem, że jesteś gotowy na kolejny poziom.',
};

const getSpiritualMeaning = (badgeId: string = '') => {
  const id = badgeId.toLowerCase();
  for (const key of Object.keys(SPIRITUAL_MEANINGS)) {
    if (id.includes(key)) return SPIRITUAL_MEANINGS[key];
  }
  return SPIRITUAL_MEANINGS.default;
};

// ─── Confetti particles ───────────────────────────────────────────────────────

const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ['#CEAE72', '#A78BFA', '#FFFFFF', '#6EE7B7', '#F472B6', '#60A5FA'];

interface ConfettiItem {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  speed: number;
  color: string;
  size: number;
  delay: number;
  shape: 'circle' | 'rect' | 'star';
}

const CONFETTI_ITEMS: ConfettiItem[] = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  id: i,
  startX: SW * 0.1 + Math.random() * SW * 0.8,
  startY: SH * 0.1 + Math.random() * SH * 0.15,
  angle: (i / CONFETTI_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.8,
  speed: 120 + Math.random() * 180,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + Math.random() * 6,
  delay: Math.floor(Math.random() * 600),
  shape: (['circle', 'rect', 'star'] as const)[i % 3],
}));

const ConfettiParticle = ({ item, burst }: { item: ConfettiItem; burst: number }) => {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Idle ambient fall
    const fallDur = 2000 + item.delay * 3;
    ty.value = withDelay(
      item.delay,
      withRepeat(withTiming(SH * 0.9, { duration: fallDur, easing: Easing.linear }), -1, false),
    );
    opacity.value = withDelay(
      item.delay,
      withRepeat(
        withSequence(
          withTiming(0.9, { duration: 300 }),
          withTiming(0.6, { duration: fallDur - 500 }),
          withTiming(0, { duration: 200 }),
        ),
        -1,
        false,
      ),
    );
    rotate.value = withDelay(
      item.delay,
      withRepeat(withTiming(360, { duration: fallDur * 0.7, easing: Easing.linear }), -1, false),
    );
  }, []);

  useEffect(() => {
    if (burst > 0) {
      // Explosion burst
      const vx = Math.cos(item.angle) * item.speed;
      const vy = Math.sin(item.angle) * item.speed - 80;
      tx.value = withSequence(
        withSpring(vx, { damping: 8, stiffness: 120 }),
        withTiming(vx * 1.2, { duration: 800 }),
      );
      ty.value = withSequence(
        withSpring(vy, { damping: 8, stiffness: 120 }),
        withTiming(SH * 0.6, { duration: 1200, easing: Easing.in(Easing.quad) }),
      );
      opacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(600, withTiming(0, { duration: 600 })),
      );
      scale.value = withSequence(
        withSpring(1.4, { damping: 10 }),
        withTiming(0.6, { duration: 800 }),
      );
    }
  }, [burst]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: item.startX,
    top: item.startY,
    width: item.size,
    height: item.size,
    borderRadius: item.shape === 'circle' ? item.size / 2 : 2,
    backgroundColor: item.color,
    opacity: opacity.value,
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={style} />;
};

// ─── Orbital star particles ───────────────────────────────────────────────────

interface OrbitStar {
  id: number;
  radius: number;
  angle: number;
  speed: number;
  size: number;
  color: string;
}

const ORBIT_STARS: OrbitStar[] = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  radius: 108 + (i % 3) * 14,
  angle: (i / 6) * Math.PI * 2,
  speed: 5000 + i * 700,
  size: 3 + (i % 3),
  color: [GOLD, PURPLE, TEAL, '#F472B6', GOLD2, '#60A5FA'][i],
}));

const OrbitalStar = ({ star }: { star: OrbitStar }) => {
  const angle = useSharedValue(star.angle);

  useEffect(() => {
    angle.value = withRepeat(
      withTiming(star.angle + Math.PI * 2, { duration: star.speed, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    width: star.size * 2,
    height: star.size * 2,
    borderRadius: star.size,
    backgroundColor: star.color,
    opacity: 0.85,
    transform: [
      { translateX: Math.cos(angle.value) * star.radius },
      { translateY: Math.sin(angle.value) * star.radius * 0.42 },
    ],
  }));

  return <Animated.View style={style} />;
};

// ─── 3D Badge Widget ──────────────────────────────────────────────────────────

const BadgeWidget = ({
  emoji,
  color,
  color2,
  title,
  isLight,
}: {
  emoji: string; color: string; color2: string; title: string; isLight: boolean;
}) => {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const scale = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Spring entrance
    scale.value = withSpring(1, { damping: 12, stiffness: 120, mass: 0.8 });
    // Pulsing glow
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, []);

  const panGesture = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = interpolate(e.translationY, [-80, 80], [15, -15]);
      tiltY.value = interpolate(e.translationX, [-80, 80], [-15, 15]);
    })
    .onEnd(() => {
      tiltX.value = withSpring(0, { damping: 14 });
      tiltY.value = withSpring(0, { damping: 14 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const BADGE_R = 100;
  const TICK_COUNT = 12;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.badgeWrapper, containerStyle]}>
        {/* Glow halo */}
        <Animated.View
          style={[
            glowStyle,
            {
              position: 'absolute',
              width: 240,
              height: 240,
              borderRadius: 120,
              backgroundColor: color + '20',
            },
          ]}
        />
        <Animated.View
          style={[
            glowStyle,
            {
              position: 'absolute',
              width: 210,
              height: 210,
              borderRadius: 105,
              borderWidth: 1,
              borderColor: color + '50',
            },
          ]}
        />

        {/* Orbital stars */}
        <View style={styles.orbitContainer}>
          {ORBIT_STARS.map(s => (
            <OrbitalStar key={s.id} star={s} />
          ))}

          {/* Main badge SVG */}
          <Svg width={200} height={200} viewBox="0 0 200 200">
            <Defs>
              <SvgRadialGradient id="badgeGrad" cx="40%" cy="35%" r="65%">
                <Stop offset="0%" stopColor={color} stopOpacity="0.35" />
                <Stop offset="50%" stopColor={color2} stopOpacity="0.20" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
              </SvgRadialGradient>
              <SvgLinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={color} stopOpacity="1" />
                <Stop offset="50%" stopColor={color2} stopOpacity="0.8" />
                <Stop offset="100%" stopColor={color} stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>

            {/* Outer decorative ring */}
            <Circle cx="100" cy="100" r="96" fill="none" stroke="url(#ringGrad)" strokeWidth="2.5" opacity="0.7" />
            <Circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />

            {/* 12 tick marks */}
            {Array.from({ length: TICK_COUNT }, (_, i) => {
              const a = (i / TICK_COUNT) * Math.PI * 2 - Math.PI / 2;
              const isMajor = i % 3 === 0;
              const r1 = isMajor ? 82 : 84;
              const r2 = isMajor ? 94 : 90;
              return (
                <Line
                  key={i}
                  x1={100 + Math.cos(a) * r1}
                  y1={100 + Math.sin(a) * r1}
                  x2={100 + Math.cos(a) * r2}
                  y2={100 + Math.sin(a) * r2}
                  stroke={color}
                  strokeWidth={isMajor ? 2.5 : 1}
                  opacity={isMajor ? 0.9 : 0.5}
                />
              );
            })}

            {/* Ornamental dots at major ticks */}
            {Array.from({ length: 4 }, (_, i) => {
              const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
              return (
                <Circle
                  key={i}
                  cx={100 + Math.cos(a) * 97}
                  cy={100 + Math.sin(a) * 97}
                  r="3"
                  fill={color}
                  opacity="0.9"
                />
              );
            })}

            {/* Inner filled circle */}
            <Circle cx="100" cy="100" r="76" fill="url(#badgeGrad)" />
            <Circle cx="100" cy="100" r="76" fill="none" stroke={color} strokeWidth="1.2" opacity="0.5" />

            {/* Inner decorative ring */}
            <Circle cx="100" cy="100" r="68" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />

            {/* 4-pointed star ornament */}
            <Path
              d="M100 42 L103 58 L118 55 L107 66 L120 75 L104 73 L100 90 L96 73 L80 75 L93 66 L82 55 L97 58 Z"
              fill="none"
              stroke={color}
              strokeWidth="0.8"
              opacity="0.25"
            />

            {/* Emoji rendered as text */}
            <SvgText
              x="100"
              y="112"
              textAnchor="middle"
              fontSize="52"
              fill={color}
            >
              {emoji}
            </SvgText>
          </Svg>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Share option tile ────────────────────────────────────────────────────────

const ShareTile = ({
  emoji, label, color, gradColors, onPress, isLight,
}: {
  emoji: string; label: string; color: string; gradColors: string[];
  onPress: () => void; isLight: boolean;
}) => {
  const scale = useSharedValue(1);
  const press = Gesture.Tap()
    .onBegin(() => { scale.value = withSpring(0.93, { damping: 15 }); })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 12 });
      runOnJS(onPress)();
    });

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <GestureDetector gesture={press}>
      <Animated.View style={[style, styles.shareTile]}>
        <LinearGradient
          colors={gradColors as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.shareTileInner, { borderColor: color + '40' }]}>
          <Text style={styles.shareTileEmoji}>{emoji}</Text>
          <Text style={[styles.shareTileLabel, { color: isLight ? 'rgba(0,0,0,0.75)' : 'rgba(255,255,255,0.85)' }]}>
            {label}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// ─── Next milestone progress ──────────────────────────────────────────────────

const NextMilestoneBar = ({
  label, current, total, color, isLight,
}: {
  label: string; current: number; total: number; color: string; isLight: boolean;
}) => {
  const progress = useSharedValue(0);
  const pct = Math.min(current / total, 1);

  useEffect(() => {
    progress.value = withDelay(600, withTiming(pct, { duration: 1200, easing: Easing.out(Easing.quad) }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.nextMilestoneRow}>
        <Text style={[styles.nextMilestoneLabel, { color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)' }]}>
          {label}
        </Text>
        <Text style={[styles.nextMilestonePct, { color }]}>
          {current}/{total}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)' }]}>
        <Animated.View style={[styles.progressFill, barStyle, { backgroundColor: color }]} />
      </View>
    </View>
  );
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export const MilestoneShareScreen = ({ route, navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { badge } = route?.params || {};
  const {
    themeName, userData,
    meditationSessions, breathworkSessions,
    gratitudeEntries, journalEntries,
  } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight = currentTheme.background.startsWith('#F');

  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(0);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const milestoneData = useMemo(() => getMilestoneData(badge?.id || ''), [badge?.id]);
  const spiritualMeaning = useMemo(() => getSpiritualMeaning(badge?.id || ''), [badge?.id]);
  const userName = userData?.name || 'Wędrowiec';

  const practiceCount = (meditationSessions?.length || 0) + (breathworkSessions?.length || 0);
  const journalCount = journalEntries?.length || 0;
  const gratitudeCount = gratitudeEntries?.length || 0;

  const dateEarned = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'long', year: 'numeric' });
  }, []);

  // Fire confetti burst on mount
  useEffect(() => {
    const t = setTimeout(() => {
      setBurst(b => b + 1);
      HapticsService.notify();
    }, 400);
    return () => {
      clearTimeout(t);
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const shareText = `Właśnie zdobyłam/-em osiągnięcie "${badge?.title || 'Osiągnięcie'}" w aplikacji Aethera! ${milestoneData.emoji}\n\nArchetyp: ${milestoneData.archetype}\n\n„${milestoneData.quote}" — ${milestoneData.quoteAuthor}\n\nOdkryj swoją duszę → aethera.app`;

  const handleSystemShare = async () => {
    HapticsService.impact('light');
    try {
      await Share.share({ message: shareText });
    } catch {}
  };

  const handleCopy = () => {
    HapticsService.impact('light');
    if (Clipboard?.setString) Clipboard.setString(shareText);
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
  };

  const handleBurst = () => {
    HapticsService.impact('medium');
    setBurst(b => b + 1);
  };

  // Theme vars
  const cardBg = isLight ? 'rgba(255,252,245,0.96)' : 'rgba(12,8,22,0.90)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)';
  const subText = isLight ? 'rgba(0,0,0,0.50)' : 'rgba(255,255,255,0.50)';
  const bodyText = isLight ? 'rgba(0,0,0,0.80)' : 'rgba(255,255,255,0.82)';
  const sectionBg = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)';
  const sectionBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const divColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';

  const { color, color2, emoji, rarity, rarityColor, archetype, quote, quoteAuthor,
    affirmation, nextMilestone, nextMilestonePts, celebration } = milestoneData;

  const SHARE_TILES = [
    { emoji: '📸', label: 'Zapisz obraz', color: '#60A5FA', gradColors: ['rgba(96,165,250,0.12)', 'rgba(96,165,250,0.06)'], onPress: () => HapticsService.impact('light') },
    { emoji: '📤', label: 'Udostępnij', color: color, gradColors: [color + '18', color + '08'], onPress: handleSystemShare },
    { emoji: '📋', label: 'Kopiuj tekst', color: '#A78BFA', gradColors: ['rgba(167,139,250,0.12)', 'rgba(167,139,250,0.06)'], onPress: handleCopy },
    { emoji: '💬', label: 'WhatsApp', color: '#25D366', gradColors: ['rgba(37,211,102,0.12)', 'rgba(37,211,102,0.06)'], onPress: handleSystemShare },
    { emoji: '📱', label: 'Instagram Stories', color: '#E1306C', gradColors: ['rgba(225,48,108,0.12)', 'rgba(225,48,108,0.06)'], onPress: handleSystemShare },
    { emoji: '✨', label: 'Aethera Społeczność', color: GOLD, gradColors: [GOLD + '18', GOLD + '08'], onPress: handleSystemShare },
  ];

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          isLight
            ? ['#FAF5F2', '#F2E8F8', '#E8E0F8']
            : ['#060410', '#0A0418', '#140826']
        }
        style={StyleSheet.absoluteFill}
      />

      {/* Ambient glow */}
      <View style={[styles.ambientGlow, { backgroundColor: color + '18' }]} pointerEvents="none" />

      {/* Confetti layer */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {CONFETTI_ITEMS.map(item => (
          <ConfettiParticle key={item.id} item={item} burst={burst} />
        ))}
      </View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Main'); }}
            style={styles.backBtn}
            hitSlop={20}
          >
            <ChevronLeft color={currentTheme.primary} size={26} strokeWidth={1.5} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: subText, letterSpacing: 1.8 }]}>
            ✦ ŚWIĘTUJ CHWILĘ
          </Text>
          <View style={{ width: 26 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom + 32, 48) }]}
          showsVerticalScrollIndicator={false}
        >

          {/* ─── Badge Widget ─── */}
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.badgeSection}>
            <BadgeWidget
              emoji={emoji}
              color={color}
              color2={color2}
              title={badge?.title || 'Osiągnięcie'}
              isLight={isLight}
            />

            {/* Rarity badge */}
            <Animated.View entering={FadeInUp.delay(350).duration(500)} style={styles.rarityBadgeRow}>
              <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '22', borderColor: rarityColor + '50' }]}>
                <Crown color={rarityColor} size={11} strokeWidth={1.5} />
                <Text style={[styles.rarityText, { color: rarityColor }]}>{rarity}</Text>
              </View>
            </Animated.View>

            {/* Titles */}
            <Animated.View entering={FadeInUp.delay(420).duration(550)} style={styles.badgeTitles}>
              <Text style={[styles.archetypeLabel, { color: color }]}>
                {emoji} {archetype.toUpperCase()}
              </Text>
              <Text style={[styles.badgeTitle, { color: currentTheme.primary }]}>
                {badge?.title || 'Mistyczne osiągnięcie'}
              </Text>
              <Text style={[styles.badgeSubtitle, { color: bodyText }]}>
                Drogi/a {userName}, twoja dusza rozkwita.
              </Text>
              <Text style={[styles.celebrationText, { color: subText }]}>
                {celebration}
              </Text>
            </Animated.View>
          </Animated.View>

          {/* ─── Achievement Details Card ─── */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={[color + '10', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <Trophy color={color} size={16} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>SZCZEGÓŁY OSIĄGNIĘCIA</Text>
              </View>

              <View style={[styles.detailRow, { borderBottomColor: divColor }]}>
                <Text style={[styles.detailKey, { color: subText }]}>Typ</Text>
                <Text style={[styles.detailVal, { color: bodyText }]}>
                  {badge?.type || archetype}
                </Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: divColor }]}>
                <Text style={[styles.detailKey, { color: subText }]}>Data zdobycia</Text>
                <Text style={[styles.detailVal, { color: bodyText }]}>{dateEarned}</Text>
              </View>
              <View style={[styles.detailRow, { borderBottomColor: divColor }]}>
                <Text style={[styles.detailKey, { color: subText }]}>Rzadkość</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.rarityDot, { backgroundColor: rarityColor }]} />
                  <Text style={[styles.detailVal, { color: rarityColor }]}>{rarity}</Text>
                </View>
              </View>
              {badge?.description ? (
                <View style={[styles.detailRow, { borderBottomColor: 'transparent' }]}>
                  <Text style={[styles.detailKey, { color: subText }]}>Opis</Text>
                  <Text style={[styles.detailVal, { color: bodyText, flex: 1 }]}>{badge.description}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>

          {/* ─── Stats that led here ─── */}
          <Animated.View entering={FadeInUp.delay(270).duration(600)}>
            <View style={[styles.statsRow, { backgroundColor: sectionBg, borderColor: sectionBorder }]}>
              {[
                { label: 'Praktyki', value: practiceCount, icon: Flame, color: '#F59E0B' },
                { label: 'Wpisy', value: journalCount, icon: BookOpen, color: '#818CF8' },
                { label: 'Wdzięczność', value: gratitudeCount, icon: Heart, color: '#F472B6' },
              ].map((stat, i) => (
                <View
                  key={i}
                  style={[
                    styles.statItem,
                    i < 2 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: divColor },
                  ]}
                >
                  <stat.icon color={stat.color} size={16} strokeWidth={1.5} style={{ marginBottom: 4 }} />
                  <Text style={[styles.statValue, { color: currentTheme.primary }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: subText }]}>{stat.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* ─── Personalized celebration message ─── */}
          <Animated.View entering={FadeInUp.delay(330).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={[color + '08', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <Sparkles color={GOLD} size={14} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>PRZESŁANIE DLA CIEBIE</Text>
              </View>
              <Text style={[styles.celebrationBody, { color: bodyText }]}>
                Droga/i {userName},{'\n\n'}
                {spiritualMeaning}
              </Text>
              <View style={[styles.divider, { backgroundColor: divColor }]} />
              <View style={[styles.affirmationBox, { backgroundColor: color + '12', borderColor: color + '30' }]}>
                <Text style={[styles.affirmationText, { color: color }]}>✦ {affirmation}</Text>
              </View>
            </View>
          </Animated.View>

          {/* ─── Inspirational Quote Card ─── */}
          <Animated.View entering={FadeInUp.delay(390).duration(600)}>
            <View style={[styles.quoteCard, { borderColor: color + '35' }]}>
              <LinearGradient
                colors={[color + '16', color2 + '08', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={[styles.quoteIcon, { color: color }]}>"</Text>
              <Text style={[styles.quoteText, { color: bodyText }]}>{quote}</Text>
              <Text style={[styles.quoteAuthor, { color: subText }]}>— {quoteAuthor}</Text>
            </View>
          </Animated.View>

          {/* ─── Share Options Grid ─── */}
          <Animated.View entering={FadeInUp.delay(440).duration(600)}>
            <Text style={[styles.sectionLabel, { color: subText }]}>UDOSTĘPNIJ OSIĄGNIĘCIE</Text>
            <View style={styles.tilesGrid}>
              {SHARE_TILES.map((tile, i) => (
                <ShareTile
                  key={i}
                  emoji={tile.emoji}
                  label={tile.label}
                  color={tile.color}
                  gradColors={tile.gradColors}
                  onPress={tile.onPress}
                  isLight={isLight}
                />
              ))}
            </View>
          </Animated.View>

          {/* ─── Next Milestone Preview ─── */}
          <Animated.View entering={FadeInUp.delay(490).duration(600)}>
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <LinearGradient
                colors={['rgba(212,175,55,0.06)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <Star color={GOLD} size={14} strokeWidth={1.5} />
                <Text style={[styles.cardHeaderLabel, { color: subText }]}>NASTĘPNY CEL</Text>
              </View>
              <Text style={[styles.nextMilestoneTitle, { color: currentTheme.primary }]}>
                Do następnego osiągnięcia…
              </Text>
              <Text style={[styles.nextMilestoneName, { color: bodyText }]}>{nextMilestone}</Text>
              <View style={{ marginTop: 16 }}>
                <NextMilestoneBar
                  label={nextMilestone}
                  current={Math.max(practiceCount + journalCount, 1)}
                  total={nextMilestonePts}
                  color={color}
                  isLight={isLight}
                />
              </View>
              <Text style={[styles.nextMilestoneHint, { color: subText }]}>
                Kontynuuj codzienną praktykę, by odblokować kolejny poziom.
              </Text>
            </View>
          </Animated.View>

          {/* ─── Celebrate button ─── */}
          <Animated.View entering={FadeInUp.delay(560).duration(700)} style={{ marginTop: 8 }}>
            <Pressable
              onPress={handleBurst}
              style={({ pressed }) => [styles.celebrateBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[color, color2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
              />
              <Sparkles color={isLight ? '#000' : '#FFF'} size={22} strokeWidth={1.5} />
              <Text style={[styles.celebrateBtnText, { color: isLight ? '#000' : '#FFF' }]}>
                Świętuj! 🎉
              </Text>
            </Pressable>
          </Animated.View>

          {/* ─── Main share CTA ─── */}
          <Animated.View entering={FadeInUp.delay(620).duration(700)} style={{ marginTop: 14 }}>
            <Pressable
              onPress={handleSystemShare}
              style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={[GOLD, GOLD2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
              <Share2 color="#000" size={20} strokeWidth={1.8} />
              <Text style={styles.shareBtnText}>Podziel się osiągnięciem</Text>
            </Pressable>
          </Animated.View>

          {/* Copy fallback row */}
          <Animated.View entering={FadeInUp.delay(680).duration(600)} style={styles.copyRow}>
            <Pressable onPress={handleCopy} style={[styles.copyBtn, { borderColor: cardBorder, backgroundColor: sectionBg }]}>
              {copied
                ? <Check color={color} size={16} strokeWidth={2} />
                : <Copy color={subText} size={16} strokeWidth={1.6} />}
              <Text style={[styles.copyBtnText, { color: copied ? color : subText }]}>
                {copied ? 'Skopiowano!' : 'Kopiuj tekst'}
              </Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 16 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },

  ambientGlow: {
    position: 'absolute',
    top: 60,
    left: SW * 0.1,
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    opacity: 0.35,
  },

  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.padding.screen,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1.8 },

  scroll: {
    paddingHorizontal: layout.padding.screen,
    paddingTop: 12,
    gap: 16,
  },

  // Badge section
  badgeSection: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  badgeWrapper: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitContainer: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rarityBadgeRow: { flexDirection: 'row', justifyContent: 'center' },
  rarityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  rarityText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  badgeTitles: { alignItems: 'center', gap: 6 },
  archetypeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2.2 },
  badgeTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', letterSpacing: -0.3 },
  badgeSubtitle: { fontSize: 14, textAlign: 'center', fontWeight: '500' },
  celebrationText: { fontSize: 13, textAlign: 'center', lineHeight: 19, paddingHorizontal: 16 },

  // Cards
  card: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  cardHeaderLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5 },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  detailKey: { fontSize: 12, fontWeight: '500' },
  detailVal: { fontSize: 13, fontWeight: '600', textAlign: 'right', flexShrink: 1 },
  rarityDot: { width: 8, height: 8, borderRadius: 4 },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  statItem: { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 1.0, marginTop: 2 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 14, borderRadius: 1 },

  celebrationBody: { fontSize: 14, lineHeight: 24, fontWeight: '400' },
  affirmationBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  affirmationText: { fontSize: 13, lineHeight: 21, fontWeight: '500', fontStyle: 'italic' },

  // Quote card
  quoteCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    overflow: 'hidden',
  },
  quoteIcon: { fontSize: 48, lineHeight: 44, fontWeight: '700', opacity: 0.6 },
  quoteText: { fontSize: 15, lineHeight: 24, fontStyle: 'italic', fontWeight: '500', marginTop: 4 },
  quoteAuthor: { fontSize: 12, marginTop: 10, fontWeight: '500' },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
    marginBottom: 12,
    marginTop: 4,
  },

  // Share tiles grid
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shareTile: {
    width: (CARD_W - 10) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  shareTileInner: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
  },
  shareTileEmoji: { fontSize: 28 },
  shareTileLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  // Next milestone
  nextMilestoneTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  nextMilestoneName: { fontSize: 13 },
  nextMilestoneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nextMilestoneLabel: { fontSize: 12, fontWeight: '500' },
  nextMilestonePct: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  nextMilestoneHint: { fontSize: 12, marginTop: 10, lineHeight: 18 },

  // Celebrate button
  celebrateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 60,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  celebrateBtnText: { fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },

  // Share CTA button
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 7,
  },
  shareBtnText: { color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  copyRow: { alignItems: 'center' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  copyBtnText: { fontSize: 13, fontWeight: '500' },
});
