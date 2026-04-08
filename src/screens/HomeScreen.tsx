// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions, ActivityIndicator, InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, Moon, Star, Flame, Droplets, Heart, BookOpen, Layers, Waves, Wind, ChevronRight, Brain, Zap, Eye, Hash, Users, Compass, Sun, Flower2, Calendar, Target, Gem, CheckSquare2, Search } from 'lucide-react-native';

import Svg, { Circle, Path, Line, G, Ellipse, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useAppStore } from '../store/useAppStore';
import { useJournalStore } from '../store/useJournalStore';
import { useOracleStore } from '../store/useOracleStore';
import { usePremiumStore } from '../store/usePremiumStore';
import { useTarotStore } from '../features/tarot/store/useTarotStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, screenContracts } from '../core/theme/designSystem';
import { SoulEngineService, DailySoulPlan } from '../core/services/soulEngine.service';
import { Typography } from '../components/Typography';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { buildTarotCardInterpretation } from '../features/tarot/utils/tarotInterpretation';
import { getTarotDeckById } from '../features/tarot/data/decks';
import { AiService } from '../core/services/ai.service';
import { navigateToMainTab } from '../navigation/navigationFallbacks';
import { AudioService } from '../core/services/audio.service';
import { CosmicNewsStrip } from '../components/CosmicNewsStrip';

import Animated, {
  FadeInDown, FadeIn,
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
  interpolate, cancelAnimation, withRepeat, withSequence,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');

// ── TIME-AWARE GREETING ────────────────────────────────────────
const getTimeGreeting = (name: string): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return `Dobry ranek, ${name} ✦`;
  if (hour >= 12 && hour < 18) return `Dzień dobry, ${name} ✦`;
  if (hour >= 18 && hour < 24) return `Dobry wieczór, ${name} ✦`;
  return `Dobranoc, ${name} ✦`;
};

// ── CELESTIAL HERO ORB — module-level animated orb with rings ──
const AnimatedCelestialOrb = React.memo(({ accent, isLight }: { accent: string; isLight: boolean }) => {
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    ring1.value = withRepeat(withTiming(360, { duration: 9000 }), -1, false);
    ring2.value = withRepeat(withTiming(-360, { duration: 14000 }), -1, false);
    ring3.value = withRepeat(withTiming(360, { duration: 20000 }), -1, false);
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 2200 }), withTiming(1.0, { duration: 2200 })), -1, false);
    return () => {
      cancelAnimation(ring1);
      cancelAnimation(ring2);
      cancelAnimation(ring3);
      cancelAnimation(pulse);
    };
  }, []);

  const ring1Style = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${ring1.value}deg` }] }));
  const ring2Style = useAnimatedStyle(() => ({ transform: [{ rotateX: '60deg' }, { rotateZ: `${ring2.value}deg` }] }));
  const ring3Style = useAnimatedStyle(() => ({ transform: [{ rotateX: '30deg' }, { rotateY: '40deg' }, { rotateZ: `${ring3.value}deg` }] }));
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const sz = 156;

  return (
    <View style={{ width: sz, height: sz, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer ambient glow */}
      <View style={{ position: 'absolute', width: sz + 24, height: sz + 24, borderRadius: (sz + 24) / 2, backgroundColor: accent + (isLight ? '14' : '0C') }} />
      {/* Pulsing core orb */}
      <Animated.View style={[{ position: 'absolute', width: 70, height: 70, borderRadius: 35, backgroundColor: accent + (isLight ? '28' : '1E'), borderWidth: 1.5, borderColor: accent + (isLight ? '66' : '44') }, pulseStyle]}>
        <LinearGradient colors={[accent + '55', accent + '18'] as [string, string]} style={{ flex: 1, borderRadius: 35 }} />
      </Animated.View>
      {/* Ring 1 — main orbit */}
      <Animated.View style={[{ position: 'absolute', width: sz - 10, height: sz - 10 }, ring1Style]}>
        <Svg width={sz - 10} height={sz - 10}>
          <Circle cx={(sz - 10) / 2} cy={(sz - 10) / 2} r={(sz - 10) / 2 - 2} stroke={accent} strokeWidth={1.2} fill="none" strokeDasharray="5 8" opacity={0.6} />
          <Circle cx={(sz - 10) / 2 + (sz / 2 - 8)} cy={(sz - 10) / 2} r={4} fill={accent} opacity={0.9} />
        </Svg>
      </Animated.View>
      {/* Ring 2 — tilted inner */}
      <Animated.View style={[{ position: 'absolute', width: sz - 34, height: sz - 34 }, ring2Style]}>
        <Svg width={sz - 34} height={sz - 34}>
          <Ellipse cx={(sz - 34) / 2} cy={(sz - 34) / 2} rx={(sz - 34) / 2 - 2} ry={(sz - 34) / 4} stroke={accent} strokeWidth={1.0} fill="none" strokeDasharray="3 6" opacity={0.5} />
          <Circle cx={(sz - 34) / 2 + (sz / 2 - 20)} cy={(sz - 34) / 2} r={3} fill={accent + 'CC'} />
        </Svg>
      </Animated.View>
      {/* Ring 3 — outermost slow orbit */}
      <Animated.View style={[{ position: 'absolute', width: sz, height: sz }, ring3Style]}>
        <Svg width={sz} height={sz}>
          <Ellipse cx={sz / 2} cy={sz / 2} rx={sz / 2 - 2} ry={sz / 4} stroke={accent + '88'} strokeWidth={0.8} fill="none" strokeDasharray="2 10" opacity={0.4} />
        </Svg>
      </Animated.View>
      {/* Center star glyph */}
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, color: accent, opacity: 0.9 }}>✦</Text>
      </View>
    </View>
  );
});

// ── QUICK ACTION RIBBON — horizontal pill row ──────────────────
const QUICK_ACTIONS = [
  { id: 'medytacja', label: 'Medytacja', icon: Brain,     color: '#818CF8', screen: 'Meditation' },
  { id: 'dziennik',  label: 'Dziennik',  icon: BookOpen,  color: '#34D399', screen: 'JournalEntry' },
  { id: 'tarot',     label: 'Tarot',     icon: Sparkles,  color: '#F59E0B', screen: 'DailyTarot' },
  { id: 'rytual',    label: 'Rytuał',    icon: Flame,     color: '#F97316', screen: 'DailyRitualAI' },
  { id: 'afirmacje', label: 'Afirmacje', icon: Heart,     color: '#F472B6', screen: 'Affirmations' },
  { id: 'mantra',    label: 'Mantra',    icon: Star,      color: '#A78BFA', screen: 'MantraGenerator' },
  { id: 'oddech',    label: 'Oddech',    icon: Wind,      color: '#6EE7B7', screen: 'Breathwork' },
] as const;

const QuickActionPill = React.memo(({ item, navigation, isLight, index }: { item: typeof QUICK_ACTIONS[number]; navigation: any; isLight: boolean; index: number }) => {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const Icon = item.icon;
  return (
    <Animated.View entering={FadeIn.delay(index * 60).duration(280)}>
      <Animated.View style={pressStyle}>
      <Pressable
        onPress={() => navigation.navigate(item.screen)}
        onPressIn={() => { scale.value = withSpring(0.92, { damping: 14, stiffness: 400 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 12, stiffness: 200 }); }}
        style={[
          qa.pill,
          {
            borderColor: item.color + (isLight ? 'CC' : '55'),
            backgroundColor: item.color + (isLight ? '18' : '14'),
            shadowColor: item.color,
            shadowOpacity: isLight ? 0.22 : 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 3 },
            elevation: 6,
          },
        ]}
      >
        <LinearGradient
          colors={[item.color + '30', item.color + '0C'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top shimmer */}
        <LinearGradient
          colors={isLight ? ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.0)'] as [string, string] : ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.0)'] as [string, string]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, borderTopLeftRadius: 999, borderTopRightRadius: 999 }}
          pointerEvents="none"
        />
        <View style={[qa.iconCircle, { backgroundColor: item.color + (isLight ? '28' : '22'), borderColor: item.color + (isLight ? '88' : '55') }]}>
          <Icon color={item.color} size={15} strokeWidth={1.8} />
        </View>
        <Text style={[qa.label, { color: isLight ? '#1A1008' : '#F0E8D8' }]}>{item.label}</Text>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const qa = StyleSheet.create({
  pill: {
    flexDirection: 'column', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 11,
    borderRadius: 999, borderWidth: 1.2, overflow: 'hidden',
    minWidth: 76,
  },
  iconCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.1 },
});
const TILE_W = (SW - 44 - 10) / 2;

// ── WORLD BACKGROUNDS ──────────────────────────────────────────

const TyBackground = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#0A0807', '#120F0A', '#1A1610']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.13}>
      <G>
        <Circle cx={SW / 2} cy={170} r={120} stroke="#CEAE72" strokeWidth={0.8} fill="none" strokeDasharray="4 10" />
        <Circle cx={SW / 2} cy={170} r={78} stroke="#CEAE72" strokeWidth={0.5} fill="none" strokeDasharray="2 6" />
        <Circle cx={SW / 2} cy={170} r={36} stroke="#CEAE72" strokeWidth={1.2} fill="none" />
        {Array.from({ length: 8 }, (_, i) => { const a = (i * 45) * Math.PI / 180; return <Line key={i} x1={SW/2+Math.cos(a)*36} y1={170+Math.sin(a)*36} x2={SW/2+Math.cos(a)*120} y2={170+Math.sin(a)*120} stroke="#CEAE72" strokeWidth={0.4} opacity={0.5} />; })}
        {Array.from({ length: 18 }, (_, i) => (<Circle key={'bg'+i} cx={(i*137+20)%SW} cy={(i*89+20)%SW} r={i%5===0?1.5:0.8} fill="rgba(255,255,255,0.5)" opacity={0.14} />))}
      </G>
    </Svg>
  </View>
));

const TarotWorldBackground = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#0A0705', '#140E08', '#1C1510']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.16}>
      <G>
        {[0,1,2,3,4,5].map(i => (<G key={i} transform={`translate(${SW*0.5+(i-2.5)*52}, 110) rotate(${(i-2.5)*16})`}><Rect x={-24} y={-38} width={48} height={72} rx={6} stroke="#CEAE72" strokeWidth={1.2} fill="rgba(206,174,114,0.04)" opacity={0.6-i*0.07} /></G>))}
        <Circle cx={SW/2} cy={300} r={140} stroke="#CEAE72" strokeWidth={0.5} fill="none" strokeDasharray="5 12" opacity={0.18} />
        {Array.from({ length: 16 }, (_, i) => (<Circle key={i} cx={(i*137+40)%SW} cy={(i*79+30)%SW} r={i%4===0?1.6:0.8} fill={i%5===0?'#CEAE72':'rgba(255,255,255,0.6)'} opacity={0.2} />))}
      </G>
    </Svg>
  </View>
));

const HoroscopeWorldBackground = React.memo(() => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#07060F', '#0D0A1A', '#141026']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.19}>
      <G>
        {[160,115,76,42].map((r,i) => (<Circle key={i} cx={SW/2} cy={180} r={r} stroke="#A78BFA" strokeWidth={0.7} fill="none" strokeDasharray={i%2===0?'5 8':'2 5'} opacity={0.48-i*0.08} />))}
        {Array.from({ length: 12 }, (_, i) => { const a=(i*30-90)*Math.PI/180; return <Circle key={i} cx={SW/2+Math.cos(a)*160} cy={180+Math.sin(a)*160} r={i%3===0?4:2.5} fill="#A78BFA" opacity={0.45} />; })}
      </G>
    </Svg>
  </View>
));

const AstrologyWorldBackground = React.memo(() => {
  const stars = [[40,30],[120,25],[210,55],[290,30],[165,75],[75,105],[245,95],[340,45],[390,75],[55,155],[195,135],[325,125],[10,80],[270,160],[400,130]];
  const lines = [[0,2],[2,4],[1,4],[5,6],[6,7],[8,7],[9,10],[10,11],[12,5],[13,14]];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={['#030810', '#07101E', '#0C162C']} style={StyleSheet.absoluteFill} />
      <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.22}>
        <G>
          {lines.map(([a,b],i) => <Line key={i} x1={stars[a][0]} y1={stars[a][1]} x2={stars[b][0]} y2={stars[b][1]} stroke="#60A5FA" strokeWidth={0.7} opacity={0.4} />)}
          {stars.map(([x,y],i) => <Circle key={i} cx={x} cy={y} r={i%4===0?3:i%3===0?2:1.2} fill={i%4===0?'#60A5FA':'rgba(255,255,255,0.8)'} opacity={0.45} />)}
        </G>
      </Svg>
    </View>
  );
});

const SupportWorldBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#090508', '#130A10', '#1C0F18']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.17}>
      <G>
        {Array.from({ length: 16 }, (_, i) => (<Circle key={i} cx={(i*113+50)%SW} cy={(i*79+80)%SW} r={i%4===0?2:1} fill="#F472B6" opacity={0.16} />))}
        {[0,1,2,3].map(i => <Circle key={'c'+i} cx={SW*(0.15+i*0.24)} cy={320+i*20} r={58+i*20} stroke="#F472B6" strokeWidth={0.5} fill="none" opacity={0.18} strokeDasharray="3 8" />)}
      </G>
    </Svg>
  </View>
);

const CleansingWorldBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#030A08', '#060F0C', '#091512']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.19}>
      <G>
        {[0,1,2,3,4].map(i => (<Path key={i} d={`M0,${180+i*56} C${SW*0.15},${170+i*56} ${SW*0.28},${192+i*56} ${SW*0.42},${180+i*56} C${SW*0.56},${168+i*56} ${SW*0.7},${192+i*56} ${SW},${180+i*56}`} stroke="#34D399" strokeWidth={1.4-i*0.15} fill="none" opacity={0.5-i*0.08} strokeLinecap="round" />))}
        {[0,1,2].map(i => <Circle key={i} cx={SW/2} cy={100} r={30+i*26} stroke="#34D399" strokeWidth={0.7} fill="none" opacity={0.32-i*0.08} strokeDasharray="4 7" />)}
      </G>
    </Svg>
  </View>
);

const RitualsWorldBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#0A0603', '#160A05', '#200F08']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.19}>
      <G>
        {[0,1,2].map(i => <Circle key={i} cx={SW*(0.2+i*0.3)} cy={340} r={40+i*20} stroke="#F97316" strokeWidth={0.8} fill="none" strokeDasharray="3 6" opacity={0.34-i*0.08} />)}
        {Array.from({ length: 14 }, (_, i) => <Circle key={'s'+i} cx={(i*89+SW/2-160)%SW} cy={(i*63+80)%SW} r={i%3===0?1.8:0.9} fill="#F97316" opacity={0.2} />)}
      </G>
    </Svg>
  </View>
);

const DreamsWorldBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#040310', '#07061A', '#0B0A28']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.22}>
      <G>
        <Circle cx={SW*0.72} cy={70} r={50} fill="none" stroke="#5A5A9A" strokeWidth={1.3} opacity={0.5} />
        <Circle cx={SW*0.72+24} cy={60} r={42} fill="#07061A" stroke="none" />
        {[0,1,2].map(i => <Ellipse key={i} cx={SW/2} cy={220+i*60} rx={84-i*20} ry={20+i*8} stroke="#5A5A9A" strokeWidth={0.5} fill="none" opacity={0.28-i*0.06} strokeDasharray="3 6" />)}
        {Array.from({ length: 18 }, (_, i) => <Circle key={i} cx={(i*139+25)%SW} cy={(i*89+15)%SW} r={i%5===0?1.8:0.9} fill={i%4===0?'#5A5A9A':'rgba(255,255,255,0.7)'} opacity={0.22} />)}
      </G>
    </Svg>
  </View>
);

// ── WORLD CONFIG ──────────────────────────────────────────────

const getWorldSymbol = (id: string, accent: string, cx: number) => {
  switch (id) {
    case 'ty': return (<G><Circle cx={cx} cy={cx} r={44} fill="none" stroke={accent} strokeWidth={0.7} opacity={0.35} strokeDasharray="5 9" /><Circle cx={cx} cy={cx} r={30} fill="none" stroke={accent} strokeWidth={0.7} opacity={0.25} strokeDasharray="3 6" /><Circle cx={cx} cy={cx} r={18} fill="none" stroke={accent} strokeWidth={0.9} opacity={0.40} />{Array.from({length:8},(_,i)=>{const a=(i*45)*Math.PI/180;const isMain=i%2===0;return<Line key={i} x1={cx+Math.cos(a)*18} y1={cx+Math.sin(a)*18} x2={cx+Math.cos(a)*(isMain?44:30)} y2={cx+Math.sin(a)*(isMain?44:30)} stroke={accent} strokeWidth={isMain?1.2:0.7} opacity={isMain?0.75:0.45} />;})}<Circle cx={cx} cy={cx} r={7} fill={accent+'22'} stroke={accent} strokeWidth={1.2} /><Circle cx={cx} cy={cx} r={3} fill={accent} opacity={0.95} /></G>);
    case 'tarot': return (<G>{[-28,-14,0,14,28].map((rot,i)=>(<G key={i} transform={`rotate(${rot} ${cx} ${cx+22})`}><Rect x={cx-13} y={cx-28} width={26} height={44} rx={4} fill={accent+(i===2?'1E':'0C')} stroke={accent+(i===2?'BB':'44')} strokeWidth={i===2?1.2:0.7} /></G>))}<Circle cx={cx} cy={cx-8} r={5} fill={accent+'33'} stroke={accent+'99'} strokeWidth={1} /><Circle cx={cx} cy={cx-8} r={2.5} fill={accent} opacity={0.9} /></G>);
    case 'horoscope': return (<G><Circle cx={cx} cy={cx} r={46} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.38} /><Circle cx={cx} cy={cx} r={32} fill="none" stroke={accent} strokeWidth={0.7} opacity={0.25} />{Array.from({length:12},(_,i)=>{const a=(i*30-90)*Math.PI/180;const isKey=i%3===0;return<Circle key={i} cx={cx+Math.cos(a)*46} cy={cx+Math.sin(a)*46} r={isKey?3.5:1.8} fill={accent} opacity={isKey?0.9:0.5} />;})}<Circle cx={cx} cy={cx} r={14} fill={accent+'1E'} stroke={accent+'77'} strokeWidth={1.2} /><Circle cx={cx} cy={cx} r={5} fill={accent} opacity={0.92} /></G>);
    case 'astrology': {const apts=[[cx-22,cx-26],[cx+14,cx-34],[cx+36,cx-14],[cx+28,cx+18],[cx-8,cx+30],[cx-28,cx+8],[cx,cx-6]];const alns=[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0],[0,6],[2,6],[4,6]];return(<G><Circle cx={cx} cy={cx} r={44} fill="none" stroke={accent+'22'} strokeWidth={0.7} strokeDasharray="5 10" />{alns.map(([a,b],i)=><Line key={i} x1={apts[a][0]} y1={apts[a][1]} x2={apts[b][0]} y2={apts[b][1]} stroke={accent+'55'} strokeWidth={0.8} />)}{apts.map(([x,y],i)=><Circle key={i} cx={x} cy={y} r={i===6?4:i%2===0?2.5:1.5} fill={accent} opacity={i===6?0.95:0.75} />)}</G>);}
    case 'support': return (<G>{Array.from({length:6},(_,i)=>(<G key={i} transform={`rotate(${i*60} ${cx} ${cx})`}><Ellipse cx={cx} cy={cx-22} rx={10} ry={22} fill={accent+'14'} stroke={accent+'44'} strokeWidth={0.8} /></G>))}<Path d={`M ${cx} ${cx+10} C ${cx-18} ${cx-2} ${cx-26} ${cx-16} ${cx} ${cx-28} C ${cx+26} ${cx-16} ${cx+18} ${cx-2} ${cx} ${cx+10} Z`} fill={accent+'28'} stroke={accent} strokeWidth={1.2} /><Circle cx={cx} cy={cx} r={5} fill={accent} opacity={0.9} /></G>);
    case 'cleansing': return (<G><Circle cx={cx} cy={cx} r={44} fill="none" stroke={accent+'22'} strokeWidth={0.7} strokeDasharray="4 8" /><Circle cx={cx} cy={cx-18} r={13} fill={accent+'1A'} stroke={accent+'66'} strokeWidth={1} /><Circle cx={cx} cy={cx-18} r={4} fill={accent+'77'} />{[0,1,2,3].map(i=>(<Path key={i} d={`M ${cx-36+i*3},${cx+12} Q ${cx-18+i*2},${cx+2-i*3} ${cx},${cx+12} Q ${cx+18-i*2},${cx+22+i*3} ${cx+36-i*3},${cx+12}`} stroke={accent} strokeWidth={1.3-i*0.25} fill="none" strokeLinecap="round" opacity={0.55-i*0.1} />))}</G>);
    case 'rituals': return (<G><Circle cx={cx} cy={cx+8} r={44} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.28} strokeDasharray="4 7" /><Circle cx={cx} cy={cx+8} r={32} fill="none" stroke={accent} strokeWidth={0.8} opacity={0.20} strokeDasharray="4 7" /><Path d={`M ${cx} ${cx+16} C ${cx-14} ${cx} ${cx-18} ${cx-14} ${cx} ${cx-30} C ${cx+18} ${cx-14} ${cx+14} ${cx} ${cx} ${cx+16} Z`} fill={accent+'44'} stroke={accent+'88'} strokeWidth={1.2} /><Path d={`M ${cx} ${cx+12} C ${cx-7} ${cx+4} ${cx-9} ${cx-6} ${cx} ${cx-18} C ${cx+9} ${cx-6} ${cx+7} ${cx+4} ${cx} ${cx+12} Z`} fill={accent+'88'} /><Circle cx={cx} cy={cx-4} r={3.5} fill={accent} opacity={0.95} /></G>);
    default: return (<G><Circle cx={cx} cy={cx} r={42} fill="none" stroke={accent+'22'} strokeWidth={0.7} strokeDasharray="5 9" /><Circle cx={cx-4} cy={cx-2} r={28} fill={accent+'18'} stroke={accent+'55'} strokeWidth={1.2} /><Circle cx={cx} cy={cx} r={5} fill={accent+'66'} /><Circle cx={cx} cy={cx} r={2} fill={accent} opacity={0.9} /></G>);
  }
};

const WorldOrb = React.memo(({ accent, surfaceId }: { accent: string; surfaceId: string }) => {
  const rot = useSharedValue(0);
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  useEffect(() => { rot.value = withRepeat(withTiming(360, { duration: 24000 }), -1, false); }, []);
  const pan = Gesture.Pan()
    .onUpdate(e => { tiltX.value = Math.max(-20, Math.min(20, e.translationY * 0.12)); tiltY.value = Math.max(-20, Math.min(20, e.translationX * 0.12)); })
    .onEnd(() => { tiltX.value = withTiming(0, { duration: 900 }); tiltY.value = withTiming(0, { duration: 900 }); });
  const outerStyle = useAnimatedStyle(() => ({ transform: [{ perspective: 600 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${tiltY.value}deg` }] }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rot.value}deg` }] }));
  const sz = 140; const cx = sz / 2;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 4 }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={outerStyle}>
          <Svg width={sz} height={sz}>
            <Circle cx={cx} cy={cx} r={58} fill={accent + '0A'} />
            {getWorldSymbol(surfaceId, accent, cx)}
          </Svg>
          <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, orbitStyle]}>
            <Svg width={sz} height={sz}>
              {[accent,'#CEAE72','#A78BFA','#60A5FA','#F472B6','#34D399','#F97316','#5A5A9A'].map((c, i) => {
                const a = (i / 8) * 2 * Math.PI;
                return <Circle key={i} cx={cx + 62 * Math.cos(a)} cy={cx + 62 * Math.sin(a) * 0.35} r={c === accent ? 5 : 3} fill={c} opacity={c === accent ? 1 : 0.5} />;
              })}
            </Svg>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const SURFACES = [
  { id: 'ty',        title: 'Ty',          eyebrow: 'OSOBISTE SANKTUARIUM', BG: TyBackground,           accent: '#CEAE72' },
  { id: 'tarot',     title: 'Tarot',        eyebrow: 'KARTY I SYMBOL',       BG: TarotWorldBackground,   accent: '#CEAE72' },
  { id: 'horoscope', title: 'Horoskop',     eyebrow: 'ZNAK I CYKL',          BG: HoroscopeWorldBackground, accent: '#A78BFA' },
  { id: 'astrology', title: 'Astrologia',   eyebrow: 'MAPA NIEBA',           BG: AstrologyWorldBackground, accent: '#60A5FA' },
  { id: 'support',   title: 'Wsparcie',     eyebrow: 'UKOJENIE I SIŁA',      BG: SupportWorldBackground,   accent: '#F472B6' },
  { id: 'cleansing', title: 'Oczyszczanie', eyebrow: 'UWOLNIENIE I ODDECH',  BG: CleansingWorldBackground, accent: '#34D399' },
  { id: 'rituals',   title: 'Rytuały',      eyebrow: 'INTENCJA I CEREMONIA', BG: RitualsWorldBackground,   accent: '#F97316' },
  { id: 'dreams',    title: 'Sny',          eyebrow: 'SYMBOL NOCY',          BG: DreamsWorldBackground,    accent: '#8B7FD4' },
];

const WORLD_DESCS: Record<string, string> = {
  ty: 'Wewnętrzne sanktuarium — archetyp, wzorce i codzienność.',
  tarot: 'Karty jako lustro — każdy obraz niesie odpowiedź.',
  horoscope: 'Gwiazdy opisują rytm, nie los — Ty wybierasz jak tańczyć.',
  astrology: 'Szeroka mapa nieba: planety, cykle i wzorce ponad znaki.',
  support: 'Przestrzeń czułości — afirmacja, oddech i ukojenie.',
  cleansing: 'Uwolnij to, co ciąży. Oddech to pierwszy rytuał.',
  rituals: 'Intencja w ceremonii — każdy rytuał zmienia przestrzeń.',
  dreams: 'Nocne obrazy niosą prawdziwszy język niż dzienne słowa.',
};

// ── WORLD PILL NAVIGATION ─────────────────────────────────────

const WorldPillNav = React.memo(({ surfaces, activeIndex, onSelect, isLight }: { surfaces: typeof SURFACES; activeIndex: number; onSelect: (i: number) => void; isLight: boolean }) => {
  const scrollRef = useRef<ScrollView>(null);
  const active = surfaces[activeIndex];
  useEffect(() => {
    scrollRef.current?.scrollTo({ x: activeIndex * 90 - SW / 2 + 50, animated: true });
  }, [activeIndex]);
  return (
    <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 18, gap: 8, paddingVertical: 4 }} style={{ maxHeight: 44 }}>
      {surfaces.map((s, i) => {
        const isActive = i === activeIndex;
        return (
          <Pressable key={s.id} onPress={() => onSelect(i)} style={[wn.pill, isActive ? { backgroundColor: active.accent + '22', borderColor: active.accent + '66' } : { borderColor: isLight ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.22)' }]}>
            {isActive && <View style={[wn.pillDot, { backgroundColor: active.accent }]} />}
            <Text style={[wn.pillText, { color: isActive ? active.accent : (isLight ? 'rgba(40,28,16,0.68)' : 'rgba(255,255,255,0.45)') }]}>{s.title}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const wn = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.22)' },
  pillDot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
});

// ── ACTION TILE — glassy, glowing, rounded ─────────────────────
// Press glow ring + glass morphism, NO looping animations

const ActionTile = React.memo(({ icon: Icon, label, sublabel, accent, onPress, delay = 0, isLight = false, fullWidth = false }: { icon: any; label: string; sublabel: string; accent: string; onPress: () => void; delay?: number; isLight?: boolean; fullWidth?: boolean }) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    return () => {
      cancelAnimation(glow);
      cancelAnimation(scale);
    };
  }, []);

  const tileStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0, 1]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [0.88, 1.06]) }],
  }));

  const tileBg = isLight ? 'rgba(255,255,255,0.97)' : 'rgba(10,8,22,0.88)';
  const tileBorder = isLight ? accent + 'BB' : accent + '50';
  const labelColor = isLight ? '#180F04' : '#F5EFE6';
  const subColor = isLight ? 'rgba(28,18,6,0.56)' : 'rgba(215,205,190,0.56)';

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(300)} style={[at.wrap, { width: fullWidth ? SW - 44 : TILE_W }]}>
      {/* Outer glow halo on press */}
      <Animated.View
        pointerEvents="none"
        style={[at.glowRing, { backgroundColor: accent + '22', borderColor: accent + '44' }, glowStyle]}
      />
      <Animated.View style={tileStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => {
            scale.value = withSpring(0.94, { damping: 15, stiffness: 420 });
            glow.value = withTiming(1, { duration: 120 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
            glow.value = withTiming(0, { duration: 350 });
          }}
          style={[
            at.tile,
            { borderColor: tileBorder, backgroundColor: tileBg },
            isLight
              ? { shadowColor: accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 8 }
              : { shadowColor: accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.30, shadowRadius: 20, elevation: 12 },
          ]}
        >
          {/* Diagonal base gradient */}
          <LinearGradient
            colors={isLight
              ? [accent + '22', accent + '0C', 'rgba(255,255,255,0.0)'] as [string,string,string]
              : [accent + '30', accent + '10', 'rgba(8,6,20,0.0)'] as [string,string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Frosted glass top highlight */}
          <LinearGradient
            colors={isLight
              ? ['rgba(255,255,255,0.72)', 'rgba(255,255,255,0.0)'] as [string,string]
              : ['rgba(255,255,255,0.11)', 'rgba(255,255,255,0.0)'] as [string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}
            pointerEvents="none"
          />

          {/* Accent top edge line */}
          <LinearGradient
            colors={['transparent', accent + 'EE', 'transparent'] as [string,string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: isLight ? 0.9 : 0.7 }}
            pointerEvents="none"
          />

          {/* Bottom-right ambient orb */}
          <View style={[at.cornerOrb, { backgroundColor: accent + (isLight ? '18' : '12') }]} />

          {/* Icon container — glowing ring */}
          <View style={[at.iconRing, { backgroundColor: accent + (isLight ? '22' : '1C'), borderColor: accent + (isLight ? 'BB' : '70') }]}>
            <LinearGradient
              colors={[accent + '44', accent + '14'] as [string,string]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 17 }]}
            />
            <Icon color={accent} size={23} strokeWidth={1.6} />
          </View>

          <Text style={[at.label, { color: labelColor }]} numberOfLines={1}>{label}</Text>
          <Text style={[at.sub, { color: subColor }]} numberOfLines={2}>{sublabel}</Text>

          {/* Arrow badge */}
          <View style={[at.arrow, { backgroundColor: accent + (isLight ? '1C' : '14'), borderColor: accent + (isLight ? '88' : '55') }]}>
            <ChevronRight color={accent} size={11} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const at = StyleSheet.create({
  wrap: { position: 'relative' },
  glowRing: {
    position: 'absolute',
    top: -8, left: -8, right: -8, bottom: -8,
    borderRadius: 36,
    borderWidth: 1.5,
    zIndex: 0,
  },
  tile: { borderRadius: 26, borderWidth: 1.4, paddingTop: 18, paddingBottom: 16, paddingHorizontal: 15, overflow: 'hidden', minHeight: 148, zIndex: 1 },
  iconRing: { width: 52, height: 52, borderRadius: 17, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', marginBottom: 12, overflow: 'hidden' },
  label: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  sub: { fontSize: 12, lineHeight: 17, marginRight: 30 },
  arrow: { position: 'absolute', bottom: 12, right: 12, width: 28, height: 28, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cornerOrb: { position: 'absolute', bottom: -12, right: -12, width: 78, height: 78, borderRadius: 39 },
});

// ── EXPLORE ROW — Colorful glossy cards ───────────────────────

const ExploreRow = React.memo(({ title, desc, accent, onPress, delay = 0, isLight }: { title: string; desc: string; accent: string; onPress: () => void; delay?: number; isLight?: boolean }) => {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(220)}>
      <Animated.View style={pressStyle}>
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.975, { damping: 18, stiffness: 400 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
          style={[er.card, {
            borderColor: isLight ? accent + 'CC' : accent + '66',
            shadowColor: accent,
            shadowOpacity: isLight ? 0.30 : 0.40,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 5 },
            elevation: isLight ? 6 : 4,
          }]}
        >
          {/* Colorful gradient background */}
          <LinearGradient
            colors={isLight
              ? [accent + '30', accent + '18', 'rgba(255,255,255,0.88)'] as [string,string,string]
              : [accent + '44', accent + '22', 'rgba(8,6,20,0.92)'] as [string,string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
          {/* Glossy top highlight */}
          <LinearGradient
            colors={isLight
              ? ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.0)'] as [string,string]
              : ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.0)'] as [string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 28, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            pointerEvents="none"
          />
          {/* Accent top edge */}
          <LinearGradient
            colors={['transparent', accent, 'transparent'] as [string,string,string]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: isLight ? 1.0 : 0.8 }}
            pointerEvents="none"
          />
          {/* Left accent strip */}
          <LinearGradient
            colors={[accent, accent + 'AA'] as [string,string]}
            style={er.strip}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />
          {/* Text */}
          <View style={{ flex: 1 }}>
            <Text style={[er.title, { color: isLight ? '#140C02' : '#F0E8D8' }]}>{title}</Text>
            <Text style={[er.desc, { color: isLight ? 'rgba(30,18,6,0.75)' : 'rgba(220,210,195,0.78)' }]} numberOfLines={2}>{desc}</Text>
          </View>
          {/* Arrow pill */}
          <View style={[er.arrowPill, { backgroundColor: accent + (isLight ? '2A' : '28'), borderColor: accent + (isLight ? '88' : '66') }]}>
            <LinearGradient
              colors={[accent + '55', accent + '22'] as [string,string]}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 11 }]}
            />
            <ChevronRight color={accent} size={14} strokeWidth={2.4} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const er = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, borderWidth: 1.2,
    paddingVertical: 15, paddingHorizontal: 16,
    marginBottom: 10, overflow: 'hidden',
  },
  strip: { width: 4, height: 48, borderRadius: 3, flexShrink: 0 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2, marginBottom: 3 },
  desc: { fontSize: 12, lineHeight: 17 },
  arrowPill: {
    width: 32, height: 32, borderRadius: 11, borderWidth: 1.2,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden',
  },
});

// ── METRICS STRIP ─────────────────────────────────────────────

const MetricsStrip = React.memo(({ items, accent, isLight = false }: { items: { val: string; label: string }[]; accent: string; isLight?: boolean }) => (
  <View style={ms.row}>
    {items.map((m, i) => (
      <React.Fragment key={m.label}>
        {i > 0 && <View style={[ms.sep, { backgroundColor: accent + '28' }]} />}
        <View style={ms.cell}>
          <Text style={[ms.val, { color: accent }]}>{m.val}</Text>
          <Text style={[ms.label, { color: isLight ? 'rgba(60,42,14,0.60)' : 'rgba(200,190,178,0.55)' }]}>{m.label}</Text>
        </View>
      </React.Fragment>
    ))}
  </View>
));

const ms = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
  cell: { flex: 1, alignItems: 'center' },
  val: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, marginTop: 3 },
  sep: { width: 1, height: 32, marginHorizontal: 4 },
});

// ── SECTION DIVIDER ───────────────────────────────────────────

const SectionDivider = React.memo(({ label, accent }: { label: string; accent: string }) => (
  <View style={sd.wrap}>
    <View style={[sd.line, { backgroundColor: accent + '28' }]} />
    <Text style={[sd.label, { color: accent + 'AA' }]}>{label}</Text>
    <View style={[sd.line, { backgroundColor: accent + '28' }]} />
  </View>
));

const sd = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  line: { flex: 1, height: 1 },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 2.2, marginHorizontal: 12 },
});

// ── WORLD CONTENT ─────────────────────────────────────────────

const renderContent = (id: string, navigation: any, dailyPlan: DailySoulPlan, userData: any, entries: any[], streaks: any, dailyDraw: any, dailyTarotPreview: any, pastReadings: any[], pastSessions: any[], tarotDeck: any, isPremium: boolean, isLight: boolean, addFavoriteItem: any, translate?: any) => {
  const tr = typeof translate === 'function'
    ? translate
    : (_key: string, pl: string, en: string) => (i18n.language?.startsWith('en') ? en : pl);
  const ac = SURFACES.find(x => x.id === id)?.accent || '#CEAE72';

  if (id === 'ty') return (
    <>
      {/* ── HERO CARD: DZISIEJSZA PRAKTYKA ── */}
      {dailyPlan.ritualGuidance?.featured ? (
        <View style={{ marginBottom: 18, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: ac + '40' }}>
          <LinearGradient
            colors={isLight ? ['#FBF0DC', '#EDD8AA'] : ['#1C1130', '#0D0820']}
            style={{ padding: 22, minHeight: 160 }}
          >
            {/* Lewy accent bar */}
            <View style={{ position: 'absolute', left: 0, top: 20, bottom: 20, width: 3, backgroundColor: ac, borderRadius: 2 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: ac + '20', borderWidth: 1.5, borderColor: ac + '55', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles color={ac} size={32} strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '800', letterSpacing: 2.2, color: ac, marginBottom: 4 }}>DZISIEJSZA PRAKTYKA</Text>
                <Text style={{ fontSize: 18, fontWeight: '700', letterSpacing: -0.3, color: isLight ? '#2C1A0E' : '#F5F1EA', lineHeight: 24 }}>
                  {dailyPlan.ritualGuidance?.featured?.title || tr('home.ty.morningRitual', 'Poranny Rytuał', 'Morning Ritual')}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, lineHeight: 20, color: isLight ? '#6B4A2A' : 'rgba(245,241,234,0.7)', paddingLeft: 2, paddingRight: 8 }} numberOfLines={3}>
              {dailyPlan.ritualGuidance?.featured?.category
                ? `${dailyPlan.ritualGuidance.featured.category} · ${dailyPlan.ritualGuidance.featured.duration}`
                : tr('home.ty.morningRitualDesc', '5 etapów porannej praktyki: oddech, afirmacja, intencja, mantra i wdzięczność.', 'A 5-step morning practice: breath, affirmation, intention, mantra, and gratitude.')}
            </Text>
          </LinearGradient>
        </View>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Zap} label={tr('home.ty.energyJournal', 'Dziennik Energii', 'Energy Journal')} sublabel={tr('home.ty.energyJournalSub', 'Śledź przepływ energii przez tydzień', 'Track your energy flow through the week')} accent={ac} onPress={() => navigation.navigate('EnergyJournal')} delay={0} isLight={isLight} />
        <ActionTile icon={BookOpen} label={tr('home.ty.journal', 'Dziennik', 'Journal')} sublabel={tr('home.ty.journalSub', 'Nazwij dzień własnymi słowami', 'Name the day in your own words')} accent={ac} onPress={() => navigation.navigate('JournalEntry')} delay={60} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.ty.soulContract', 'Kontrakt Duszy', 'Soul Contract')} sublabel={tr('home.ty.soulContractSub', 'Karmiczna mapa urodzeniowa', 'Your karmic birth map')} accent={ac} onPress={() => navigation.navigate('SoulContract')} delay={120} isLight={isLight} />
        <ActionTile icon={Brain} label={tr('home.ty.shadowWork', 'Praca z cieniem', 'Shadow Work')} sublabel={tr('home.ty.shadowWorkSub', 'Jungowska eksploracja nieświadomości', 'Jungian exploration of the unconscious')} accent={ac} onPress={() => navigation.navigate('ShadowWork')} delay={180} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.ty.mantra', 'Generator Mantry', 'Mantra Generator')} sublabel={tr('home.ty.mantraSub', 'Spersonalizowana mantra wedyjska', 'A personalized Vedic mantra')} accent={ac} onPress={() => navigation.navigate('MantraGenerator')} delay={240} isLight={isLight} />
        <ActionTile icon={Target} label={tr('home.ty.visionBoard', 'Tablica Manifestacji', 'Manifestation Board')} sublabel={tr('home.ty.visionBoardSub', 'Kosmiczna mapa 9 intencji', 'A cosmic map of 9 intentions')} accent={ac} onPress={() => navigation.navigate('VisionBoard')} delay={300} isLight={isLight} />
        <ActionTile icon={CheckSquare2} label={tr('home.ty.habits', 'Nawyki Duchowe', 'Spiritual Habits')} sublabel={tr('home.ty.habitsSub', 'Śledź 12 codziennych praktyk', 'Track 12 daily practices')} accent="#10B981" onPress={() => navigation.navigate('SpiritualHabits')} delay={360} isLight={isLight} fullWidth />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }, { val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: dailyDraw ? '✓' : '○', label: tr('home.metric.card', 'KARTA', 'CARD') }]} />
      <SectionDivider label={tr('home.explore', 'EKSPLORUJ', 'EXPLORE')} accent={ac} />
      <ExploreRow title={tr('home.ty.morningRitual', 'Poranny Rytuał', 'Morning Ritual')} desc={tr('home.ty.morningRitualDesc', '5 etapów porannej praktyki: oddech, afirmacja, intencja, mantra i wdzięczność.', 'A 5-step morning practice: breath, affirmation, intention, mantra, and gratitude.')} accent={ac} onPress={() => navigation.navigate('MorningRitual')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.ty.lifeWheel', 'Koło Życia', 'Wheel of Life')} desc={tr('home.ty.lifeWheelDesc', 'Interaktywna mapa 8 obszarów życia — oceń i znajdź nierównowagę.', 'An interactive map of 8 life areas — assess them and spot imbalance.')} accent={ac} onPress={() => navigation.navigate('LifeWheel')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.ty.soulArchetype', 'Archetyp Duszy', 'Soul Archetype')} desc={tr('home.ty.soulArchetypeDesc', 'Quiz 8 archetypów Junga — odkryj swój dominujący wzorzec duszy.', 'An 8-archetype Jungian quiz — discover your dominant soul pattern.')} accent={ac} onPress={() => navigation.navigate('SoulArchetype')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.ty.weeklyReport', 'Tygodniowy Raport Duszy', 'Weekly Soul Report')} desc={tr('home.ty.weeklyReportDesc', 'AI podsumowuje Twój tydzień: wzorce energii i emocje.', 'AI summarizes your week: energy patterns and emotions.')} accent={ac} onPress={() => navigation.navigate('WeeklyReport')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.ty.dailyCheckIn', 'Dzienna odprawa', 'Daily Check-In')} desc={tr('home.ty.dailyCheckInDesc', 'Codzienne pytania i samoobserwacja — śledź nastrój, energię i intencję każdego dnia.', 'Daily questions and self-observation — track your mood, energy, and intention each day.')} accent={ac} onPress={() => navigation.navigate('DailyCheckIn')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.ty.spiritAnimal', 'Zwierzę Mocy', 'Spirit Animal')} desc={tr('home.ty.spiritAnimalDesc', 'Odkryj swojego duchowego opiekuna — totemowe zwierzę Twojej ścieżki.', 'Discover your spiritual guardian — the totem animal of your path.')} accent={ac} onPress={() => navigation.navigate('SpiritAnimal')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.ty.spiritualProfile', 'Profil Duchowy', 'Spiritual Profile')} desc={tr('home.ty.spiritualProfileDesc', 'Kompletna mapa tożsamości: numerologia, archetypy i dary duchowe w jednym miejscu.', 'A complete identity map: numerology, archetypes, and spiritual gifts in one place.')} accent={ac} onPress={() => navigation.navigate('SpiritualProfile')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.ty.pastLife', 'Poprzednie Wcielenia', 'Past Lives')} desc={tr('home.ty.pastLifeDesc', 'Regresja przez liczby karmiczne i analizę Akasha — kto byłeś wcześniej?', 'Regression through karmic numbers and Akashic analysis — who were you before?')} accent={ac} onPress={() => navigation.navigate('PastLife')} delay={240} isLight={isLight} />
      {!isPremium && <ExploreRow title={tr('home.ty.premiumLayer', 'Warstwa premium', 'Premium layer')} desc={tr('home.ty.premiumLayerDesc', 'Głębsze odczyty, bogatsze raporty i spokojniejsza pamięć sanktuarium.', 'Deeper readings, richer reports, and a calmer sanctuary memory.')} accent={ac} onPress={() => navigation.navigate('Paywall')} delay={280} isLight={isLight} />}
    </>
  );

  if (id === 'tarot') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Star} label={tr('home.tarot.cardOfDay', 'Karta dnia', 'Card of the Day')} sublabel={tr('home.tarot.cardOfDaySub', 'Odkryj kartę prowadzącą ten dzień', 'Reveal the card guiding this day')} accent={ac} onPress={() => navigation.navigate('DailyTarot')} delay={0} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.tarot.newReading', 'Nowy odczyt', 'New Reading')} sublabel={tr('home.tarot.newReadingSub', 'Wybierz talię i spread', 'Choose your deck and spread')} accent={ac} onPress={() => navigation.navigate('TarotDeckSelection')} delay={60} isLight={isLight} />
        <ActionTile icon={Moon} label={tr('home.tarot.oracleReader', 'Wróżka', 'Oracle Reader')} sublabel={tr('home.tarot.oracleReaderSub', 'Rytuał z talią i narracją AI', 'A ritual with deck and AI narration')} accent={ac} onPress={() => navigation.navigate('Wrozka')} delay={120} isLight={isLight} />
        <ActionTile icon={Heart} label={tr('home.tarot.relationalTarot', 'Tarot relacyjny', 'Relationship Tarot')} sublabel={tr('home.tarot.relationalTarotSub', 'Ścieżka dla dwojga i więzi', 'A path for two and the bond between you')} accent={ac} onPress={() => navigation.navigate('PartnerTarot')} delay={180} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: String(pastReadings.length), label: tr('home.metric.readings', 'ODCZYTY', 'READINGS') }, { val: dailyDraw ? resolveUserFacingText(dailyDraw.card.name).slice(0,7) : tr('home.metric.waiting', 'Czeka', 'Waiting'), label: tr('home.metric.card', 'KARTA', 'CARD') }, { val: tarotDeck?.name?.slice(0,6) ?? 'Classic', label: tr('home.metric.deck', 'TALIA', 'DECK') }, { val: pastReadings[0]?.spread?.name?.slice(0,5) ?? tr('home.metric.none', 'Brak', 'None'), label: tr('home.metric.last', 'OSTATNI', 'LAST') }]} />
      <SectionDivider label={tr('home.tarot.paths', 'ŚCIEŻKI TAROTA', 'TAROT PATHS')} accent={ac} />
      <ExploreRow title={tr('home.tarot.journal', 'Dziennik Odczytów', 'Reading Journal')} desc={tr('home.tarot.journalDesc', 'Wszystkie Twoje odczyty tarota w jednym miejscu — wzorce, refleksje i wglądy AI.', 'All your tarot readings in one place — patterns, reflections, and AI insights.')} accent={ac} onPress={() => navigation.navigate('TarotJournal')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.shadowSpread', 'Spread Cienia', 'Shadow Spread')} desc={tr('home.tarot.shadowSpreadDesc', 'Cztery karty: co blokuje, czego unikasz, co czeka.', 'Four cards: what blocks you, what you avoid, and what awaits.')} accent={ac} onPress={() => navigation.navigate('TarotDeckSelection')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.yearCard', 'Karta Roku', 'Year Card')} desc={tr('home.tarot.yearCardDesc', 'Roczna karta tarota oparta na Twoich cyfrach osobistych.', 'A yearly tarot card based on your personal numbers.')} accent={ac} onPress={() => navigation.navigate('YearCard')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.saveClue', 'Zapisz trop z kart', 'Save the card clue')} desc={tr('home.tarot.saveClueDesc', 'Po odczycie nazwij co naprawdę poruszyło Cię w karcie.', 'After the reading, name what truly moved you in the card.')} accent={ac} onPress={() => navigation.navigate('JournalEntry', { type: 'tarot' })} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.runes', 'Runy Futhark', 'Futhark Runes')} desc={tr('home.tarot.runesDesc', 'Rzut runiczny — 24 runy Elder Futhark z pełnymi znaczeniami i prowadzeniem.', 'A rune cast — 24 Elder Futhark runes with full meanings and guidance.')} accent={ac} onPress={() => navigation.navigate('RuneCast')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.angelNumbers', 'Liczby Anielskie', 'Angel Numbers')} desc={tr('home.tarot.angelNumbersDesc', 'Synchroniczności w liczbach — 111, 222, 333 i ich duchowe przesłania.', 'Synchronicities in numbers — 111, 222, 333, and their spiritual messages.')} accent={ac} onPress={() => navigation.navigate('AngelNumbers')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.iching', 'I Ching', 'I Ching')} desc={tr('home.tarot.ichingDesc', 'Starochińska Wyrocznia Przemian — rzut monetami i interpretacja 64 heksagramów.', 'The ancient Chinese Oracle of Changes — coin casting and interpretation of 64 hexagrams.')} accent={ac} onPress={() => navigation.navigate('IChing')} delay={240} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.spreadBuilder', 'Kreator Układów', 'Spread Builder')} desc={tr('home.tarot.spreadBuilderDesc', 'Projektuj własne spready i interpretuj karty z pozycjami.', 'Design your own spreads and interpret cards with positions.')} accent={ac} onPress={() => navigation.navigate('TarotSpreadBuilder')} delay={320} isLight={isLight} />
      <ExploreRow title={tr('home.tarot.divineTiming', 'Boskie Wyczucie Czasu', 'Divine Timing')} desc={tr('home.tarot.divineTimingDesc', 'Kiedy działać? Timing kosmiczny i okna możliwości na 30 dni.', 'When to act? Cosmic timing and windows of opportunity for the next 30 days.')} accent={ac} onPress={() => navigation.navigate('DivineTiming')} delay={360} isLight={isLight} />
    </>
  );

  if (id === 'horoscope') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Star} label={tr('home.horoscope.daily', 'Horoskop dnia', 'Daily horoscope')} sublabel={tr('home.horoscope.dailySub', 'Rytm Twojego znaku zodiaku', 'The rhythm of your zodiac sign')} accent={ac} onPress={() => navigation.navigate('Horoscope')} delay={0} isLight={isLight} />
        <ActionTile icon={Moon} label={tr('home.horoscope.chinese', 'Zodiak chiński', 'Chinese zodiac')} sublabel={tr('home.horoscope.chineseSub', 'Wschodni filtr — zwierzę i żywioł', 'Eastern filter — animal and element')} accent={ac} onPress={() => navigation.navigate('ChineseHoroscope')} delay={60} isLight={isLight} />
        <ActionTile icon={Users} label={tr('home.horoscope.compatibility', 'Zgodność', 'Compatibility')} sublabel={tr('home.horoscope.compatibilitySub', 'Dynamika przyciągania i napięć', 'Dynamics of attraction and tension')} accent={ac} onPress={() => navigation.navigate('Compatibility')} delay={120} isLight={isLight} />
        <ActionTile icon={Heart} label={tr('home.horoscope.partner', 'Horoskop partnera', 'Partner horoscope')} sublabel={tr('home.horoscope.partnerSub', 'Obraz energetyczny drugiej osoby', 'The energetic portrait of another person')} accent={ac} onPress={() => navigation.navigate('PartnerHoroscope')} delay={180} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: (() => { try { const { getZodiacSign } = require('../features/horoscope/utils/astrology'); return getZodiacSign(userData.birthDate).slice(0,4); } catch { return tr('home.metric.yours', 'Twój', 'Yours'); } })(), label: tr('home.metric.sign', 'ZNAK', 'SIGN') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: String(pastSessions.length), label: tr('home.metric.sessions', 'SESJI', 'SESSIONS') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }]} />
      <SectionDivider label={tr('home.horoscope.layers', 'WARSTWY NIEBA', 'LAYERS OF THE SKY')} accent={ac} />
      <ExploreRow title={tr('home.horoscope.natal', 'Karta Urodzenia', 'Birth chart')} desc={tr('home.horoscope.natalDesc', 'Mapa nieba z chwili narodzin — planety, znaki i 12 domów astrologicznych.', 'A sky map from the moment of birth — planets, signs, and the 12 astrological houses.')} accent={ac} onPress={() => navigation.navigate('NatalChart')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.retrogrades', 'Retrogradacje ℞', 'Retrogrades ℞')} desc={tr('home.horoscope.retrogradesDesc', 'Kompletny przewodnik — co robić, czego unikać, kiedy i dlaczego.', 'A complete guide — what to do, what to avoid, when, and why.')} accent={ac} onPress={() => navigation.navigate('Retrogrades')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.signMeditation', 'Medytacja Znaku', 'Sign Meditation')} desc={tr('home.horoscope.signMeditationDesc', 'Spersonalizowana medytacja i afirmacja dla każdego znaku zodiaku.', 'A personalized meditation and affirmation for every zodiac sign.')} accent={ac} onPress={() => navigation.navigate('SignMeditation')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.lunarCalendar', 'Kalendarz Księżycowy', 'Lunar Calendar')} desc={tr('home.horoscope.lunarCalendarDesc', 'Fazy księżyca z algorytmem astronomicznym, intencje nówu i pełni.', 'Moon phases with an astronomical algorithm, plus new moon and full moon intentions.')} accent={ac} onPress={() => navigation.navigate('LunarCalendar')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.annualVision', 'Roczna Wizja', 'Annual Vision')} desc={tr('home.horoscope.annualVisionDesc', 'Rok osobisty z numerologii i astrologiczna prognoza kwartalna na cały rok.', 'A numerological personal year and an astrological quarterly forecast for the whole year.')} accent="#6366F1" onPress={() => navigation.navigate('AnnualForecast')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.zodiacAtlas', 'Atlas Znaków Zodiaku', 'Zodiac Atlas')} desc={tr('home.horoscope.zodiacAtlasDesc', 'Pełny portret każdego znaku — cechy, żywioł, planeta rządząca, cień i dar.', 'A full portrait of every sign — traits, element, ruling planet, shadow, and gift.')} accent={ac} onPress={() => navigation.navigate('ZodiacAtlas')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.soulMatch', 'Dopasowanie Duszy', 'Soul Match')} desc={tr('home.horoscope.soulMatchDesc', 'Energetyczny rezonans i harmonię między znakami zodiaku — numerologia par.', 'Energetic resonance and harmony between zodiac signs — numerology for pairs.')} accent={ac} onPress={() => navigation.navigate('SoulMatch')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.horoscope.partnerMatrix', 'Matryca partnerska', 'Partner Matrix')} desc={tr('home.horoscope.partnerMatrixDesc', 'Porównaj wzorce urodzeniowe dwóch osób — dynamika i napięcia relacyjne.', 'Compare the birth patterns of two people — relational dynamics and tensions.')} accent={ac} onPress={() => navigation.navigate('PartnerMatrix')} delay={240} isLight={isLight} />
    </>
  );

  if (id === 'astrology') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Compass} label={tr('home.astrology.observatory', 'Obserwatorium', 'Observatory')} sublabel={tr('home.astrology.observatorySub', 'Mapa nieba i tranzyty na dziś', 'Sky map and today’s transits')} accent={ac} onPress={() => navigation.navigate('Stars')} delay={0} isLight={isLight} />
        <ActionTile icon={Hash} label={tr('home.astrology.numerology', 'Numerologia', 'Numerology')} sublabel={tr('home.astrology.numerologySub', 'Rok osobisty i liczba drogi życia', 'Personal year and life path number')} accent={ac} onPress={() => navigation.navigate('Numerology')} delay={60} isLight={isLight} />
        <ActionTile icon={Layers} label={tr('home.astrology.matrix', 'Matryca', 'Matrix')} sublabel={tr('home.astrology.matrixSub', 'Wzorce energii urodzeniowej', 'Birth energy patterns')} accent={ac} onPress={() => navigation.navigate('Matrix')} delay={120} isLight={isLight} />
        <ActionTile icon={Zap} label={tr('home.astrology.biorhythm', 'Biorytmy', 'Biorhythms')} sublabel={tr('home.astrology.biorhythmSub', 'Fizyczny, emocjonalny i intelektualny cykl', 'Physical, emotional, and intellectual cycles')} accent={ac} onPress={() => navigation.navigate('Biorhythm')} delay={180} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: tr('home.metric.active', 'Aktywne', 'Active'), label: tr('home.metric.cycles', 'CYKLE', 'CYCLES') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: tr('home.metric.map', 'Mapa', 'Map'), label: tr('home.metric.transits', 'TRANZYTY', 'TRANSITS') }, { val: tr('home.metric.visible', 'Widoczne', 'Visible'), label: tr('home.metric.patterns', 'WZORCE', 'PATTERNS') }]} />
      <SectionDivider label={tr('home.astrology.layers', 'GŁĘBSZE WARSTWY', 'DEEPER LAYERS')} accent={ac} />
      <ExploreRow title={tr('home.astrology.portals', 'Portale Kosmiczne', 'Cosmic portals')} desc={tr('home.astrology.portalsDesc', 'Aktywne okna energetyczne — portale, progi i naturalne punkty zwrotne w cyklu roku.', 'Active energetic windows — portals, thresholds, and natural turning points in the yearly cycle.')} accent={ac} onPress={() => navigation.navigate('CosmicPortals')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.reports', 'Raporty energetyczne', 'Energy reports')} desc={tr('home.astrology.reportsDesc', 'Historia odczytów i wskaźniki aktywności duchowej.', 'The history of readings and indicators of spiritual activity.')} accent={ac} onPress={() => navigation.navigate('Reports')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.note', 'Notatka astrologiczna', 'Astrology note')} desc={tr('home.astrology.noteDesc', 'Zapisz które cykle nieba odbijają się w Twojej codzienności.', 'Write down which sky cycles are reflected in your daily life.')} accent={ac} onPress={() => navigation.navigate('JournalEntry', { type: 'reflection' })} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.cycles', 'Cykle Planetarne', 'Planetary Cycles')} desc={tr('home.astrology.cyclesDesc', 'Retrogady, konjunkcje, aspekty — bieżące energie planetarne w czasie rzeczywistym.', 'Retrogrades, conjunctions, and aspects — current planetary energies in real time.')} accent={ac} onPress={() => navigation.navigate('AstrologyCycles')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.weather', 'Kosmiczna Pogoda', 'Cosmic weather')} desc={tr('home.astrology.weatherDesc', 'Syntetyczna prognoza energetyczna dnia z oceną planetarną, numerologiczną i księżycową.', 'A synthetic energetic forecast of the day with planetary, numerological, and lunar scoring.')} accent={ac} onPress={() => navigation.navigate('CosmicWeather')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.vedic', 'Astrologia wedyjska', 'Vedic Astrology')} desc={tr('home.astrology.vedicDesc', 'Jyotish, nakshatra, yogas — indyjski system planet i domów w Twojej karcie urodzeniowej.', 'Jyotish, nakshatras, yogas — the Indian system of planets and houses in your birth chart.')} accent={ac} onPress={() => navigation.navigate('VedicAstrology')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.astrology.transits', 'Tranzyty Planetarne', 'Planetary transits')} desc={tr('home.astrology.transitsDesc', 'Aktualne tranzyty planet — przejścia przez Twój horoskop i ich codzienne wpływy.', 'Current planetary transits — how they move through your chart and shape the day.')} accent={ac} onPress={() => navigation.navigate('AstroTransits')} delay={240} isLight={isLight} />
    </>
  );

  if (id === 'support') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Heart} label={tr('home.support.affirmations', 'Afirmacje', 'Affirmations')} sublabel={tr('home.support.affirmationsSub', 'Codzienne zdanie, które wzmacnia', 'A daily sentence that strengthens you')} accent={ac} onPress={() => navigation.navigate('Affirmations')} delay={0} isLight={isLight} />
        <ActionTile icon={Flower2} label={tr('home.support.gratitude', 'Wdzięczność', 'Gratitude')} sublabel={tr('home.support.gratitudeSub', 'Trzy sloty wdzięczności i refleksja', 'Three gratitude slots and reflection')} accent={ac} onPress={() => navigation.navigate('Gratitude')} delay={60} isLight={isLight} />
        <ActionTile icon={Layers} label={tr('home.support.chakras', 'Chakry', 'Chakras')} sublabel={tr('home.support.chakrasSub', '7 centrów energetycznych ciała', '7 energetic centers of the body')} accent={ac} onPress={() => navigation.navigate('Chakra')} delay={120} isLight={isLight} />
        <ActionTile icon={Waves} label={tr('home.support.soundBath', 'Kąpiel dźwiękowa', 'Sound Bath')} sublabel={tr('home.support.soundBathSub', '5 pejzaży dźwiękowych z timerem', '5 soundscapes with a timer')} accent={ac} onPress={() => navigation.navigate('SoundBath')} delay={180} isLight={isLight} />
        <ActionTile icon={Gem} label={tr('home.support.crystals', 'Kryształy', 'Crystals')} sublabel={tr('home.support.crystalsSub', 'Przewodnik i odczyt kryształowy', 'Crystal guide and crystal reading')} accent={ac} onPress={() => navigation.navigate('CrystalGuide')} delay={240} isLight={isLight} fullWidth />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: tr('home.metric.active', 'Aktywne', 'Active'), label: tr('home.metric.affirmations', 'AFIRMACJE', 'AFFIRMATIONS') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }]} />
      <SectionDivider label={tr('home.support.ecosystem', 'EKOSYSTEM WSPARCIA', 'SUPPORT ECOSYSTEM')} accent={ac} />
      <ExploreRow title={tr('home.support.innerChild', 'Wewnętrzne Dziecko', 'Inner Child')} desc={tr('home.support.innerChildDesc', 'Praca z traumą wczesnodziecięcą — dialog, list i uzdrowienie.', 'Work with early childhood trauma — dialogue, letters, and healing.')} accent={ac} onPress={() => navigation.navigate('InnerChild')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.support.anxietyRelief', 'Ulga od Lęku', 'Anxiety Relief')} desc={tr('home.support.anxietyReliefDesc', 'Techniki SOS, 5-4-3-2-1, oddech i codzienne nawyki.', 'SOS techniques, 5-4-3-2-1 grounding, breath, and daily habits.')} accent={ac} onPress={() => navigation.navigate('AnxietyRelief')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.support.selfCompassion', 'Współczucie dla Siebie', 'Self-Compassion')} desc={tr('home.support.selfCompassionDesc', '3 filary Kristin Neff — traktuj siebie jak przyjaciela.', 'Kristin Neff’s 3 pillars — treat yourself like a friend.')} accent={ac} onPress={() => navigation.navigate('SelfCompassion')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.support.healingFrequencies', 'Częstotliwości Uzdrowienia', 'Healing Frequencies')} desc={tr('home.support.healingFrequenciesDesc', '9 częstotliwości Solfeggio z timerem — 174 Hz do 963 Hz.', '9 Solfeggio frequencies with a timer — from 174 Hz to 963 Hz.')} accent={ac} onPress={() => navigation.navigate('HealingFrequencies')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.support.anchors', 'Kotwice Emocjonalne', 'Emotional Anchors')} desc={tr('home.support.anchorsDesc', 'NLP kotwiczenie, gotowe kotwice i techniki stabilizacji.', 'NLP anchoring, ready-made anchors, and stabilization techniques.')} accent={ac} onPress={() => navigation.navigate('EmotionalAnchors')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.support.crystalBall', 'Kryształowa Kula', 'Crystal Ball')} desc={tr('home.support.crystalBallDesc', 'Kryształ i zwierciadło AI odpowiadają na Twoje pytania.', 'The crystal and AI mirror answer your questions.')} accent={ac} onPress={() => navigation.navigate('CrystalBall')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.support.personalMantra', 'Mantra Osobista', 'Personal Mantra')} desc={tr('home.support.personalMantraDesc', 'Generuj mantry dopasowane do intencji i praktykuj tradycją 108 powtórzeń.', 'Generate intention-matched mantras and practice the tradition of 108 repetitions.')} accent={ac} onPress={() => navigation.navigate('PersonalMantra')} delay={240} isLight={isLight} />
      <ExploreRow title={tr('home.support.colorTherapy', 'Terapia Kolorem', 'Color Therapy')} desc={tr('home.support.colorTherapyDesc', 'Chromterapia — barwy jako nośniki energii, nastroju i uzdrowienia.', 'Chromotherapy — colors as carriers of energy, mood, and healing.')} accent={ac} onPress={() => navigation.navigate('ColorTherapy')} delay={280} isLight={isLight} />
    </>
  );

  if (id === 'cleansing') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Wind} label={tr('home.cleansing.breathRhythm', 'Rytm oddechu', 'Breath Rhythm')} sublabel={tr('home.cleansing.breathRhythmSub', '4-7-8, pudełkowy, Wim Hof', '4-7-8, box breathing, Wim Hof')} accent={ac} onPress={() => navigation.navigate('Breathwork')} delay={0} isLight={isLight} />
        <ActionTile icon={Moon} label={tr('home.cleansing.moonRitual', 'Rytuał Księżycowy', 'Moon Ritual')} sublabel={tr('home.cleansing.moonRitualSub', 'Ceremonia pełni i nówu', 'New moon and full moon ceremony')} accent={ac} onPress={() => navigation.navigate('MoonRitual')} delay={60} isLight={isLight} />
        <ActionTile icon={Droplets} label={tr('home.cleansing.cleansing', 'Oczyszczanie', 'Cleansing')} sublabel={tr('home.cleansing.cleansingSub', 'Rytuał uwalniania i granic', 'A ritual of release and boundaries')} accent={ac} onPress={() => navigation.navigate('Cleansing')} delay={120} isLight={isLight} />
        <ActionTile icon={Zap} label={tr('home.cleansing.brainwaves', 'Fale mózgowe', 'Brainwaves')} sublabel={tr('home.cleansing.brainwavesSub', 'Reset napięcia i głęboki spokój', 'A reset for tension and deep calm')} accent={ac} onPress={() => navigation.navigate('BinauralBeats')} delay={180} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }]} />
      <SectionDivider label={tr('home.cleansing.tools', 'NARZĘDZIA UWOLNIENIA', 'TOOLS OF RELEASE')} accent={ac} />
      <ExploreRow title={tr('home.cleansing.protection', 'Rytuał Ochrony', 'Protection Ritual')} desc={tr('home.cleansing.protectionDesc', 'Animowana tarcza 3D, 5-krokowy rytuał ochrony i kryształy.', 'An animated 3D shield, a 5-step protection ritual, and crystals.')} accent={ac} onPress={() => navigation.navigate('ProtectionRitual')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.cleansing.saltBath', 'Kąpiel Solna', 'Salt Bath')} desc={tr('home.cleansing.saltBathDesc', '3 protokoły oczyszczająco-uzdrawiające z timerem i intencją.', '3 cleansing and healing protocols with a timer and intention.')} accent={ac} onPress={() => navigation.navigate('SaltBath')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.cleansing.releaseLetters', 'Listy Uwalniające', 'Release Letters')} desc={tr('home.cleansing.releaseLettersDesc', 'Ceremonia pisania i symbolicznego spalenia — uwolnij żal i ból.', 'A ceremony of writing and symbolic burning — release grief and pain.')} accent={ac} onPress={() => navigation.navigate('ReleaseLetters')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.cleansing.palmReading', 'Chiromancja energetyczna', 'Energetic Palm Reading')} desc={tr('home.cleansing.palmReadingDesc', 'AI odczyta linie energii, granicy i uwalniania z Twojej dłoni.', 'AI reads the lines of energy, boundaries, and release from your palm.')} accent={ac} onPress={() => navigation.navigate('PalmReading')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.cleansing.herbalAlchemy', 'Alchemia Ziół', 'Herbal Alchemy')} desc={tr('home.cleansing.herbalAlchemyDesc', 'Dobierz zioła oczyszczające — bylica, szałwia, kadzidłowiec i ich rytualne zastosowania.', 'Choose cleansing herbs — mugwort, sage, frankincense, and their ritual uses.')} accent={ac} onPress={() => navigation.navigate('HerbalAlchemy')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.cleansing.crystalGrid', 'Siatka Kryształów', 'Crystal Grid')} desc={tr('home.cleansing.crystalGridDesc', 'Geometria ochronna i oczyszczająca — zbuduj siatkę z intencją uwalniania.', 'Protective and cleansing geometry — build a grid with an intention of release.')} accent={ac} onPress={() => navigation.navigate('CrystalGrid')} delay={200} isLight={isLight} />
    </>
  );

  if (id === 'rituals') return (
    <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Flame} label={tr('home.rituals.aiRitual', 'Rytuał AI', 'AI Ritual')} sublabel={tr('home.rituals.aiRitualSub', 'Spersonalizowana ceremonia na dziś', 'A personalized ceremony for today')} accent={ac} onPress={() => navigation.navigate('DailyRitualAI')} delay={0} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.rituals.library', 'Biblioteka rytuałów', 'Ritual Library')} sublabel={tr('home.rituals.librarySub', 'Przeglądaj według intencji i pory', 'Browse by intention and time of day')} accent={ac} onPress={() => navigation.navigate('RitualCategorySelection')} delay={60} isLight={isLight} />
        <ActionTile icon={Star} label={tr('home.rituals.journeys', 'Podróże duchowe', 'Spiritual Journeys')} sublabel={tr('home.rituals.journeysSub', 'Wielodniowe ścieżki transformacji', 'Multi-day paths of transformation')} accent={ac} onPress={() => navigation.navigate('Journeys')} delay={120} isLight={isLight} />
        <ActionTile icon={BookOpen} label={tr('home.rituals.intentionCards', 'Karty Intencji', 'Intention Cards')} sublabel={tr('home.rituals.intentionCardsSub', 'Wizualizuj i zapamiętaj intencję', 'Visualize and remember your intention')} accent={ac} onPress={() => navigation.navigate('IntentionCards')} delay={180} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} isLight={isLight} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }, { val: dailyPlan.ritualGuidance?.featured?.duration || '15m', label: tr('home.metric.time', 'CZAS', 'TIME') }, { val: dailyPlan.ritualGuidance?.featured?.category?.slice(0,5) || tr('home.metric.morning', 'Rano', 'Morning'), label: tr('home.metric.mode', 'TRYB', 'MODE') }]} />
      <SectionDivider label={tr('home.rituals.ceremonial', 'PRAKTYKI CEREMONIALNE', 'CEREMONIAL PRACTICES')} accent={ac} />
      <ExploreRow title={tr('home.rituals.fireCeremony', 'Ceremonia Ognia', 'Fire Ceremony')} desc={tr('home.rituals.fireCeremonyDesc', 'Rytuał transformacji z animowanym ogniem — spalaj stare wzorce.', 'A ritual of transformation with animated fire — burn old patterns away.')} accent={ac} onPress={() => navigation.navigate('FireCeremony')} delay={0} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.ancestors', 'Połączenie z Przodkami', 'Ancestral Connection')} desc={tr('home.rituals.ancestorsDesc', 'Drzewo genealogiczne, archetypy przodków i rytuał połączenia.', 'A family tree, ancestral archetypes, and a ritual of connection.')} accent={ac} onPress={() => navigation.navigate('AncestralConnection')} delay={40} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.morningRitual', 'Poranny Rytuał', 'Morning Ritual')} desc={tr('home.rituals.morningRitualDesc', 'Kompletna poranna praktyka: oddech, afirmacja, intencja, mantra, wdzięczność.', 'A complete morning practice: breath, affirmation, intention, mantra, gratitude.')} accent={ac} onPress={() => navigation.navigate('MorningRitual')} delay={60} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.premiumMeditation', 'Medytacja premium', 'Premium Meditation')} desc={tr('home.rituals.premiumMeditationDesc', 'Timer, techniki immersyjne i historia sesji.', 'A timer, immersive techniques, and session history.')} accent={ac} onPress={() => navigation.navigate('Meditation')} delay={80} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.liveRituals', 'Rytuały na żywo', 'Live Rituals')} desc={tr('home.rituals.liveRitualsDesc', 'Dołącz do grupowego rytuału lub stwórz własną ceremonię dla społeczności.', 'Join a group ritual or create your own ceremony for the community.')} accent={ac} onPress={() => navigation.navigate('LiveRituals')} delay={120} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.achievements', 'Osiągnięcia praktyki', 'Practice Achievements')} desc={tr('home.rituals.achievementsDesc', 'Odznaki, serie i kamienie milowe Twojej duchowej ścieżki.', 'Badges, streaks, and milestones on your spiritual path.')} accent={ac} onPress={() => navigation.navigate('Achievements')} delay={160} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.manifestation', 'Manifestacja', 'Manifestation')} desc={tr('home.rituals.manifestationDesc', 'Techniki 333/369/555, tablice intencji i alignment z Księżycem.', '333/369/555 techniques, intention boards, and alignment with the Moon.')} accent={ac} onPress={() => navigation.navigate('Manifestation')} delay={200} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.sananga', '🌿 Sananga', '🌿 Sananga')} desc={tr('home.rituals.sanangaDesc', 'Święte amazońskie krople oczne — oczyszczenie duchowego wzroku i usunięcie panema.', 'Sacred Amazonian eye drops — cleansing spiritual sight and removing panema.')} accent={ac} onPress={() => navigation.navigate('Sananga')} delay={240} isLight={isLight} />
      <ExploreRow title={tr('home.rituals.rape', '🪬 Rapé / Hapé', '🪬 Rapé / Hapé')} desc={tr('home.rituals.rapeDesc', 'Święta tabaka ceremonialna — uziemienie, oczyszczenie energetyczne i połączenie z Ziemią.', 'Sacred ceremonial snuff — grounding, energetic cleansing, and connection with the Earth.')} accent={ac} onPress={() => navigation.navigate('Rape')} delay={280} isLight={isLight} />
    </>
  );

  if (id === 'dreams') {
    const dreamEntries = entries.filter((e: any) => e.type === 'dream');
    return (
      <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <ActionTile icon={BookOpen} label={tr('home.dreams.archive', 'Archiwum snów', 'Dream Archive')} sublabel={tr('home.dreams.archiveSub', 'Przeglądaj sny i symbolarium', 'Browse dreams and the symbolarium')} accent={ac} onPress={() => navigation.navigate('Dreams')} delay={0} isLight={isLight} />
          <ActionTile icon={Moon} label={tr('home.dreams.record', 'Zapisz sen', 'Record a Dream')} sublabel={tr('home.dreams.recordSub', 'Jeden obraz wystarczy na start', 'One image is enough to begin')} accent={ac} onPress={() => navigation.navigate('JournalEntry', { type: 'dream' })} delay={60} isLight={isLight} />
          <ActionTile icon={Sparkles} label={tr('home.dreams.interpreter', 'Interpreter snów', 'Dream Interpreter')} sublabel={tr('home.dreams.interpreterSub', 'Analiza obrazu, emocji i przesłania', 'Analysis of image, emotion, and message')} accent={ac} onPress={() => navigation.navigate('DreamInterpreter')} delay={120} isLight={isLight} />
          <ActionTile icon={Star} label={tr('home.dreams.helper', 'Pomocnik snu', 'Sleep Helper')} sublabel={tr('home.dreams.helperSub', 'Wieczorna rutyna i wsparcie snu', 'Evening routine and sleep support')} accent={ac} onPress={() => navigation.navigate('SleepHelper')} delay={180} isLight={isLight} />
        </View>
        <MetricsStrip accent={ac} isLight={isLight} items={[{ val: String(dreamEntries.length), label: tr('home.metric.dreams', 'SNY', 'DREAMS') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: dreamEntries.length > 0 ? tr('home.metric.active', 'Aktywne', 'Active') : tr('home.metric.waitingPlural', 'Czekają', 'Waiting'), label: tr('home.metric.symbols', 'SYMBOLE', 'SYMBOLS') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }]} />
        <SectionDivider label={tr('home.dreams.nightWork', 'NOCNA PRACA', 'NIGHT WORK')} accent={ac} />
        <ExploreRow title={tr('home.dreams.lucid', 'Świadome Śnienie', 'Lucid Dreaming')} desc={tr('home.dreams.lucidDesc', 'Techniki WILD, MILD, WBTB i testy rzeczywistości — wejdź w swój sen.', 'WILD, MILD, WBTB, and reality checks — step inside your dream.')} accent={ac} onPress={() => navigation.navigate('LucidDreaming')} delay={0} isLight={isLight} />
        <ExploreRow title={tr('home.dreams.ritual', 'Rytuał Snu', 'Sleep Ritual')} desc={tr('home.dreams.ritualDesc', '7-krokowy protokół wieczorny, skanowanie ciała i oddech 4-7-8.', 'A 7-step evening protocol, body scan, and 4-7-8 breath.')} accent={ac} onPress={() => navigation.navigate('SleepRitual')} delay={40} isLight={isLight} />
        <ExploreRow title={tr('home.dreams.library', 'Biblioteka symboli', 'Symbol Library')} desc={tr('home.dreams.libraryDesc', 'Znaczenie archetypów, kolorów i motywów nocnych.', 'The meaning of archetypes, colors, and nocturnal motifs.')} accent={ac} onPress={() => navigation.navigate('Knowledge')} delay={80} isLight={isLight} />
        <ExploreRow title={tr('home.dreams.partnerJournal', 'Dziennik Pary', 'Partner Journal')} desc={tr('home.dreams.partnerJournalDesc', 'Wspólna przestrzeń dla dwojga — wpisy i harmonia.', 'A shared space for two — entries and harmony.')} accent={ac} onPress={() => navigation.navigate('PartnerJournal')} delay={120} isLight={isLight} />
      </>
    );
  }

  return null;
};

// ── MAIN SCREEN ────────────────────────────────────────────────

export const HomeScreen = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const tr = useCallback((key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options })
  ), [t]);
  const insets = useSafeAreaInsets();
  const userData = useAppStore(s => s.userData);
  const streaks = useAppStore(s => s.streaks);
  const experience = useAppStore(s => s.experience);
  const checkInToday = useAppStore(s => s.checkInToday);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const setExperience = useAppStore(s => s.setExperience);
  const { currentTheme, isLight, themeName, themeMode } = useTheme();
  const { entries } = useJournalStore();
  const { pastSessions } = useOracleStore();
  const { isPremium } = usePremiumStore();
  const { dailyDraw, clearExpiredDailyDraw, pastReadings, selectedDeckId } = useTarotStore();
  const [dailyPlan, setDailyPlan] = useState<DailySoulPlan | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiBannerMessage, setAiBannerMessage] = useState('');
  const [aiBannerLoading, setAiBannerLoading] = useState(false);
  const lastSurface = useRef(null);
  const mainScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkInToday();
    clearExpiredDailyDraw();
    // Defer heavy computation until after navigation transition completes
    const task = InteractionManager.runAfterInteractions(() => {
      setDailyPlan(SoulEngineService.generateDailyPlan());
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    const s = route?.params?.surface;
    if (!s || lastSurface.current === s) return;
    const idx = SURFACES.findIndex(x => x.id === s);
    if (idx >= 0) { setActiveIndex(idx); (lastSurface as any).current = s; }
  }, [route?.params?.surface]);

  const firstName = userData.name?.trim() || tr('home.fallbackName', 'Wędrowcze', 'Traveler');
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? 'rgba(40,28,16,0.72)' : 'rgba(245,241,234,0.55)';
  const localizedSurfaces = useMemo(() => SURFACES.map((surface) => ({
    ...surface,
    title: ({
      ty: tr('home.surface.self', 'Ty', 'You'),
      tarot: tr('home.surface.tarot', 'Tarot', 'Tarot'),
      horoscope: tr('home.surface.horoscope', 'Horoskop', 'Horoscope'),
      astrology: tr('home.surface.astrology', 'Astrologia', 'Astrology'),
      support: tr('home.surface.support', 'Wsparcie', 'Support'),
      cleansing: tr('home.surface.cleansing', 'Oczyszczanie', 'Cleansing'),
      rituals: tr('home.surface.rituals', 'Rytuały', 'Rituals'),
      dreams: tr('home.surface.dreams', 'Sny', 'Dreams'),
    } as Record<string, string>)[surface.id] || surface.title,
    eyebrow: ({
      ty: tr('home.surface.selfEyebrow', 'OSOBISTE SANKTUARIUM', 'PERSONAL SANCTUARY'),
      tarot: tr('home.surface.tarotEyebrow', 'KARTY I SYMBOL', 'CARDS AND SYMBOLS'),
      horoscope: tr('home.surface.horoscopeEyebrow', 'ZNAK I CYKL', 'SIGN AND CYCLE'),
      astrology: tr('home.surface.astrologyEyebrow', 'MAPA NIEBA', 'SKY MAP'),
      support: tr('home.surface.supportEyebrow', 'UKOJENIE I SIŁA', 'SOOTHING AND STRENGTH'),
      cleansing: tr('home.surface.cleansingEyebrow', 'UWOLNIENIE I ODDECH', 'RELEASE AND BREATH'),
      rituals: tr('home.surface.ritualsEyebrow', 'INTENCJA I CEREMONIA', 'INTENTION AND CEREMONY'),
      dreams: tr('home.surface.dreamsEyebrow', 'SYMBOL NOCY', 'SYMBOL OF THE NIGHT'),
    } as Record<string, string>)[surface.id] || surface.eyebrow,
  })), [tr]);
  const worldDescs = useMemo<Record<string, string>>(() => ({
    ty: tr('home.world.selfDesc', 'Rdzeń Twojej ścieżki: dziennik, archetyp, kontrakt duszy i osobista mapa wzrostu.', 'The core of your path: journal, archetype, soul contract, and your personal map of growth.'),
    tarot: tr('home.world.tarotDesc', 'Karty, rozkłady i symbole, które odsłaniają ukryte warstwy dnia, relacji i decyzji.', 'Cards, spreads, and symbols that reveal the hidden layers of the day, relationships, and decisions.'),
    horoscope: tr('home.world.horoscopeDesc', 'Znak, relacje i kosmiczny rytm osobisty odczytywany przez codzienne wpływy nieba.', 'Sign, relationships, and a personal cosmic rhythm read through the sky’s daily influences.'),
    astrology: tr('home.world.astrologyDesc', 'Tranzyty, cykle i obserwatorium nieba, które pokazują timing, napięcie i możliwości.', 'Transits, cycles, and a sky observatory that reveal timing, tension, and opportunities.'),
    support: tr('home.world.supportDesc', 'Przestrzeń regeneracji: afirmacje, dźwięk, chakry i miękkie praktyki powrotu do siebie.', 'A space for restoration: affirmations, sound, chakras, and gentle practices of returning to yourself.'),
    cleansing: tr('home.world.cleansingDesc', 'Uwalnianie napięcia, ochrona pola i oczyszczające praktyki oddechu, rytuału i materii.', 'The release of tension, field protection, and cleansing practices of breath, ritual, and matter.'),
    rituals: tr('home.world.ritualsDesc', 'Ceremonie, intencje i wielodniowe ścieżki przemiany prowadzone z większą głębią.', 'Ceremonies, intentions, and multi-day paths of transformation guided with greater depth.'),
    dreams: tr('home.world.dreamsDesc', 'Praca ze snem, symbolami i nocną świadomością, która odsłania to, co zwykle ukryte.', 'Work with dreams, symbols, and nocturnal awareness that reveals what is usually hidden.'),
  }), [tr]);
  const tarotDeck = useMemo(() => getTarotDeckById(dailyDraw?.deckId || selectedDeckId), [dailyDraw?.deckId, selectedDeckId]);
  const dailyTarotPreview = useMemo(() => dailyDraw ? buildTarotCardInterpretation(dailyDraw.card, dailyDraw.isReversed, { question: 'Jaki ton prowadzi mnie dziś?', mode: 'solo' }) : null, [dailyDraw]);

  useEffect(() => {
    if (!AiService.isLaunchAvailable()) { setAiBannerMessage(tr('home.aiBanner.fallback', 'Każdy dzień niesie wgląd, który jest tylko dla Ciebie.', 'Every day carries an insight meant only for you.')); return; }
    setAiBannerLoading(true);
    const name = userData.name || '';
    const intention = userData.primaryIntention || 'spokój i wewnętrzna jasność';
    const prompt = name
      ? `Napisz jedno zdanie porannego prowadzenia dla ${name}. Intencja: ${intention}. Max 18 słów. Bez nagłówków.`
      : `Napisz jedno zdanie porannego prowadzenia. Intencja: ${intention}. Max 18 słów. Bez nagłówków.`;
    AiService.chatWithOracleAdvanced([{ role: 'user', content: prompt }], undefined, { mode: 'gentle', kind: 'morning', source: 'home' })
      .then(msg => setAiBannerMessage(msg.trim().replace(/^["']|["']$/g, '')))
      .catch(() => setAiBannerMessage(tr('home.aiBanner.fallback', 'Każdy dzień niesie wgląd, który jest tylko dla Ciebie.', 'Every day carries an insight meant only for you.')))
      .finally(() => setAiBannerLoading(false));
  }, [tr]);

  const activeSurface = localizedSurfaces[activeIndex];

  const handleMusicToggle = useCallback(() => {
    const next = !experience.backgroundMusicEnabled;
    setExperience({ backgroundMusicEnabled: next });
    AudioService.setMusicEnabled(next);
  }, [experience.backgroundMusicEnabled, setExperience]);

  const handleSelectWorld = useCallback((i: number) => setActiveIndex(i), []);

  if (!dailyPlan) {
    return (
      <View style={[hs.container, { backgroundColor: currentTheme.background }]}>
        <SafeAreaView edges={['top']} style={hs.safe}>
          <View style={hs.loading}><ActivityIndicator color="#CEAE72" /></View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[hs.container, { backgroundColor: currentTheme.background }]}>
      {/* Full-screen world background */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {isLight
          ? <LinearGradient colors={[currentTheme.background, activeSurface.accent + '14', currentTheme.background]} style={StyleSheet.absoluteFill} />
          : React.createElement(activeSurface.BG)
        }
      </View>

      <SafeAreaView edges={['top']} style={hs.safe}>
        {/* HEADER */}
        <View style={hs.header}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={[hs.brand, { color: isLight ? '#A97A39' : '#CEAE72' }]}>✦ AETHERA</Text>
            <Text style={[hs.greeting, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
              {getTimeGreeting(firstName)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable onPress={() => navigation.navigate('Search')} hitSlop={8} style={{ padding: 4 }}>
              <Search size={19} color={isLight ? '#A97A39' : '#CEAE72'} strokeWidth={1.8} />
            </Pressable>
            <MusicToggleButton color={isLight ? '#A97A39' : '#CEAE72'} size={20} />
            <Pressable onPress={() => navigateToMainTab(navigation, 'Profile')}>
              <ProfileAvatar size={38} fallbackText={firstName.charAt(0).toUpperCase()} primary='#CEAE72' borderColor='rgba(206,174,114,0.35)' backgroundColor={isLight ? 'rgba(206,174,114,0.12)' : 'rgba(206,174,114,0.15)'} textColor='#CEAE72' />
            </Pressable>
          </View>
        </View>

        {/* WORLD PILL NAVIGATION */}
        <WorldPillNav surfaces={localizedSurfaces as any} activeIndex={activeIndex} onSelect={handleSelectWorld} isLight={isLight} />

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          ref={mainScrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[hs.scroll, { paddingBottom: screenContracts.bottomInset(insets.bottom, 'standard') + 80 }]}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          {/* AI Daily message */}
          {(aiBannerMessage || aiBannerLoading) && (
            <Animated.View entering={FadeInDown.duration(320)} style={[hs.aiBanner, { borderColor: activeSurface.accent + '30', backgroundColor: activeSurface.accent + '0A' }]}>
              {aiBannerLoading
                ? <ActivityIndicator size="small" color={activeSurface.accent} />
                : <><Sparkles color={activeSurface.accent} size={13} style={{ marginTop: 2 }} /><Text style={[hs.aiBannerText, { color: isLight ? '#2A1F0E' : '#E8E0D4', flex: 1 }]}>{aiBannerMessage}</Text></>
              }
            </Animated.View>
          )}

          {/* COSMIC NEWS STRIP — negative margin escapes parent paddingHorizontal:22 */}
          <View style={{ marginHorizontal: -22 }}>
            <CosmicNewsStrip isLight={isLight} accent={activeSurface.accent} />
          </View>

          {/* WORLD HERO — Living Portal */}
          <Animated.View key={activeSurface.id} entering={FadeIn.duration(280)} style={hs.heroSection}>
            {/* Glassmorphism hero card */}
            <View style={[hs.heroCard, {
              borderColor: activeSurface.accent + (isLight ? '44' : '2A'),
              shadowColor: activeSurface.accent,
              shadowOpacity: isLight ? 0.18 : 0.28,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 8 },
              elevation: 14,
            }]}>
              <LinearGradient
                colors={isLight
                  ? [activeSurface.accent + '14', 'rgba(255,255,255,0.92)', activeSurface.accent + '0A'] as [string,string,string]
                  : [activeSurface.accent + '18', 'rgba(8,6,22,0.82)', activeSurface.accent + '0C'] as [string,string,string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Top shimmer bar */}
              <LinearGradient
                colors={['transparent', activeSurface.accent + 'CC', 'transparent'] as [string,string,string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, opacity: isLight ? 1 : 0.7 }}
                pointerEvents="none"
              />
              {/* Frosted top highlight */}
              <LinearGradient
                colors={isLight ? ['rgba(255,255,255,0.75)', 'rgba(255,255,255,0.0)'] as [string,string] : ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.0)'] as [string,string]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 44, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
                pointerEvents="none"
              />
              {/* Animated orb */}
              <AnimatedCelestialOrb accent={activeSurface.accent} isLight={isLight} />
              <Text style={[hs.heroEyebrow, { color: activeSurface.accent }]}>{activeSurface.eyebrow}</Text>
              <Text style={[hs.heroTitle, { color: textColor }]}>{activeSurface.title}</Text>
              <Text style={[hs.heroDesc, { color: subColor }]}>{worldDescs[activeSurface.id]}</Text>
              {/* Accent divider */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 10 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: activeSurface.accent + '28' }} />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: activeSurface.accent, opacity: 0.8 }} />
                <View style={{ flex: 1, height: 1, backgroundColor: activeSurface.accent + '28' }} />
              </View>
              {dailyPlan.oracleMessage && activeIndex === 0 && (
                <Text style={[hs.heroMessage, { color: isLight ? 'rgba(40,28,16,0.72)' : 'rgba(235,228,218,0.72)' }]}>{dailyPlan.oracleMessage}</Text>
              )}
            </View>
          </Animated.View>

          {/* QUICK ACTION RIBBON */}
          <Animated.View entering={FadeInDown.delay(120).duration(300)} style={{ marginBottom: 22 }}>
            <Text style={[hs.ribbonLabel, { color: activeSurface.accent + 'AA' }]}>SZYBKI DOSTĘP</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 2, paddingRight: 22, gap: 8, paddingVertical: 4 }}
              overScrollMode="never"
            >
              {QUICK_ACTIONS.map((item, idx) => (
                <QuickActionPill key={item.id} item={item} navigation={navigation} isLight={isLight} index={idx} />
              ))}
            </ScrollView>
          </Animated.View>

          {/* PER-WORLD CONTENT */}
          <View key={activeSurface.id + '_content'}>
            {renderContent(activeSurface.id, navigation, dailyPlan, userData, entries, streaks, dailyDraw, dailyTarotPreview, pastReadings, pastSessions, tarotDeck, isPremium, isLight, addFavoriteItem, tr)}
          </View>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const hs = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 6, paddingBottom: 10 },
  musicBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  brand: { fontSize: 11, fontWeight: '800', letterSpacing: 3.5, marginBottom: 2 },
  greeting: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  scroll: { paddingHorizontal: 22, paddingTop: 12 },
  aiBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  aiBannerText: { fontSize: 13, lineHeight: 20, letterSpacing: 0.1 },
  heroSection: { alignItems: 'center', paddingVertical: 4, marginBottom: 20 },
  heroCard: {
    width: '100%', borderRadius: 28, borderWidth: 1.5, overflow: 'hidden',
    paddingTop: 22, paddingBottom: 20, paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, marginTop: 10, marginBottom: 6 },
  heroTitle: { fontSize: 40, fontWeight: '200', letterSpacing: -1.5, marginBottom: 8 },
  heroDesc: { fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 12, marginBottom: 12 },
  heroMessage: { fontSize: 13, lineHeight: 21, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 16, paddingBottom: 4 },
  ribbonLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 2.4, marginBottom: 10 },
});
