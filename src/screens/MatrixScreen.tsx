// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Dimensions, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MysticalInput } from '../components/MysticalInput';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { Typography } from '../components/Typography';
import {
  calculateCompatibility, calculateMatrix, getEnergyMeaning, reduceTo22,
} from '../features/matrix/utils/numerology';
import { MatrixChart } from '../features/matrix/components/MatrixChart';
import {
  Activity, BookOpen, Brain, Calendar, ChevronLeft, ChevronRight, Coins, Compass,
  Flame, GitBranch, Hash, Heart, Hexagon, Orbit, ScrollText,
  Share2, Shield, Sparkles, Star, TreePine, Users, Wind, Zap,
  TrendingUp, AlertCircle, CheckCircle,
  ArrowLeft, ArrowUp, ArrowDown, Target, Layers, Clock,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, G, Line, Polygon, RadialGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { goBackOrToMainTab, navigateToMainTab } from '../navigation/navigationFallbacks';
import { AiService } from '../core/services/ai.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { DateWheelPicker } from '../components/DateWheelPicker';
import { buildMatrixShareMessage } from '../core/utils/share';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Animated Pythagorean Matrix Background ──────────────────
const MatrixBackground = ({ isLight }: { isLight: boolean }) => {
  const rot1 = useSharedValue(0);
  const rot2 = useSharedValue(0);
  const pulse = useSharedValue(0.6);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  useEffect(() => {
    rot1.value = withRepeat(withTiming(360, { duration: 36000 }), -1, false);
    rot2.value = withRepeat(withTiming(-360, { duration: 24000 }), -1, false);
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 2800 }), withTiming(0.45, { duration: 2800 })),
      -1, false,
    );
  }, []);

  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.07));
      tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.07));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 1000 });
      tiltY.value = withTiming(0, { duration: 1000 });
    });

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot1.value}deg` }],
    opacity: 0.20,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot2.value}deg` }],
    opacity: 0.14,
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * (isLight ? 0.07 : 0.20),
  }));
  const outerStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  const CX = SW / 2;
  const CY = SH * 0.36;
  const GOLD = '#CEAE72';
  const VIOLET = '#A78BFA';
  const TEAL = '#2DD4BF';

  // Diamond / matrix node positions — 3×3 diamond layout
  const CELL = SW * 0.12;
  const matrixNodes = [
    { x: CX,           y: CY - CELL * 2,   label: '↑' }, // top
    { x: CX - CELL,   y: CY - CELL,        label: '◀' }, // top-left
    { x: CX + CELL,   y: CY - CELL,        label: '▶' }, // top-right
    { x: CX - CELL * 1.9, y: CY,           label: '◀' }, // left
    { x: CX,           y: CY,              label: '◆' }, // center
    { x: CX + CELL * 1.9, y: CY,           label: '▶' }, // right
    { x: CX - CELL,   y: CY + CELL,        label: '◀' }, // bot-left
    { x: CX + CELL,   y: CY + CELL,        label: '▶' }, // bot-right
    { x: CX,           y: CY + CELL * 2,   label: '↓' }, // bottom
  ];

  // Lines connecting nodes (diamond lattice)
  const nodeLines = [
    [0,1],[0,2],[1,3],[2,5],[1,4],[2,4],[3,4],[5,4],[3,6],[5,7],[4,6],[4,7],[6,8],[7,8],
  ];

  // Rotating particles in orbits
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 2 * Math.PI;
    const orbit = CELL * (2 + (i % 3) * 0.9);
    return { x: CX + orbit * Math.cos(angle), y: CY + orbit * Math.sin(angle), r: 1.8 + (i % 4) * 0.7 };
  });

  if (isLight) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['#F8F4EE', '#F0E8DA', '#EAE0CC']}
          style={StyleSheet.absoluteFill}
        />
      </View>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep dark base */}
      <LinearGradient
        colors={['#020209', '#05030F', '#08051A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Radial glow */}
      <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
        <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="matGlow" cx="50%" cy="36%" r="48%">
              <Stop offset="0%" stopColor={GOLD} stopOpacity="1" />
              <Stop offset="35%" stopColor={VIOLET} stopOpacity="0.6" />
              <Stop offset="100%" stopColor="#020209" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={CX} cy={CY} r={SW * 0.68} fill="url(#matGlow)" />
        </Svg>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>

          {/* Layer 1: Diamond lattice (slow rotate) */}
          <Animated.View style={[StyleSheet.absoluteFill, ring1Style]}>
            <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
              {nodeLines.map(([a, b], i) => (
                <Line key={`nl${i}`}
                  x1={matrixNodes[a].x} y1={matrixNodes[a].y}
                  x2={matrixNodes[b].x} y2={matrixNodes[b].y}
                  stroke={GOLD} strokeWidth={0.7} opacity={0.6} />
              ))}
              {matrixNodes.map((n, i) => (
                <Circle key={`mn${i}`} cx={n.x} cy={n.y}
                  r={i === 4 ? 8 : 5}
                  fill={i === 4 ? GOLD : GOLD + '80'}
                  opacity={i === 4 ? 0.9 : 0.55} />
              ))}
              {/* Outer bounding diamond */}
              <Polygon
                points={`${CX},${CY - CELL * 2.8} ${CX + CELL * 2.5},${CY} ${CX},${CY + CELL * 2.8} ${CX - CELL * 2.5},${CY}`}
                fill="none" stroke={GOLD} strokeWidth={0.6} opacity={0.35}
              />
            </Svg>
          </Animated.View>

          {/* Layer 2: Concentric octagon rings + particles (counter-rotate) */}
          <Animated.View style={[StyleSheet.absoluteFill, ring2Style]}>
            <Svg width={SW} height={SH} style={StyleSheet.absoluteFill}>
              {[CELL * 2.2, CELL * 3.5, CELL * 5.0, CELL * 6.6].map((r, ri) => {
                const pts = Array.from({ length: 8 }, (_, i) => {
                  const a = (i / 8) * 2 * Math.PI - Math.PI / 8;
                  return `${CX + r * Math.cos(a)},${CY + r * Math.sin(a)}`;
                }).join(' ');
                return (
                  <Polygon key={`oct${ri}`} points={pts}
                    fill="none"
                    stroke={ri % 2 === 0 ? VIOLET : TEAL}
                    strokeWidth={0.5}
                    strokeDasharray={`${3 + ri * 2} ${5 + ri * 2}`}
                    opacity={0.25 - ri * 0.04} />
                );
              })}
              {particles.map((p, i) => (
                <Circle key={`pt${i}`} cx={p.x} cy={p.y} r={p.r}
                  fill={i % 3 === 0 ? GOLD : i % 3 === 1 ? VIOLET : TEAL}
                  opacity={0.3 + (i % 5) * 0.1} />
              ))}
            </Svg>
          </Animated.View>

          {/* Cross-hair lines through center */}
          <Svg width={SW} height={SH} style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}>
            <Line x1={CX} y1={0} x2={CX} y2={SH} stroke={GOLD} strokeWidth={0.5} />
            <Line x1={0} y1={CY} x2={SW} y2={CY} stroke={GOLD} strokeWidth={0.5} />
            <Line x1={0} y1={CY - CX} x2={SW} y2={CY + CX} stroke={GOLD} strokeWidth={0.4} />
            <Line x1={0} y1={CY + CX} x2={SW} y2={CY - CX} stroke={GOLD} strokeWidth={0.4} />
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* Bottom content fade */}
      <LinearGradient
        colors={['transparent', '#05030F80', '#05030F']}
        locations={[0, 0.5, 1]}
        style={[StyleSheet.absoluteFill, { top: SH * 0.32 }]}
        pointerEvents="none"
      />
    </View>
  );
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const TABS = [
  { key: 'hero', icon: Compass },
  { key: 'read', icon: Layers },
  { key: 'deep', icon: Brain },
  { key: 'practice', icon: Flame },
  { key: 'daily', icon: Calendar },
] as const;
const ROUTES = {
  journalEntry: 'JournalEntry',
  numerology: 'Numerology',
  compatibility: 'Compatibility',
  partnerMatrix: 'PartnerMatrix',
  meditation: 'Meditation',
  profile: 'Profile',
} as const;

const POS_MATRIX_KEYS = ['center','left','bottom','relationship','lifePath','money','right','top',null] as const;

const MATRIX_POSITIONS = [
  { pos: 1, icon: Star },
  { pos: 2, icon: Zap },
  { pos: 3, icon: Shield },
  { pos: 4, icon: Heart },
  { pos: 5, icon: Activity },
  { pos: 6, icon: Coins },
  { pos: 7, icon: TreePine },
  { pos: 8, icon: TrendingUp },
  { pos: 9, icon: Orbit },
] as const;


// ─── 3D ORB ──────────────────────────────────────────────────────────────────

const MatrixOrb3D = ({ accent }) => {
  const rot   = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  useEffect(() => {
    rot.value = withRepeat(withTiming(360, { duration: 18000 }), -1, false);
  }, []);
  const pan = Gesture.Pan()
    .onUpdate(e => {
      tiltX.value = Math.max(-22, Math.min(22, e.translationY * 0.14));
      tiltY.value = Math.max(-22, Math.min(22, e.translationX * 0.14));
    })
    .onEnd(() => {
      tiltX.value = withTiming(0, { duration: 900 });
      tiltY.value = withTiming(0, { duration: 900 });
    });
  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 500 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rot.value}deg` }],
  }));
  const sz = 130; const cx = sz / 2; const R = 40;
  return (
    <View style={{ height: 120, alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Svg width={sz} height={sz}>
            <Defs>
              <RadialGradient id="orbGrad" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={accent} stopOpacity="0.22" />
                <Stop offset="100%" stopColor={accent} stopOpacity="0.03" />
              </RadialGradient>
            </Defs>
            <Circle cx={cx} cy={cx} r={56} fill="url(#orbGrad)" />
            <Circle cx={cx} cy={cx} r={R} fill={accent + '14'} stroke={accent + '55'} strokeWidth={1.4} />
            {[-R*0.35, 0, R*0.35].map((offset, i) => (
              <Line key={'h'+i} x1={cx - R} y1={cx + offset} x2={cx + R} y2={cx + offset}
                stroke={accent + (i === 1 ? '50' : '28')} strokeWidth={i === 1 ? 1 : 0.7} />
            ))}
            {[-R*0.35, 0, R*0.35].map((offset, i) => (
              <Line key={'v'+i} x1={cx + offset} y1={cx - R} x2={cx + offset} y2={cx + R}
                stroke={accent + (i === 1 ? '44' : '22')} strokeWidth={i === 1 ? 0.9 : 0.7} />
            ))}
            <Circle cx={cx} cy={cx} r={5.5} fill={accent} opacity={0.92} />
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}>
              {[0,1,2,3,4,5,6,7,8,9,10].map(i => {
                const a = (i / 11) * 2 * Math.PI;
                return <Circle key={i} cx={cx + 54 * Math.cos(a)} cy={cx + 54 * Math.sin(a) * 0.36}
                  r={i % 3 === 0 ? 4 : 3} fill={accent} opacity={0.35 + (i % 4) * 0.15} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

// ─── ACCORDION ───────────────────────────────────────────────────────────────

const AccordionSection = ({ title, icon: Icon, children, accent, textColor, dividerColor, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View style={{ marginBottom: 12 }}>
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={({ pressed }) => [{
          flexDirection: 'row', alignItems: 'center', paddingVertical: 13,
          paddingHorizontal: 14, borderRadius: 14,
          backgroundColor: pressed ? accent + '0E' : accent + '08',
          borderWidth: 1, borderColor: accent + (open ? '44' : '22'),
        }]}
      >
        <Icon color={accent} size={16} strokeWidth={1.8} style={{ marginRight: 10 }} />
        <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: textColor, letterSpacing: 0.3 }}>{title}</Text>
        <ChevronRight color={accent} size={14} strokeWidth={2}
          style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }} />
      </Pressable>
      {open && <View style={{ paddingTop: 2 }}>{children}</View>}
    </View>
  );
};

// ─── ENERGY DIRECTION BADGE ──────────────────────────────────────────────────

const EnergyDirBadge = ({ dir, accent, label }) => {
  const icons  = { incoming: ArrowDown, outgoing: ArrowUp, left: ArrowLeft, right: ArrowDown, balanced: Target };
  const Icon   = icons[dir] || Target;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: accent + '16', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Icon color={accent} size={11} strokeWidth={2} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: accent, letterSpacing: 0.5 }}>{label || dir}</Text>
    </View>
  );
};

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

export const MatrixScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation(['matrix', 'common', 'translation']);
  const tm = (key: string, options?: Record<string, unknown>) => t(key, { ns: 'matrix', ...(options ?? {}) });
  const tc = (key: string, options?: Record<string, unknown>) => t(key, { ns: 'common', ...(options ?? {}) });
  const insets = useSafeAreaInsets();
  const { themeName, userData, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName);
  const isLight      = currentTheme.background.startsWith('#F');
  const textColor    = isLight ? 'rgba(0,0,0,0.82)'  : 'rgba(255,255,255,0.82)';
  const subColor     = isLight ? 'rgba(0,0,0,0.56)'  : 'rgba(255,255,255,0.56)';
  const dividerColor = isLight ? 'rgba(0,0,0,0.08)'  : 'rgba(255,255,255,0.08)';
  const rowBg        = isLight ? 'rgba(0,0,0,0.03)'  : 'rgba(255,255,255,0.04)';
  const cardBg       = isLight ? 'rgba(0,0,0,0.03)'  : 'rgba(255,255,255,0.05)';
  const accent       = currentTheme.primary;

  const tabs = useMemo(
    () => TABS.map((tab) => ({ ...tab, label: tm(`tabs.${tab.key}`) })),
    [t],
  );
  const matrixPositions = useMemo(
    () => MATRIX_POSITIONS.map((position) => ({
      ...position,
      name: tm(`positions.${position.pos}.name`),
      desc: tm(`positions.${position.pos}.desc`),
    })),
    [t],
  );

  const aiAvailable = AiService.isLaunchAvailable();

  const [activeTab,          setActiveTab         ] = useState('hero');
  const [forSomeone,         setForSomeone         ] = useState(false);
  const [forSomeoneName,     setForSomeoneName     ] = useState('');
  const [forSomeoneBirth,    setForSomeoneBirth    ] = useState('');
  const [showForSomeoneModal,setShowForSomeoneModal] = useState(false);
  // DateWheelPicker state for session target
  const [fsDay,   setFsDay  ] = useState(1);
  const [fsMonth, setFsMonth] = useState(1);
  const [fsYear,  setFsYear ] = useState(1990);
  const [tappedNode,         setTappedNode         ] = useState(null);

  const activeBirthDate = forSomeone && forSomeoneBirth.trim() ? forSomeoneBirth : userData.birthDate;

  const matrix = useMemo(() => {
    if (!activeBirthDate) return null;
    return calculateMatrix(activeBirthDate);
  }, [activeBirthDate]);

  const partnerBirthDate  = route.params?.partnerBirthDate;
  const partnerName       = route.params?.partnerName;
  const partnerMatrix     = useMemo(() => partnerBirthDate ? calculateMatrix(partnerBirthDate) : null, [partnerBirthDate]);
  const relationshipMatrix= useMemo(() => (userData.birthDate && partnerBirthDate) ? calculateCompatibility(userData.birthDate, partnerBirthDate) : null, [partnerBirthDate, userData.birthDate]);

  const handleBack  = () => goBackOrToMainTab(navigation, 'Home');
  const handleShare = async () => {
    if (!matrix) return;
    await Share.share({ message: buildMatrixShareMessage(
      tm('share.summary', {
        center: matrix.center,
        relationship: matrix.relationship,
        money: matrix.money,
        bottom: matrix.bottom,
      }),
      [
        tm('share.highlights.comfort', { value: matrix.center, meaning: getEnergyMeaning(matrix.center) }),
        tm('share.highlights.relationships', { value: matrix.relationship, meaning: getEnergyMeaning(matrix.relationship) }),
        tm('share.highlights.power', { value: matrix.top, meaning: getEnergyMeaning(matrix.top) }),
      ],
    )});
  };

  // ── EMPTY STATE ───────────────────────────────────────────────────────────

  if (!matrix) {
    return (
      <View style={[styles.container, { backgroundColor: isLight ? '#F8F4EE' : '#020209' }]}>
        <MatrixBackground isLight={isLight} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={20}><ChevronLeft color={accent} size={28} strokeWidth={1.5} /></Pressable>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Typography variant="premiumLabel" color={accent}>{tm('empty.eyebrow')}</Typography>
              <Typography variant="screenTitle" style={{ marginTop: 4 }}>{tm('empty.title')}</Typography>
            </View>
            <Pressable onPress={() => { if (isFavoriteItem('matrix')) { removeFavoriteItem('matrix'); } else { addFavoriteItem({ id:'matrix', label:tm('header.favoriteLabel'), route:'Matrix', params:{}, icon:'Sparkles', color:accent, addedAt:new Date().toISOString() }); } }} style={styles.iconBtn} hitSlop={12}>
              <Star color={isFavoriteItem('matrix') ? accent : accent+'88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('matrix') ? accent : 'none'} />
            </Pressable>
          </View>
          <View style={styles.emptyState}>
            <Typography variant="heroTitle" align="center" style={{ marginBottom: 12 }}>{tm('empty.description')}</Typography>
            <Typography variant="bodySmall" align="center" style={[styles.emptyCopy, { color: subColor }]}>{tm('empty.body')}</Typography>
            <View style={[styles.promptList, { backgroundColor: rowBg, borderRadius: 16 }]}>
              <Typography variant="microLabel" color={accent}>{tm('empty.listLabel')}</Typography>
              {(tm('empty.items', { returnObjects: true }) as string[]).map(item => (
                <View key={item} style={styles.promptRow}>
                  <View style={[styles.promptDot, { backgroundColor: accent }]} />
                  <Typography variant="bodySmall" style={[styles.promptText, { color: subColor }]}>{item}</Typography>
                </View>
              ))}
            </View>
            <Pressable onPress={() => navigateToMainTab(navigation, 'Profile')} style={[styles.emptyAction, { borderColor: currentTheme.border, backgroundColor: accent+'10' }]}>
              <Typography variant="premiumLabel" color={accent}>{tm('empty.cta')}</Typography>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // ── DERIVED DATA ──────────────────────────────────────────────────────────

  const currentYear  = new Date().getFullYear();
  const personalYear = reduceTo22(currentYear + matrix.lifePath);
  const birthYear    = activeBirthDate ? new Date(activeBirthDate).getFullYear() : null;
  const currentAge   = birthYear ? currentYear - birthYear : 0;

  const allNums      = [matrix.center,matrix.top,matrix.bottom,matrix.left,matrix.right,matrix.relationship,matrix.money,matrix.lifePath].map(n => n > 9 ? reduceTo22(n % 9 === 0 ? 9 : n % 9) : n);
  const presentNums  = new Set(allNums);
  const karmicLessons= [1,2,3,4,5,6,7,8,9].filter(n => !presentNums.has(n));

  const energyMap = [
    { id:'center', key:'center', arrow:'balanced', symbol:'◆' },
    { id:'top', key:'top', arrow:'outgoing', symbol:'▲' },
    { id:'bottom', key:'bottom', arrow:'incoming', symbol:'▼' },
    { id:'left', key:'left', arrow:'left', symbol:'◀' },
    { id:'right', key:'right', arrow:'right', symbol:'▶' },
  ];
  const readAxes = tm('read.axes', { returnObjects: true }) as Array<{ key: string; label: string; copy: string }>;
  const readLifeAreas = tm('read.lifeAreas', { returnObjects: true }) as Array<{ key: string; title: string; body: string }>;
  const readCoreReading = tm('read.coreReading', { returnObjects: true }) as Array<{ key: string; title: string }>;
  const deepAncestorItems = tm('deep.ancestorItems', { returnObjects: true }) as Array<{ key: string; title: string; desc: string }>;
  const deepLifePathRows = tm('deep.lifePathRows', { returnObjects: true }) as Array<{ key: string; label: string; desc: string }>;
  const deepRelationshipRows = tm('deep.relationshipRows', { returnObjects: true }) as Array<{ key: string; label: string; desc: string }>;
  const deepMoneyRows = tm('deep.moneyRows', { returnObjects: true }) as Array<{ key: string; title: string; desc: string; practice?: string; practiceType?: string }>;
  const deepMissionRows = tm('deep.missionRows', { returnObjects: true }) as Array<{ key: string; label: string; desc: string }>;
  const deepAiRows = tm('deep.aiRows', { returnObjects: true }) as Array<{ key: string; title: string; copy: string }>;
  const practiceMeditationRows = tm('practice.meditationRows', { returnObjects: true }) as Array<{ num: string; title: string; body: string }>;
  const practiceTipsRows = tm('practice.tipsRows', { returnObjects: true }) as Array<{ key: string; title: string; desc: string }>;
  const practiceGuideSteps = tm('practice.guideSteps', { returnObjects: true }) as string[];
  const practiceNextRows = tm('practice.nextRows', { returnObjects: true }) as Array<{ key: string; label: string; desc: string }>;
  const dailyQuickRows = tm('daily.quickRows', { returnObjects: true }) as Array<{ key: string; label: string; desc: string }>;

  const today       = new Date();
  const dayOfYear   = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const activePosI  = dayOfYear % 9;
  const dailyKey    = POS_MATRIX_KEYS[activePosI];
  const dailyEnergy = dailyKey ? matrix[dailyKey] : matrix.center;
  const dailyName   = matrixPositions[activePosI]?.name ?? tm('positions.9.name');
  const dailyDateStr= today.toLocaleDateString(getLocaleCode(), { day:'numeric', month:'long' });

  const soulCompat = {
    type: tm(`soulCompatibility.${matrix.center}.type`, { defaultValue: tm('soulCompatibility.9.type') }),
    attracts: tm(`soulCompatibility.${matrix.center}.attracts`, { defaultValue: tm('soulCompatibility.9.attracts') }),
    tension: tm(`soulCompatibility.${matrix.center}.tension`, { defaultValue: tm('soulCompatibility.9.tension') }),
    gift: tm(`soulCompatibility.${matrix.center}.gift`, { defaultValue: tm('soulCompatibility.9.gift') }),
  };

  const decadeBreakdown = birthYear ? (() => {
    const result = [];
    for (const [start, end] of [[0,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79]]) {
      if (birthYear + start > currentYear + 20) break;
      const energy    = reduceTo22(matrix.lifePath + Math.floor(start / 10) + 1);
      const isPast    = currentAge > end;
      const isCurrent = currentAge >= start && currentAge <= end;
      result.push({ start, end, startYear: birthYear + start, endYear: birthYear + end, energy, isPast, isCurrent });
    }
    return result;
  })() : [];

  const matrixAiPrompts = (tm('practice.aiPrompts', { returnObjects: true }) as Array<{ key: string; title: string; copy: string; context: string }>).map(item => ({
    ...item,
    copy: t(item.copy, { ns: 'matrix', center: matrix.center, relationship: matrix.relationship, money: matrix.money, bottom: matrix.bottom, top: matrix.top, left: matrix.left, right: matrix.right, lifePath: matrix.lifePath, defaultValue: item.copy }),
    context: t(item.context, { ns: 'matrix', center: matrix.center, relationship: matrix.relationship, money: matrix.money, bottom: matrix.bottom, top: matrix.top, left: matrix.left, right: matrix.right, lifePath: matrix.lifePath, defaultValue: item.context }),
  }));

  // ─── TAB: HERO (MAPA) ────────────────────────────────────────────────────

  const renderTabHero = () => (
    <View>
      <MatrixOrb3D accent={accent} />

      <Animated.View entering={FadeInDown.duration(900)} style={{ marginBottom: 10 }}>
        <Typography variant="heroTitle">{forSomeone ? tm('hero.titleOther', { name: forSomeoneName }) : tm('hero.titleOwn')}</Typography>
        <Typography variant="bodySmall" style={[styles.heroCopy, { color: subColor }]}>
          {tm('hero.description')}
        </Typography>
      </Animated.View>

      <View style={[styles.metricsStrip, { backgroundColor: cardBg, borderColor: accent + '33' }]}>
        <Typography variant="premiumLabel" color={accent} style={{ marginBottom: 12 }}>{tm('hero.mainEnergies')}</Typography>
        <View style={{ flexDirection: 'row' }}>
          {[{label:tc('labels.center'),value:matrix.center},{label:tc('labels.relationships'),value:matrix.relationship},{label:tc('labels.agency'),value:matrix.money},{label:tc('labels.lesson'),value:matrix.bottom}].map((item, idx, arr) => (
            <View key={item.label} style={[styles.metricCell, idx < arr.length - 1 && { borderRightWidth:1, borderRightColor:dividerColor }]}>
              <Typography variant="microLabel" color={accent}>{item.label}</Typography>
              <Text style={[styles.metricValue, { color: textColor }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      <Animated.View entering={FadeInUp.delay(120).duration(700)} style={styles.chartSection}>
        <Typography variant="premiumLabel" color={accent} style={[styles.sectionLabel, { marginBottom: 8 }]}>
          {tm('hero.chartTitle')}
        </Typography>
        <MatrixChart energies={matrix} />
        <View style={{ marginTop: 14, gap: 6 }}>
          {[
            { key:'center', label:tm('hero.chartNodes.center'), color:'#CEAE72', val:matrix.center },
            { key:'top',    label:tm('hero.chartNodes.top'), color:'#A78BFA', val:matrix.top },
            { key:'bottom', label:tm('hero.chartNodes.bottom'), color:'#F472B6', val:matrix.bottom },
            { key:'left',   label:tm('hero.chartNodes.left'), color:'#A78BFA', val:matrix.left },
            { key:'right',  label:tm('hero.chartNodes.right'), color:'#60A5FA', val:matrix.right },
          ].map(node => (
            <Pressable key={node.key}
              onPress={() => setTappedNode(tappedNode === node.key ? null : node.key)}
              style={{ flexDirection:'row', alignItems:'center', gap:10, paddingVertical:8, paddingHorizontal:12,
                borderRadius:12, backgroundColor: tappedNode === node.key ? node.color+'1A' : cardBg,
                borderWidth:1, borderColor: tappedNode === node.key ? node.color+'55' : dividerColor }}>
              <View style={{ width:32, height:32, borderRadius:16, backgroundColor:node.color+'22', borderWidth:1.5,
                borderColor:node.color, alignItems:'center', justifyContent:'center' }}>
                <Text style={{ fontSize:15, fontWeight:'900', color:node.color }}>{node.val}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize:12, fontWeight:'700', color:node.color, letterSpacing:0.3 }}>{node.label}</Text>
                {tappedNode === node.key && (
                  <Text style={{ fontSize:12, color:subColor, lineHeight:18, marginTop:3 }}>{getEnergyMeaning(node.val)}</Text>
                )}
              </View>
              <ChevronRight color={node.color} size={13} strokeWidth={2}
                style={{ transform:[{ rotate: tappedNode === node.key ? '90deg' : '0deg' }] }} />
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Personal year */}
      {(() => {
        const archetype = tm(`yearArchetypes.${personalYear}`, { defaultValue: tm('yearArchetypes.10') });
        const guidance  = tm(`yearGuidance.${personalYear}`, { defaultValue: tm('yearGuidance.10') });
        const PhIcon    = personalYear <= 4 ? TrendingUp : personalYear <= 7 ? Brain : Zap;
        return (
          <Animated.View entering={FadeInDown.delay(60).duration(700)} style={{ marginBottom: 20 }}>
            <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('hero.personalYearTitle', { year: currentYear })}</Typography>
            <View style={[styles.yearEnergyCard, { backgroundColor: cardBg, borderColor: accent+'44' }]}>
              <LinearGradient colors={[accent+'18','transparent']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
              <View style={styles.yearEnergyHeader}>
                <View style={[styles.yearEnergyBadge, { backgroundColor:accent+'20', borderColor:accent+'55' }]}>
                  <Text style={{ fontSize:30, fontWeight:'900', color:accent }}>{personalYear}</Text>
                </View>
                <View style={{ flex:1, marginLeft:14 }}>
                  <Typography variant="microLabel" color={accent}>{tm('hero.personalYearEyebrow')}</Typography>
                  <Typography variant="cardTitle" style={{ color:textColor, marginTop:4 }}>{tm(`yearDisplayNames.${personalYear}`, { defaultValue: tm('yearDisplayNames.10') })}</Typography>
                  <View style={{ flexDirection:'row', gap:6, marginTop:6 }}>
                    <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:accent+'14', borderRadius:8, paddingHorizontal:8, paddingVertical:3 }}>
                      <PhIcon color={accent} size={10} strokeWidth={2} />
                      <Text style={{ fontSize:10, fontWeight:'700', color:accent }}>
                        {personalYear <= 4 ? tm('hero.badges.growth') : personalYear <= 7 ? tm('hero.badges.reflection') : tm('hero.badges.agency')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ height:StyleSheet.hairlineWidth, backgroundColor:accent+'22', marginVertical:12 }} />
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22 }}>{guidance}</Typography>
            </View>
          </Animated.View>
        );
      })()}

      {/* Daily forecast */}
      <Animated.View entering={FadeInDown.delay(80).duration(700)} style={{ marginBottom: 20 }}>
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('hero.forecastTitle', { date: dailyDateStr })}</Typography>
        <View style={[styles.forecastCard, { backgroundColor:cardBg, borderColor:accent+'44' }]}>
          <LinearGradient colors={[accent+'14','transparent']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12, gap:12 }}>
            <View style={[styles.yearEnergyBadge, { width:52, height:52, borderRadius:26, backgroundColor:accent+'20', borderColor:accent+'55' }]}>
              <Text style={{ fontSize:24, fontWeight:'900', color:accent }}>{dailyEnergy}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Typography variant="microLabel" color={accent}>{tm('hero.forecastEyebrow')}</Typography>
              <Typography variant="cardTitle" style={{ color:textColor, marginTop:3 }}>{dailyName}</Typography>
              <View style={{ flexDirection:'row', gap:6, marginTop:5 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:accent+'14', borderRadius:8, paddingHorizontal:8, paddingVertical:3 }}>
                  <Clock color={accent} size={10} strokeWidth={2} />
                  <Text style={{ fontSize:10, fontWeight:'700', color:accent }}>{tm('hero.forecastBadge')}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={{ height:StyleSheet.hairlineWidth, backgroundColor:accent+'22', marginBottom:12 }} />
          <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22 }}>{getEnergyMeaning(dailyEnergy)}</Typography>
          <View style={{ borderLeftWidth:2, borderLeftColor:accent+'55', paddingLeft:10, marginTop:10 }}>
            <Typography variant="bodySmall" style={{ color:textColor, lineHeight:20, fontStyle:'italic' }}>
              {tm('hero.forecastIntention', { name: dailyName.toLowerCase() })}
            </Typography>
          </View>
        </View>
      </Animated.View>

      {/* Affirmation of the day */}
      <Animated.View entering={FadeInDown.delay(100).duration(700)} style={{ marginBottom: 20 }}>
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('hero.affirmationTitle')}</Typography>
        <View style={[styles.forecastCard, { backgroundColor:cardBg, borderColor:accent+'44' }]}>
          <LinearGradient colors={[accent+'18','transparent']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
          <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.8, marginBottom:10 }}>
            {tm('hero.affirmationEyebrow', { value: matrix.center, type: soulCompat.type.toUpperCase() })}
          </Text>
          <Text style={{ fontSize:16, color:textColor, fontStyle:'italic', lineHeight:26, fontWeight:'600', letterSpacing:0.2 }}>
            "{tm(`affirmations.${matrix.center}`, { defaultValue: tm('affirmations.1') })}"
          </Text>
          <View style={{ borderTopWidth:StyleSheet.hairlineWidth, borderTopColor:accent+'33', marginTop:12, paddingTop:10 }}>
            <Text style={{ fontSize:11, color:subColor, lineHeight:17 }}>
              {soulCompat.gift}
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );

  // ─── TAB: ODCZYT ─────────────────────────────────────────────────────────

  const renderTabRead = () => (
    <View>
      <View style={[styles.summaryStrip, { borderTopColor:dividerColor, borderBottomColor:dividerColor, marginBottom:20 }]}>
        {((tm('read.summary', { returnObjects: true }) as string[]).map((label, index) => [label, [matrix.center, matrix.relationship, matrix.money, matrix.bottom][index]])).map(([label,value], idx, arr) => (
          <View key={label} style={[styles.summaryMetricCell, idx<arr.length-1 && {borderRightWidth:1, borderRightColor:dividerColor}]}>
            <Typography variant="microLabel" color={accent}>{label}</Typography>
            <Text style={[styles.metricValue, { color:textColor, marginTop:6 }]}>{value}</Text>
          </View>
        ))}
      </View>

      <AccordionSection title={tm('read.axesTitle')} icon={Compass} accent={accent} textColor={textColor} dividerColor={dividerColor} defaultOpen>
        <View style={{ gap:2, marginTop:10 }}>
          {readAxes.map((item,idx,arr) => (
            <View key={item.label}>
              <View style={styles.axisRow}>
                <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'44' }]}>
                  <Text style={[styles.axisValueText, { color:accent }]}>{item.key === 'core' ? matrix.center : item.key === 'relationships' ? matrix.relationship : matrix.money}</Text>
                </View>
                <View style={{ flex:1, marginLeft:14 }}>
                  <Typography variant="microLabel" color={accent}>{item.label}</Typography>
                  <Typography variant="bodySmall" style={{ marginTop:3, color:subColor, lineHeight:20 }}>{item.copy}</Typography>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={[styles.divider, { backgroundColor:dividerColor }]} />}
            </View>
          ))}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.positionsTitle')} icon={Layers} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          {matrixPositions.map((pos, i) => {
            const matKey   = POS_MATRIX_KEYS[i];
            const eVal     = matKey ? matrix[matKey] : null;
            const PosIcon  = pos.icon;
            return (
              <View key={pos.pos} style={[styles.posCard, { borderColor:accent+'44', overflow:'hidden', shadowColor:accent, shadowOpacity:0.18, shadowRadius:10, shadowOffset:{width:0,height:3}, elevation:5 }]}>
                <LinearGradient colors={[accent+'1E','transparent',accent+'08']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['transparent',accent+'77','transparent']} start={{x:0,y:0}} end={{x:1,y:0}} style={{ position:'absolute', top:0, left:0, right:0, height:1 }} />
                <View style={[styles.posNum, { backgroundColor:accent+'22', borderColor:accent+'44' }]}>
                  <PosIcon color={accent} size={16} strokeWidth={1.8} />
                </View>
                <View style={{ flex:1 }}>
                  <Text style={[styles.posName, { color:accent }]}>{pos.name}</Text>
                  <Text style={[styles.posDesc, { color:isLight?'rgba(0,0,0,0.68)':'rgba(255,255,255,0.72)' }]}>{pos.desc}</Text>
                </View>
                {eVal != null && (
                  <View style={[styles.energyBadge, { backgroundColor:accent+'22', borderColor:accent+'44' }]}>
                    <Text style={[styles.energyBadgeText, { color:accent }]}>{eVal}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.energyMapTitle')} icon={Compass} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          {energyMap.map(em => (
            <View key={em.id} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:10 }}>
                <View style={[styles.crossDirBadge, { backgroundColor:accent+'20', borderColor:accent+'44' }]}>
                  <Text style={[styles.crossDirSymbol, { color:accent }]}>{em.symbol}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Typography variant="microLabel" color={accent}>{tm(`read.energyMap.${em.id}.dir`).toUpperCase()}</Typography>
                  <Text style={{ fontSize:22, fontWeight:'900', color:textColor, marginTop:1 }}>{matrix[em.key]}</Text>
                </View>
                <EnergyDirBadge dir={em.arrow} accent={accent} label={tm(`directionBadges.${em.arrow}`, { defaultValue: em.arrow })} />
              </View>
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{tm(`read.energyMap.${em.id}.desc`)}</Typography>
              <Typography variant="bodySmall" style={{ color:textColor, lineHeight:20, marginTop:6, fontStyle:'italic' }}>{getEnergyMeaning(matrix[em.key])}</Typography>
            </View>
          ))}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.lifeAreasTitle')} icon={Target} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:2, marginTop:10 }}>
          {readLifeAreas.map(item => {
            const value = item.key === 'love' ? matrix.relationship : item.key === 'work' ? matrix.money : matrix.center;
            const icon = item.key === 'love' ? Heart : item.key === 'work' ? Orbit : ScrollText;
            const AIcon = icon;
            return (
              <View key={item.key} style={{ marginBottom:16 }}>
                <View style={[styles.insightRow, { borderBottomColor:dividerColor }]}>
                  <AIcon color={accent} size={18} />
                  <Typography variant="premiumLabel" color={accent} style={{ marginLeft:10 }}>{item.title}</Typography>
                </View>
                <Typography variant="bodySmall" style={[styles.insightBody, { color:subColor }]}>{t(item.body, { ns: 'matrix', value, defaultValue: item.body })}</Typography>
              </View>
            );
          })}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.coreReadingTitle')} icon={Hexagon} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:2, marginTop:10 }}>
          {readCoreReading.map(item => {
            const energy = item.key === 'comfort' ? matrix.center : item.key === 'power' ? matrix.top : item.key === 'lesson' ? matrix.bottom : matrix.relationship;
            const Icon = item.key === 'comfort' ? Hexagon : item.key === 'power' ? Zap : item.key === 'lesson' ? Shield : Heart;
            return (
              <View key={item.key} style={{ marginBottom:18 }}>
                <View style={[styles.insightRow, { borderBottomColor:dividerColor }]}>
                  <Icon color={accent} size={18} />
                  <Typography variant="premiumLabel" color={accent} style={{ marginLeft:10 }}>{t(item.title, { ns: 'matrix', value: energy, defaultValue: item.title })}</Typography>
                </View>
                <Typography variant="bodySmall" style={[styles.insightBody, { color:subColor }]}>{getEnergyMeaning(energy)}</Typography>
              </View>
            );
          })}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.karmicTitle', { count: karmicLessons.length })} icon={AlertCircle} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ marginTop:10 }}>
          {karmicLessons.length === 0 ? (
            <View style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A', flexDirection:'row', alignItems:'center', gap:10 }]}>
              <CheckCircle color={accent} size={20} strokeWidth={1.8} />
              <Typography variant="bodySmall" style={{ color:subColor, flex:1, lineHeight:21 }}>{tm('read.karmicNone')}</Typography>
            </View>
          ) : (
            <View style={{ gap:8 }}>
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:4 }}>{tm('read.karmicIntro')}</Typography>
              {karmicLessons.map(n => (
                <View key={n} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
                  <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:10 }}>
                    <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'44', width:36, height:36, borderRadius:18 }]}>
                      <Text style={{ fontSize:16, fontWeight:'900', color:accent }}>{n}</Text>
                    </View>
                    <Typography variant="microLabel" color={accent}>{tm('read.karmicEyebrow')}</Typography>
                  </View>
                  <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{tm(`karmicLessons.${n}`)}</Typography>
                </View>
              ))}
            </View>
          )}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('read.compatibilityTitle', { type: soulCompat.type })} icon={Users} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          <View style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
            <View style={{ flexDirection:'row', alignItems:'center', marginBottom:10, gap:10 }}>
              <View style={[styles.axisValueBadge, { backgroundColor:accent+'20', borderColor:accent+'55', width:42, height:42, borderRadius:21 }]}>
                <Text style={{ fontSize:18, fontWeight:'900', color:accent }}>{matrix.center}</Text>
              </View>
              <View>
                <Typography variant="microLabel" color={accent}>{tm('read.compatibilitySoulType')}</Typography>
                <Text style={{ fontSize:15, fontWeight:'800', color:textColor, marginTop:2 }}>{soulCompat.type}</Text>
              </View>
            </View>
            {[
              { icon: Heart, label: tm('read.compatibilityRows.0.label'), text: soulCompat.attracts, color: '#34D399' },
              { icon: Shield, label: tm('read.compatibilityRows.1.label'), text: soulCompat.tension, color: '#F87171' },
              { icon: Sparkles, label: tm('read.compatibilityRows.2.label'), text: soulCompat.gift, color: accent },
            ].map(row => (
              <View key={row.label} style={{ marginBottom:10 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:4 }}>
                  <row.icon color={row.color} size={12} strokeWidth={2} />
                  <Text style={{ fontSize:10, fontWeight:'700', color:row.color, letterSpacing:0.5 }}>{row.label.toUpperCase()}</Text>
                </View>
                <Typography variant="bodySmall" style={{ color:subColor, lineHeight:20 }}>{row.text}</Typography>
              </View>
            ))}
          </View>
          <View style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'22', alignItems:'center' }]}>
            <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, textAlign:'center', marginBottom:12 }}>
              {forSomeone && forSomeoneBirth.trim() ? tm('read.compatibilityActiveBanner') : tm('read.compatibilityInactiveBanner')}
            </Typography>
            <Pressable style={[styles.meditationCta, { borderColor:accent+'44', backgroundColor:accent+'10' }]} onPress={() => setShowForSomeoneModal(true)}>
              <Users color={accent} size={16} strokeWidth={1.8} />
              <Typography variant="premiumLabel" color={accent} style={{ marginLeft:8 }}>{forSomeone ? tm('read.compatibilityChange', { name: forSomeoneName }) : tm('read.compatibilityAdd')}</Typography>
            </Pressable>
          </View>
        </View>
      </AccordionSection>
    </View>
  );

  // ─── TAB: GŁĘBIEJ ────────────────────────────────────────────────────────

  const renderTabDeep = () => (
    <View>
      <AccordionSection title={tm('deep.ancestorTitle')} icon={TreePine} accent={accent} textColor={textColor} dividerColor={dividerColor} defaultOpen>
        <View style={{ gap:8, marginTop:10 }}>
          <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:4 }}>{tm('deep.ancestorIntro')}</Typography>
          {deepAncestorItems.map((ap, idx) => {
            const energy = ap.key === 'father' ? matrix.right : ap.key === 'mother' ? matrix.left : ap.key === 'family' ? matrix.bottom : matrix.center;
            return (
            <Animated.View key={ap.key} entering={FadeInDown.delay(60 + idx * 50).duration(600)}>
              <View style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
                <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
                  <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'44', width:36, height:36, borderRadius:18 }]}>
                    <Text style={{ fontSize:16, fontWeight:'900', color:accent }}>{energy}</Text>
                  </View>
                  <Typography variant="microLabel" color={accent} style={{ marginLeft:10 }}>{ap.title.toUpperCase()}</Typography>
                </View>
                <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{t(ap.desc, { ns: 'matrix', value: energy, defaultValue: ap.desc })}</Typography>
              </View>
            </Animated.View>
          )})}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('deep.decadesTitle')} icon={GitBranch} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:4 }}>{tm('deep.decadesIntro')}</Typography>
          {decadeBreakdown.map(d => (
            <View key={d.start} style={[styles.ancestralCard, { backgroundColor:d.isCurrent?accent+'14':cardBg, borderColor:d.isCurrent?accent+'66':accent+'22', borderWidth:d.isCurrent?1.5:1, overflow:'hidden' }]}>
              {d.isCurrent && <LinearGradient colors={[accent+'20','transparent']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />}
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                <View style={[styles.axisValueBadge, { width:44, height:44, borderRadius:22, backgroundColor:accent+(d.isCurrent?'28':'16'), borderColor:accent+(d.isCurrent?'66':'33') }]}>
                  <Text style={{ fontSize:18, fontWeight:'900', color:accent }}>{d.energy}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <View style={{ flexDirection:'row', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                    <Typography variant="microLabel" color={accent}>{tm('deep.ageRange', { start: d.start, end: d.end, startYear: d.startYear, endYear: d.endYear })}</Typography>
                    {d.isCurrent && <View style={{ backgroundColor:accent, borderRadius:6, paddingHorizontal:6, paddingVertical:2 }}><Text style={{ fontSize:8, fontWeight:'800', color:'#fff' }}>{tc('status.now')}</Text></View>}
                    {d.isPast && !d.isCurrent && <View style={{ backgroundColor:subColor+'33', borderRadius:6, paddingHorizontal:6, paddingVertical:2 }}><Text style={{ fontSize:8, fontWeight:'700', color:subColor }}>{tm('deep.past')}</Text></View>}
                  </View>
                </View>
              </View>
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:20 }}>{tm(`decadeThemes.${d.energy}`, { defaultValue: tm('decadeThemes.10') })}</Typography>
              {d.isCurrent && (
                <View style={{ borderLeftWidth:2, borderLeftColor:accent+'55', paddingLeft:10, marginTop:8 }}>
                  <Typography variant="bodySmall" style={{ color:textColor, lineHeight:20, fontStyle:'italic' }}>{tm('deep.energyPrefix')} {d.energy}: {getEnergyMeaning(d.energy)}</Typography>
                </View>
              )}
            </View>
          ))}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('deep.lifePathTitle')} icon={Orbit} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          <View style={[styles.lifePathBadgeRow, { borderColor:accent+'33', backgroundColor:cardBg }]}>
            <View style={[styles.yearEnergyBadge, { backgroundColor:accent+'18', borderColor:accent+'44', width:52, height:52, borderRadius:26 }]}>
              <Text style={{ fontSize:26, fontWeight:'900', color:accent }}>{matrix.lifePath}</Text>
            </View>
            <View style={{ flex:1, marginLeft:14 }}>
              <Typography variant="microLabel" color={accent}>{tm('deep.lifePathEyebrow')}</Typography>
              <Typography variant="bodySmall" style={{ color:subColor, marginTop:4, lineHeight:20 }}>{getEnergyMeaning(matrix.lifePath)}</Typography>
            </View>
          </View>
          {deepLifePathRows.map(s => {
            const val2 = s.key === 'center' ? matrix.center : s.key === 'lesson' ? matrix.bottom : matrix.relationship;
            const interaction = reduceTo22(matrix.lifePath + val2);
            return (
            <View key={s.key} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:8 }}>
                <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'33', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{matrix.lifePath}</Text></View>
                <Text style={{ color:subColor, fontSize:12 }}>+</Text>
                <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'33', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{val2}</Text></View>
                <Text style={{ color:subColor, fontSize:12 }}>=</Text>
                <View style={[styles.axisValueBadge, { backgroundColor:accent+'30', borderColor:accent+'66', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{interaction}</Text></View>
                <Typography variant="microLabel" color={accent} style={{ flex:1, marginLeft:4 }}>{s.label.toUpperCase()}</Typography>
              </View>
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{t(s.desc, { ns: 'matrix', lifePath: matrix.lifePath, center: matrix.center, bottom: matrix.bottom, relationship: matrix.relationship, interaction, defaultValue: s.desc })}</Typography>
            </View>
          )})}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('deep.timelineTitle')} icon={Clock} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ marginTop:10 }}>
          <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:12 }}>{tm('deep.timelineIntro')}</Typography>
          {birthYear && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal:-layout.padding.screen }} contentContainerStyle={{ paddingHorizontal:layout.padding.screen, gap:10 }}>
              {[-2,-1,0,1,2].map(offset => {
                const age       = currentAge + offset;
                const year      = currentYear + offset;
                const activI    = ((age - 1) % 9 + 9) % 9;
                const mKey      = POS_MATRIX_KEYS[activI];
                const eVal      = mKey ? matrix[mKey] : matrix.center;
                const pName     = matrixPositions[activI]?.name ?? tm('positions.9.name');
                const isCurrent = offset === 0;
                return (
                  <View key={year} style={[styles.timelineCard, { backgroundColor:isCurrent?accent+'20':cardBg, borderColor:isCurrent?accent+'88':accent+'22' }]}>
                    {isCurrent && <LinearGradient colors={[accent+'33','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFill} />}
                    <Typography variant="microLabel" color={isCurrent?accent:subColor} style={{ opacity:isCurrent?1:0.7 }}>{year}</Typography>
                    <Text style={{ fontSize:11, color:subColor, marginTop:2, opacity:0.7 }}>{tm('deep.timelineAge', { age })}</Text>
                    <View style={[styles.axisValueBadge, { backgroundColor:accent+(isCurrent?'30':'14'), borderColor:accent+(isCurrent?'66':'33'), width:40, height:40, borderRadius:20, marginVertical:8 }]}>
                      <Text style={{ fontSize:18, fontWeight:'900', color:accent }}>{eVal}</Text>
                    </View>
                    <Typography variant="microLabel" color={accent} style={{ fontSize:9, textAlign:'center' }}>{pName.toUpperCase()}</Typography>
                    {isCurrent && <View style={[styles.timelineNowBadge, { backgroundColor:accent }]}><Text style={{ fontSize:8, fontWeight:'800', color:'#fff' }}>{tc('status.now')}</Text></View>}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </AccordionSection>

      {/* Relational matrix */}
      {(() => {
        const hasPartner = forSomeone && forSomeoneBirth.trim() && matrix;
        if (!hasPartner) return (
          <AccordionSection title={tm('deep.relationshipInactiveTitle')} icon={Heart} accent={accent} textColor={textColor} dividerColor={dividerColor}>
            <View style={{ marginTop:10 }}>
              <View style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'22', alignItems:'center' }]}>
                <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, textAlign:'center', marginBottom:12 }}>{tm('deep.relationshipInactiveBody')}</Typography>
                <Pressable style={[styles.meditationCta, { borderColor:accent+'44', backgroundColor:accent+'10' }]} onPress={() => setShowForSomeoneModal(true)}>
                  <Users color={accent} size={16} strokeWidth={1.8} />
                  <Typography variant="premiumLabel" color={accent} style={{ marginLeft:8 }}>{tm('read.compatibilityAdd')}</Typography>
                </Pressable>
              </View>
            </View>
          </AccordionSection>
        );
        const otherMatrix = calculateMatrix(forSomeoneBirth.trim());
        const relSynergy  = reduceTo22(matrix.center + otherMatrix.center);
        const relTension  = reduceTo22(matrix.bottom + otherMatrix.bottom);
        const relFlow     = reduceTo22(matrix.relationship + otherMatrix.relationship);
        return (
          <AccordionSection title={tm('deep.relationshipActiveTitle', { name: forSomeoneName })} icon={Heart} accent={accent} textColor={textColor} dividerColor={dividerColor} defaultOpen>
            <View style={{ gap:8, marginTop:10 }}>
              <View style={[styles.ancestralCard, { backgroundColor:accent+'10', borderColor:accent+'44', flexDirection:'row', alignItems:'center', gap:12 }]}>
                <View style={[styles.axisValueBadge, { backgroundColor:accent+'22', borderColor:accent+'55', width:46, height:46, borderRadius:23 }]}>
                  <Text style={{ fontSize:20, fontWeight:'900', color:accent }}>{otherMatrix.center}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Typography variant="microLabel" color={accent}>{tm('deep.relationshipCenterTitle', { name: forSomeoneName.toUpperCase() })}</Typography>
                  <Typography variant="bodySmall" style={{ color:subColor, lineHeight:20, marginTop:3 }}>{tm('deep.relationshipCenterMeta', { lifePath: otherMatrix.lifePath, relationship: otherMatrix.relationship, bottom: otherMatrix.bottom })}</Typography>
                </View>
              </View>
              {deepRelationshipRows.map(c => {
                const a = c.key === 'synergy' ? matrix.center : c.key === 'tension' ? matrix.bottom : matrix.relationship;
                const b = c.key === 'synergy' ? otherMatrix.center : c.key === 'tension' ? otherMatrix.bottom : otherMatrix.relationship;
                const result = c.key === 'synergy' ? relSynergy : c.key === 'tension' ? relTension : relFlow;
                return (
                <View key={c.key} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
                  <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8, gap:8 }}>
                    <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'33', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{a}</Text></View>
                    <Text style={{ color:subColor, fontSize:12 }}>+</Text>
                    <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'33', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{b}</Text></View>
                    <Text style={{ color:subColor, fontSize:12 }}>=</Text>
                    <View style={[styles.axisValueBadge, { backgroundColor:accent+'30', borderColor:accent+'66', width:32, height:32, borderRadius:16 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{result}</Text></View>
                    <Typography variant="microLabel" color={accent} style={{ flex:1, marginLeft:4 }}>{c.label.toUpperCase()}</Typography>
                  </View>
                  <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{t(c.desc, { ns: 'matrix', a, b, result, defaultValue: c.desc })}</Typography>
                </View>
              )})}
            </View>
          </AccordionSection>
        );
      })()}

      <AccordionSection title={tm('deep.moneyTitle')} icon={Coins} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          {deepMoneyRows.map(mp => {
            const energy = mp.key === 'main' ? matrix.money : mp.key === 'karma' ? matrix.center : mp.key === 'block' ? matrix.bottom : matrix.right;
            const MIcon = mp.key === 'main' ? Coins : mp.key === 'karma' ? Orbit : mp.key === 'block' ? Shield : Zap;
            const practice = mp.practiceType === 'meaning' ? getEnergyMeaning(energy) : t(mp.practice || '', { ns: 'matrix', value: energy, defaultValue: mp.practice || '' });
            return (
              <View key={mp.key} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:accent+'2A' }]}>
                <View style={{ flexDirection:'row', alignItems:'center', marginBottom:8 }}>
                  <View style={[styles.navRowIcon, { backgroundColor:accent+'18' }]}><MIcon color={accent} size={15} strokeWidth={1.8} /></View>
                  <View style={[styles.axisValueBadge, { backgroundColor:accent+'18', borderColor:accent+'33', width:32, height:32, borderRadius:16, marginLeft:8 }]}><Text style={{ fontSize:13, fontWeight:'900', color:accent }}>{energy}</Text></View>
                  <Typography variant="microLabel" color={accent} style={{ marginLeft:8, flex:1 }}>{mp.title.toUpperCase()}</Typography>
                </View>
                <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21, marginBottom:8 }}>{t(mp.desc, { ns: 'matrix', value: energy, defaultValue: mp.desc })}</Typography>
                <View style={{ borderLeftWidth:2, borderLeftColor:accent+'55', paddingLeft:10 }}>
                  <Typography variant="bodySmall" style={{ color:textColor, lineHeight:20, fontStyle:'italic' }}>{practice}</Typography>
                </View>
              </View>
            );
          })}
        </View>
      </AccordionSection>

      <AccordionSection title={tm('deep.missionTitle')} icon={Target} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:8, marginTop:10 }}>
          <Typography variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:4 }}>{tm('deep.missionIntro')}</Typography>
          {deepMissionRows.map(item => {
            const energy = item.key === 'comfort' ? matrix.center : item.key === 'calling' ? matrix.top : reduceTo22(matrix.top + matrix.center);
            const icon = item.key === 'comfort' ? CheckCircle : item.key === 'calling' ? TrendingUp : ArrowUp;
            const color = item.key === 'comfort' ? '#34D399' : item.key === 'calling' ? accent : '#F59E0B';
            return (
            <View key={item.key} style={[styles.ancestralCard, { backgroundColor:cardBg, borderColor:color+'33' }]}>
              <View style={{ flexDirection:'row', alignItems:'center', gap:10, marginBottom:8 }}>
                <icon color={color} size={18} strokeWidth={1.8} />
                <View style={[styles.axisValueBadge, { backgroundColor:color+'18', borderColor:color+'44', width:36, height:36, borderRadius:18 }]}>
                  <Text style={{ fontSize:16, fontWeight:'900', color:color }}>{energy}</Text>
                </View>
                <Typography variant="microLabel" color={color}>{item.label.toUpperCase()}</Typography>
              </View>
              <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{t(item.desc, { ns: 'matrix', value: energy, meaning: getEnergyMeaning(energy), defaultValue: item.desc })}</Typography>
            </View>
          )})}
        </View>
      </AccordionSection>

      {aiAvailable && (
        <Animated.View entering={FadeInDown.delay(60).duration(700)} style={{ marginBottom:20 }}>
          <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('deep.aiTitle')}</Typography>
          <View style={{ gap:2 }}>
            {deepAiRows.map(item => (
              <Pressable key={item.key} style={({ pressed }) => [styles.navRow, { backgroundColor:pressed?rowBg:'transparent', borderBottomColor:dividerColor }]} onPress={() => navigation.navigate(ROUTES.journalEntry, {
                type:'matrix',
                prompt: tm(`deep.aiContexts.${item.key}`, {
                  right: matrix.right,
                  left: matrix.left,
                  bottom: matrix.bottom,
                  center: matrix.center,
                  lifePath: matrix.lifePath,
                  money: matrix.money,
                  relationship: matrix.relationship,
                }),
              })}>
                <View style={[styles.navRowIcon, { backgroundColor:accent+'1A' }]}><Sparkles color={accent} size={16} strokeWidth={1.8} /></View>
                <View style={{ flex:1 }}>
                  <Typography variant="label" style={{ color:textColor }}>{item.title}</Typography>
                  <Typography variant="bodySmall" style={{ color:subColor, marginTop:2, lineHeight:18 }}>{item.copy}</Typography>
                </View>
                <ChevronRight color={accent} size={16} opacity={0.6} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      )}
    </View>
  );

  // ─── TAB: PRAKTYKA ───────────────────────────────────────────────────────

  const renderTabPractice = () => (
    <View>
      <Animated.View entering={FadeInDown.delay(40).duration(700)} style={{ marginBottom:20 }}>
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('practice.aiTitle')}</Typography>
        <View style={{ gap:2 }}>
          {matrixAiPrompts.map(item => (
            <Pressable key={item.key} style={({ pressed }) => [styles.navRow, { backgroundColor:pressed?rowBg:'transparent', borderBottomColor:dividerColor }]} onPress={() => navigation.navigate(ROUTES.journalEntry, { type:'matrix', prompt:item.context })}>
              <View style={[styles.navRowIcon, { backgroundColor:accent+'1A' }]}><Sparkles color={accent} size={16} strokeWidth={1.8} /></View>
              <View style={{ flex:1 }}>
                <Typography variant="label" style={{ color:textColor }}>{item.title}</Typography>
                <Typography variant="bodySmall" style={{ color:subColor, marginTop:2, lineHeight:18 }}>{item.copy}</Typography>
              </View>
              <ChevronRight color={accent} size={16} opacity={0.6} />
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <AccordionSection title={tm('practice.meditationTitle')} icon={Brain} accent={accent} textColor={textColor} dividerColor={dividerColor} defaultOpen>
        <View style={{ gap:8, marginTop:10 }}>
          {practiceMeditationRows.map(step => (
            <View key={step.num} style={[styles.meditationStep, { backgroundColor:cardBg, borderColor:accent+'22' }]}>
              <View style={{ flexDirection:'row', alignItems:'flex-start', gap:12 }}>
                <View style={[styles.meditationStepNum, { borderColor:accent+'44', backgroundColor:accent+'14' }]}>
                  <Text style={{ fontSize:12, fontWeight:'800', color:accent }}>{step.num}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Typography variant="microLabel" color={accent} style={{ marginBottom:5 }}>{t(step.title, { ns: 'matrix', center: matrix.center, defaultValue: step.title })}</Typography>
                  <Typography variant="bodySmall" style={{ color:subColor, lineHeight:21 }}>{t(step.body, { ns: 'matrix', center: matrix.center, top: matrix.top, bottom: matrix.bottom, left: matrix.left, right: matrix.right, defaultValue: step.body })}</Typography>
                </View>
              </View>
            </View>
          ))}
          <Pressable style={[styles.meditationCta, { borderColor:accent+'44', backgroundColor:accent+'10' }]} onPress={() => navigation.navigate(ROUTES.meditation)}>
            <Wind color={accent} size={16} strokeWidth={1.8} />
            <Typography variant="premiumLabel" color={accent} style={{ marginLeft:8 }}>{tm('practice.meditationCta')}</Typography>
          </Pressable>
        </View>
      </AccordionSection>

      <AccordionSection title={tm('practice.tipsTitle')} icon={Flame} accent={accent} textColor={textColor} dividerColor={dividerColor}>
        <View style={{ gap:2, marginTop:10 }}>
          {practiceTipsRows.map(tip => {
            const TIcon = tip.key === 'meditation' ? Star : tip.key === 'journal' ? BookOpen : Flame;
            return (
              <View key={tip.title} style={{ marginBottom:16 }}>
                <View style={[styles.insightRow, { borderBottomColor:dividerColor }]}>
                  <TIcon color={accent} size={18} />
                  <Typography variant="premiumLabel" color={accent} style={{ marginLeft:10 }}>{tip.title}</Typography>
                </View>
                <Typography variant="bodySmall" style={[styles.insightBody, { color:subColor }]}>{tip.desc}</Typography>
              </View>
            );
          })}
        </View>
      </AccordionSection>

      <View style={[styles.guideSection, { borderColor:dividerColor }]}>
        <Typography variant="premiumLabel" color={accent} style={{ marginBottom:12 }}>{tm('practice.guideTitle')}</Typography>
        {practiceGuideSteps.map(step => (
          <Typography key={step} variant="bodySmall" style={{ color:subColor, lineHeight:22, marginBottom:8 }}>{step}</Typography>
        ))}
      </View>

      <Pressable
        style={[styles.integrationCta, { borderColor:accent+'55', backgroundColor:accent+'12' }]}
        onPress={() => navigation.navigate(ROUTES.journalEntry, {
          type:'matrix',
          prompt: tm('practice.integrationPrompt', { center: matrix.center, relationship: matrix.relationship, money: matrix.money }),
        })}
      >
        <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
          <Sparkles color={accent} size={18} strokeWidth={1.8} />
          <Typography variant="premiumLabel" color={accent}>{tm('practice.integrationTitle')}</Typography>
        </View>
        <Typography variant="bodySmall" style={{ color:subColor, marginTop:8, lineHeight:22 }}>{tm('practice.integrationBody')}</Typography>
      </Pressable>

      <View style={[styles.divider, { backgroundColor:dividerColor, marginVertical:12 }]} />
      <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('practice.nextTitle')}</Typography>
      <View style={{ gap:2, marginBottom:16 }}>
        {(practiceNextRows.map(item => ({
          ...item,
          icon: item.key === 'note' ? BookOpen : item.key === 'numerology' ? Hash : item.key === 'relationship' ? Heart : item.key === 'partner' ? Users : Share2,
          onPress: item.key === 'note'
            ? () => navigation.navigate(ROUTES.journalEntry, { type:'matrix', prompt: tm('practice.nextPrompt', { center: matrix.center, relationship: matrix.relationship, money: matrix.money }) })
            : item.key === 'numerology'
              ? () => navigation.navigate(ROUTES.numerology)
              : item.key === 'relationship'
                ? () => navigation.navigate(ROUTES.compatibility)
                : item.key === 'partner'
                  ? () => navigation.navigate(ROUTES.partnerMatrix)
                  : handleShare,
        }))).map(item => (
          <Pressable key={item.label} style={({ pressed }) => [styles.navRow, { backgroundColor:pressed?rowBg:'transparent', borderBottomColor:dividerColor }]} onPress={item.onPress}>
            <View style={[styles.navRowIcon, { backgroundColor:accent+'1A' }]}><item.icon color={accent} size={16} strokeWidth={1.8} /></View>
            <View style={{ flex:1 }}>
              <Typography variant="label" style={{ color:textColor }}>{item.label}</Typography>
              <Typography variant="bodySmall" style={{ color:subColor, marginTop:2, lineHeight:18 }}>{item.desc}</Typography>
            </View>
            <ChevronRight color={accent} size={16} opacity={0.6} />
          </Pressable>
        ))}
      </View>
    </View>
  );

  // ─── TAB: DZIENNY ────────────────────────────────────────────────────────

  const renderTabDaily = () => {
    const centerCrystal = {
      name: tm(`dailyCrystal.${matrix.center}.name`, { defaultValue: tm('dailyCrystal.9.name') }),
      color: tm(`dailyCrystal.${matrix.center}.color`, { defaultValue: tm('dailyCrystal.9.color') }),
      use: tm(`dailyCrystal.${matrix.center}.use`, { defaultValue: tm('dailyCrystal.9.use') }),
    };
    const todayAffirm    = tm(`affirmations.${matrix.center}`, { defaultValue: tm('affirmations.1') });
    const todayQuestion  = dailyKey
      ? tm(`dailyQuestions.${dailyKey}`, { defaultValue: tm('dailyQuestions.center') })
      : tm('dailyQuestions.center');
    const yearMantra     = tm(`yearMantras.${personalYear}`, { defaultValue: tm('yearMantras.1') });
    const planetInfo     = {
      name: tm(`planetRulers.${personalYear}.name`, { defaultValue: tm('planetRulers.1.name') }),
      element: tm(`planetRulers.${personalYear}.element`, { defaultValue: tm('planetRulers.1.element') }),
    };
    const yearArchetype  = tm(`yearArchetypes.${personalYear}`, { defaultValue: tm('yearArchetypes.10') });

    return (
      <Animated.View entering={FadeInDown.duration(400)}>

        {/* ── Today's active energy ─────────────────────────────── */}
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('daily.activeTitle')}</Typography>
        <View style={[styles.yearEnergyCard, { backgroundColor: cardBg, borderColor: accent + '44', marginBottom: 16 }]}>
          <LinearGradient colors={[accent + '18', 'transparent']} start={{x:0,y:0}} end={{x:1,y:1}} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:12 }}>
            <View style={[styles.yearEnergyBadge, { backgroundColor:accent+'22', borderColor:accent+'55', width:60, height:60, borderRadius:20 }]}>
              <Text style={{ fontSize:26, fontWeight:'900', color:accent }}>{dailyEnergy}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.5, marginBottom:3 }}>{tm('daily.activeEyebrow', { date: dailyDateStr.toUpperCase() })}</Text>
              <Text style={{ fontSize:16, fontWeight:'800', color:textColor }}>{dailyName}</Text>
              <Text style={{ fontSize:12, color:subColor, marginTop:3, lineHeight:18 }}>{getEnergyMeaning(dailyEnergy)}</Text>
            </View>
          </View>
        </View>

        {/* ── Daily affirmation ─────────────────────────────────── */}
        <View style={{ borderRadius:18, padding:18, marginBottom:16, overflow:'hidden', backgroundColor:cardBg, borderWidth:1, borderColor:accent+'33' }}>
          <LinearGradient colors={[accent+'14','transparent']} style={StyleSheet.absoluteFillObject} />
          <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.8, marginBottom:10 }}>{tm('daily.affirmationEyebrow')}</Text>
          <Text style={{ fontSize:15, color:textColor, lineHeight:25, fontStyle:'italic', fontWeight:'600' }}>"{todayAffirm}"</Text>
        </View>

        {/* ── Supporting crystal ────────────────────────────────── */}
        <View style={{ borderRadius:18, padding:16, marginBottom:16, backgroundColor:cardBg, borderWidth:1, borderColor:centerCrystal.color+'30', flexDirection:'row', alignItems:'center', gap:14 }}>
          <View style={{ width:52, height:52, borderRadius:18, backgroundColor:centerCrystal.color+'22', borderWidth:2, borderColor:centerCrystal.color+'55', alignItems:'center', justifyContent:'center' }}>
            <Hexagon color={centerCrystal.color} size={22} strokeWidth={1.5} />
          </View>
          <View style={{ flex:1 }}>
            <Text style={{ fontSize:9, color:centerCrystal.color, fontWeight:'700', letterSpacing:1.5, marginBottom:3 }}>{tm('daily.crystalEyebrow')}</Text>
            <Text style={{ fontSize:15, fontWeight:'700', color:textColor }}>{centerCrystal.name}</Text>
            <Text style={{ fontSize:12, color:subColor, marginTop:2, lineHeight:18 }}>{centerCrystal.use}</Text>
          </View>
        </View>

        {/* ── Reflection question ───────────────────────────────── */}
        <View style={{ borderRadius:18, padding:16, marginBottom:16, overflow:'hidden', backgroundColor:cardBg, borderWidth:1, borderColor:accent+'25' }}>
          <LinearGradient colors={[accent+'0A','transparent']} style={StyleSheet.absoluteFillObject} />
          <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.5, marginBottom:10 }}>{tm('daily.reflectionEyebrow')}</Text>
          <Text style={{ fontSize:14, color:textColor, lineHeight:22 }}>{todayQuestion}</Text>
          <Pressable
            style={[styles.meditationCta, { borderColor:accent+'44', backgroundColor:accent+'10', marginTop:14 }]}
            onPress={() => navigation.navigate(ROUTES.journalEntry, { type:'matrix', prompt: tm('daily.journalPrompt', { todayQuestion, center: matrix.center, relationship: matrix.relationship, top: matrix.top, bottom: matrix.bottom }) })}
          >
            <BookOpen color={accent} size={14} strokeWidth={1.8} />
            <Typography variant="premiumLabel" color={accent} style={{ marginLeft:8 }}>{tm('daily.journalCta')}</Typography>
          </Pressable>
        </View>

        {/* ── Personal year quick card ──────────────────────────── */}
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('daily.personalYearTitle', { year: currentYear })}</Typography>
        <View style={{ borderRadius:18, padding:16, marginBottom:16, overflow:'hidden', backgroundColor:cardBg, borderWidth:1.5, borderColor:accent+'44' }}>
          <LinearGradient colors={[accent+'18','transparent']} style={StyleSheet.absoluteFillObject} />
          <View style={{ flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 }}>
            <View style={{ width:52, height:52, borderRadius:16, backgroundColor:accent+'22', borderWidth:2, borderColor:accent+'55', alignItems:'center', justifyContent:'center' }}>
              <Text style={{ fontSize:22, fontWeight:'900', color:accent }}>{personalYear}</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.5, marginBottom:3 }}>{tm('daily.yearEyebrow', { archetype: yearArchetype.toUpperCase() })}</Text>
              <Text style={{ fontSize:14, fontWeight:'700', color:textColor }}>{tm('daily.ruler', { name: planetInfo.name })}</Text>
              <Text style={{ fontSize:11, color:subColor, marginTop:2 }}>{tm('daily.element', { element: planetInfo.element })}</Text>
            </View>
          </View>
          <Text style={{ fontSize:12, color:subColor, lineHeight:20, marginBottom:12 }}>{tm(`yearGuidance.${personalYear}`, { defaultValue: tm('yearGuidance.1') })}</Text>
          <View style={{ borderRadius:12, padding:10, backgroundColor:accent+'14', borderWidth:1, borderColor:accent+'33' }}>
            <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.2, marginBottom:5 }}>{tm('daily.mantraEyebrow')}</Text>
            <Text style={{ fontSize:13, color:textColor, fontStyle:'italic', lineHeight:20 }}>"{yearMantra}"</Text>
          </View>
        </View>

        {/* ── Soul compatibility ────────────────────────────────── */}
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('daily.compatibilityTitle')}</Typography>
        <View style={{ borderRadius:18, padding:16, marginBottom:16, backgroundColor:cardBg, borderWidth:1, borderColor:accent+'25' }}>
          <Text style={{ fontSize:9, color:accent, fontWeight:'700', letterSpacing:1.5, marginBottom:6 }}>{tm('daily.compatibilityAttracts')}</Text>
          <Text style={{ fontSize:13, color:textColor, lineHeight:20, marginBottom:12 }}>{soulCompat.attracts}</Text>
          <View style={{ height:1, backgroundColor:dividerColor, marginBottom:12 }} />
          <Text style={{ fontSize:9, color:'#F87171', fontWeight:'700', letterSpacing:1.5, marginBottom:6 }}>{tm('daily.compatibilityTension')}</Text>
          <Text style={{ fontSize:13, color:textColor, lineHeight:20, marginBottom:12 }}>{soulCompat.tension}</Text>
          <View style={{ height:1, backgroundColor:dividerColor, marginBottom:12 }} />
          <Text style={{ fontSize:9, color:'#34D399', fontWeight:'700', letterSpacing:1.5, marginBottom:6 }}>{tm('daily.compatibilityGift')}</Text>
          <Text style={{ fontSize:13, color:textColor, lineHeight:20 }}>{soulCompat.gift}</Text>
        </View>

        {/* ── Quick actions ─────────────────────────────────────── */}
        <Typography variant="premiumLabel" color={accent} style={styles.sectionLabel}>{tm('daily.quickTitle')}</Typography>
        <View style={{ gap:2, marginBottom:20 }}>
          {(dailyQuickRows.map(item => ({
            ...item,
            icon: item.key === 'numerology' ? Hash : item.key === 'compatibility' ? Heart : Sparkles,
            onPress: item.key === 'numerology'
              ? () => navigation.navigate(ROUTES.numerology)
              : item.key === 'compatibility'
                ? () => navigation.navigate(ROUTES.compatibility)
                : () => navigation.navigate(ROUTES.journalEntry, { type:'matrix', prompt: tm('daily.oraclePrompt', { dailyName, dailyEnergy, personalYear, yearArchetype, center: matrix.center }) }),
          })) as const).map(item => (
            <Pressable key={item.label} style={({ pressed }) => [styles.navRow, { backgroundColor:pressed?rowBg:'transparent', borderBottomColor:dividerColor }]} onPress={item.onPress}>
              <View style={[styles.navRowIcon, { backgroundColor:accent+'1A' }]}><item.icon color={accent} size={16} strokeWidth={1.8} /></View>
              <View style={{ flex:1 }}>
                <Typography variant="label" style={{ color:textColor }}>{item.label}</Typography>
                <Typography variant="bodySmall" style={{ color:subColor, marginTop:2, lineHeight:18 }}>{item.desc}</Typography>
              </View>
              <ChevronRight color={accent} size={16} opacity={0.6} />
            </Pressable>
          ))}
        </View>

      </Animated.View>
    );
  };

  // ─── MAIN RENDER ─────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#F8F4EE' : '#020209' }]}>
      <MatrixBackground isLight={isLight} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={20}><ChevronLeft color={accent} size={28} strokeWidth={1.5} /></Pressable>
          <View style={{ flex:1, alignItems:'center' }}>
            <Typography variant="premiumLabel" color={accent}>{tm('header.eyebrow')}</Typography>
            <Typography variant="screenTitle" style={{ marginTop:4 }}>{forSomeone ? tm('header.titleOther', { name: forSomeoneName }) : tm('header.titleOwn')}</Typography>
          </View>
          <View style={{ flexDirection:'row', gap:4 }}>
            <Pressable onPress={() => setShowForSomeoneModal(true)} style={styles.iconBtn} hitSlop={12}>
              <Users color={forSomeone ? accent : accent+'55'} size={18} strokeWidth={1.8} fill={forSomeone ? accent+'33' : 'none'} />
            </Pressable>
            <Pressable onPress={() => { if (isFavoriteItem('matrix')) { removeFavoriteItem('matrix'); } else { addFavoriteItem({ id:'matrix', label:tm('header.favoriteLabel'), route:'Matrix', params:{}, icon:'Sparkles', color:accent, addedAt:new Date().toISOString() }); } }} style={styles.iconBtn} hitSlop={12}>
              <Star color={isFavoriteItem('matrix') ? accent : accent+'88'} size={18} strokeWidth={1.8} fill={isFavoriteItem('matrix') ? accent : 'none'} />
            </Pressable>
          </View>
        </View>

        {forSomeone && (
          <View style={[styles.forSomeoneBanner, { backgroundColor:accent+'18', borderColor:accent+'33' }]}>
            <Users color={accent} size={13} strokeWidth={1.8} />
            <Typography variant="microLabel" color={accent} style={{ marginLeft:6 }}>{tm('header.banner', { name: forSomeoneName })}</Typography>
            <Pressable onPress={() => { setForSomeone(false); setForSomeoneBirth(''); setForSomeoneName(''); }} style={{ marginLeft:'auto' }} hitSlop={10}>
              <Text style={{ fontSize:11, color:accent+'CC', fontWeight:'600' }}>{tc('actions.clear')}</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.tabBar, { borderBottomColor: dividerColor }]}>
          {tabs.map(tab => {
            const TIcon    = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)}
                style={[styles.tabItem, isActive && { borderBottomColor:accent, borderBottomWidth:2 }]}>
                <TIcon color={isActive ? accent : subColor} size={14} strokeWidth={isActive ? 2 : 1.6} />
                <Text style={{ fontSize:11, fontWeight:isActive?'700':'500', color:isActive?accent:subColor, marginTop:3, letterSpacing:0.2 }}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') }]}
          showsVerticalScrollIndicator={false}
          key={activeTab}
        >
      {activeTab === 'hero'     && renderTabHero()}
          {activeTab === 'read'     && renderTabRead()}
          {activeTab === 'deep'     && renderTabDeep()}
          {activeTab === 'practice' && renderTabPractice()}
          {activeTab === 'daily'    && renderTabDaily()}
          <EndOfContentSpacer size="compact" />
        </ScrollView>

      </SafeAreaView>

      <Modal visible={showForSomeoneModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowForSomeoneModal(false)}>
        <Pressable style={{ flex:1, backgroundColor:'rgba(0,0,0,0.5)' }} onPress={() => setShowForSomeoneModal(false)}>
          <Pressable onPress={e => e.stopPropagation()} style={[styles.forSomeoneSheet, { backgroundColor:currentTheme.backgroundElevated, overflow:'hidden', borderTopColor:accent+'44', borderTopWidth:1, borderLeftColor:accent+'22', borderLeftWidth:1, borderRightColor:accent+'22', borderRightWidth:1 }]}>
            <LinearGradient colors={[accent+'18','transparent']} start={{x:0.5,y:0}} end={{x:0.5,y:1}} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <View style={{ width:36, height:4, borderRadius:2, backgroundColor:accent+'44', alignSelf:'center', marginBottom:18 }} />

            {forSomeone && forSomeoneBirth.trim() && (() => {
              const pm = calculateMatrix(forSomeoneBirth.trim());
              return (
                <View style={[styles.ancestralCard, { backgroundColor:accent+'10', borderColor:accent+'33', marginBottom:16, flexDirection:'row', alignItems:'center', gap:12 }]}>
                  <View style={[styles.yearEnergyBadge, { backgroundColor:accent+'22', borderColor:accent+'55', width:46, height:46, borderRadius:23 }]}>
                    <Text style={{ fontSize:20, fontWeight:'900', color:accent }}>{pm.center}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Typography variant="microLabel" color={accent}>{tm('forSomeone.centerEyebrow', { name: forSomeoneName.toUpperCase() })}</Typography>
                    <Typography variant="bodySmall" style={{ color:subColor, marginTop:3 }}>{tm('forSomeone.centerMeta', { lifePath: pm.lifePath, relationship: pm.relationship, bottom: pm.bottom })}</Typography>
                  </View>
                </View>
              );
            })()}

            <Typography variant="cardTitle" style={{ color:currentTheme.text, marginBottom:4 }}>{tm('forSomeone.title')}</Typography>
            <Typography variant="bodySmall" style={{ color:currentTheme.textMuted, marginBottom:20 }}>{tm('forSomeone.body')}</Typography>
            <MysticalInput value={forSomeoneName} onChangeText={setForSomeoneName} placeholder={tm('forSomeone.placeholder')} placeholderTextColor={currentTheme.textMuted} style={{ color:currentTheme.text }} />
            <DateWheelPicker
              day={fsDay}
              month={fsMonth}
              year={fsYear}
              onChange={(d, m, y) => {
                setFsDay(d); setFsMonth(m); setFsYear(y);
                const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                setForSomeoneBirth(iso);
              }}
              textColor={currentTheme.text}
              accentColor={accent}
              cardBg={cardBg}
            />
            {forSomeone && (
              <Pressable onPress={() => { setForSomeone(false); setForSomeoneName(''); setForSomeoneBirth(''); setShowForSomeoneModal(false); }} style={[styles.fsCta, { backgroundColor:'rgba(255,100,100,0.15)', borderColor:'#FB7185', borderWidth:1, marginTop:12 }]}>
                <Typography variant="caption" style={{ color:'#FB7185', fontWeight:'600' }}>{tm('forSomeone.disable')}</Typography>
              </Pressable>
            )}
            <Pressable
              onPress={() => {
                if (forSomeoneName.trim()) {
                  const iso = `${fsYear}-${String(fsMonth).padStart(2, '0')}-${String(fsDay).padStart(2, '0')}`;
                  setForSomeoneBirth(iso);
                  setForSomeone(true); setShowForSomeoneModal(false);
                }
              }}
              style={[styles.fsCta, { backgroundColor:accent, marginTop:forSomeone?10:16 }]}
            >
              <Typography variant="caption" style={{ color:'#FFF', fontWeight:'700' }}>{tc('actions.confirm')}</Typography>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

// ─── STYLES ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:         { flex: 1 },
  safeArea:          { flex: 1 },
  scrollContent:     { flexGrow: 1, paddingHorizontal: layout.padding.screen, paddingTop: 10 },
  header:            { flexDirection: 'row', alignItems: 'center', height: 72, paddingHorizontal: 2 },
  backBtn:           { width: 40 },
  iconBtn:           { width: 40, alignItems: 'center', justifyContent: 'center' },
  tabBar:            { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 4 },
  tabItem:           { flex: 1, alignItems: 'center', paddingVertical: 10, paddingBottom: 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  emptyState:        { flex: 1, justifyContent: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 42 },
  emptyCopy:         { marginTop: 16, lineHeight: 24, opacity: 0.84, maxWidth: 340, alignSelf: 'center' },
  promptList:        { marginTop: 18, padding: 16 },
  promptRow:         { flexDirection: 'row', alignItems: 'flex-start', marginTop: 12 },
  promptDot:         { width: 7, height: 7, borderRadius: 999, marginTop: 8, marginRight: 10 },
  promptText:        { flex: 1, lineHeight: 22 },
  emptyAction:       { marginTop: 18, paddingVertical: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  heroCopy:          { marginTop: 14, lineHeight: 24, maxWidth: 350 },
  metricsStrip:      { marginTop: 14, marginBottom: 18, borderRadius: 18, borderWidth: 1, padding: 18 },
  metricCell:        { flex: 1, alignItems: 'center', paddingVertical: 4 },
  metricValue:       { fontSize: 26, fontWeight: '900', marginTop: 6 },
  summaryStrip:      { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, paddingVertical: 14 },
  summaryMetricCell: { flex: 1, alignItems: 'center' },
  axisRow:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  axisValueBadge:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  axisValueText:     { fontSize: 20, fontWeight: '900' },
  chartSection:      { marginTop: 10, marginBottom: 16 },
  sectionLabel:      { marginTop: 4, marginBottom: 12 },
  insightRow:        { flexDirection: 'row', alignItems: 'center', paddingBottom: 10, marginBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  insightBody:       { lineHeight: 25 },
  divider:           { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  navRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth },
  navRowIcon:        { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  posCard:           { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 14, borderWidth: 1, gap: 12 },
  posNum:            { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  posNumText:        { fontSize: 16, fontWeight: '800' },
  posName:           { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  posDesc:           { fontSize: 12, lineHeight: 17 },
  energyBadge:       { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  energyBadgeText:   { fontSize: 18, fontWeight: '900' },
  guideSection:      { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 12 },
  yearEnergyCard:    { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 4, overflow: 'hidden' },
  yearEnergyHeader:  { flexDirection: 'row', alignItems: 'center' },
  yearEnergyBadge:   { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  forecastCard:      { borderRadius: 18, borderWidth: 1, padding: 18, marginBottom: 4, overflow: 'hidden' },
  integrationCta:    { borderWidth: 1, borderRadius: 16, padding: 18, marginTop: 8, marginBottom: 12 },
  forSomeoneBanner:  { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  forSomeoneSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 44 },
  fsCta:             { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  crossCard:         { borderRadius: 16, borderWidth: 1, padding: 14, overflow: 'hidden' },
  crossDirBadge:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  crossDirSymbol:    { fontSize: 14, fontWeight: '800' },
  ancestralCard:     { borderRadius: 14, borderWidth: 1, padding: 14, overflow: 'hidden' },
  lifePathBadgeRow:  { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 8 },
  timelineCard:      { width: 100, borderRadius: 16, borderWidth: 1.5, padding: 12, alignItems: 'center', overflow: 'hidden' },
  timelineNowBadge:  { marginTop: 6, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  meditationStep:    { borderRadius: 14, borderWidth: 1, padding: 14 },
  meditationStepNum: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  meditationCta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 14, paddingVertical: 13, marginTop: 10 },
});
