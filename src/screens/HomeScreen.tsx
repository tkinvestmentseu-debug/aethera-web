// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions, ActivityIndicator, InteractionManager } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, Moon, Star, Flame, Droplets, Heart, BookOpen, Layers, Waves, Wind, ChevronRight, Brain, Zap, Eye, Hash, Users, Compass, Sun, Flower2, Calendar, Target, Gem, CheckSquare2 } from 'lucide-react-native';
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

import Animated, {
  FadeInDown, FadeIn,
  useAnimatedStyle, useSharedValue, withSpring, withTiming,
  withRepeat, interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width: SW } = Dimensions.get('window');
const TILE_W = (SW - 44 - 10) / 2;

// ── WORLD BACKGROUNDS ──────────────────────────────────────────

const TyBackground = () => (
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
);

const TarotWorldBackground = () => (
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
);

const HoroscopeWorldBackground = () => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={['#07060F', '#0D0A1A', '#141026']} style={StyleSheet.absoluteFill} />
    <Svg width={SW} height={SW} style={StyleSheet.absoluteFill} opacity={0.19}>
      <G>
        {[160,115,76,42].map((r,i) => (<Circle key={i} cx={SW/2} cy={180} r={r} stroke="#A78BFA" strokeWidth={0.7} fill="none" strokeDasharray={i%2===0?'5 8':'2 5'} opacity={0.48-i*0.08} />))}
        {Array.from({ length: 12 }, (_, i) => { const a=(i*30-90)*Math.PI/180; return <Circle key={i} cx={SW/2+Math.cos(a)*160} cy={180+Math.sin(a)*160} r={i%3===0?4:2.5} fill="#A78BFA" opacity={0.45} />; })}
      </G>
    </Svg>
  </View>
);

const AstrologyWorldBackground = () => {
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
};

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
          <Pressable key={s.id} onPress={() => onSelect(i)} style={[wn.pill, isActive && { backgroundColor: active.accent + '22', borderColor: active.accent + '66' }]}>
            {isActive && <View style={[wn.pillDot, { backgroundColor: active.accent }]} />}
            <Text style={[wn.pillText, { color: isActive ? active.accent : (isLight ? 'rgba(40,28,16,0.5)' : 'rgba(255,255,255,0.45)') }]}>{s.title}</Text>
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

// ── ACTION TILE (2-column grid tile, no border box) ───────────

const ActionTile = React.memo(({ icon: Icon, label, sublabel, accent, onPress, delay = 0, isLight = false }: { icon: any; label: string; sublabel: string; accent: string; onPress: () => void; delay?: number; isLight?: boolean }) => {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const tileBg = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.15)';
  const labelColor = isLight ? '#1A1206' : '#F0EBE2';
  const subColor = isLight ? 'rgba(40,26,10,0.55)' : 'rgba(210,200,188,0.68)';
  return (
    <Animated.View entering={FadeIn.delay(delay).duration(280)} style={[at.wrap, { width: TILE_W }]}>
      <View>
        <Animated.View style={anim}>
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.96, { damping: 16, stiffness: 380 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 200 }); }}
          style={[at.tile, { borderColor: accent + '80', backgroundColor: tileBg }]}
        >
          <LinearGradient colors={[accent + '22', accent + '08', 'transparent']} style={StyleSheet.absoluteFillObject} />
          <LinearGradient colors={['transparent', accent + '88', 'transparent'] as [string,string,string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1 }} />
          <View style={[at.iconRing, { backgroundColor: accent + '22', borderColor: accent + '55' }]}>
            <Icon color={accent} size={20} strokeWidth={1.8} />
          </View>
          <Text style={[at.label, { color: labelColor }]} numberOfLines={1}>{label}</Text>
          <Text style={[at.sub, { color: subColor }]} numberOfLines={2}>{sublabel}</Text>
          <View style={[at.arrow, { borderColor: accent + '44' }]}>
            <ChevronRight color={accent} size={13} opacity={0.8} />
          </View>
        </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
});

const at = StyleSheet.create({
  wrap: {},
  tile: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', minHeight: 120 },
  iconRing: { width: 42, height: 42, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '700', letterSpacing: -0.1, marginBottom: 4 },
  sub: { fontSize: 11, lineHeight: 15 },
  arrow: { position: 'absolute', bottom: 12, right: 12, width: 26, height: 26, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ── EXPLORE ROW (minimal link) ────────────────────────────────

const ExploreRow = React.memo(({ title, desc, accent, onPress, delay = 0, isLight }: { title: string; desc: string; accent: string; onPress: () => void; delay?: number; isLight?: boolean }) => (
  <Animated.View entering={FadeInDown.delay(delay).duration(240)}>
    <Pressable onPress={onPress} style={[er.row, { borderTopColor: accent + '18' }]}>
      <View style={[er.bar, { backgroundColor: accent }]} />
      <View style={{ flex: 1 }}>
        <Text style={[er.title, { color: isLight ? '#2A1F0E' : '#EDE6D8' }]}>{title}</Text>
        <Text style={[er.desc, { color: isLight ? 'rgba(60,44,26,0.60)' : 'rgba(200,190,178,0.60)' }]} numberOfLines={2}>{desc}</Text>
      </View>
      <ChevronRight color={accent} size={15} opacity={0.5} />
    </Pressable>
  </Animated.View>
));

const er = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  bar: { width: 3, height: 38, borderRadius: 2, opacity: 0.8 },
  title: { fontSize: 14, fontWeight: '600', letterSpacing: 0.05, marginBottom: 3 },
  desc: { fontSize: 12, lineHeight: 17 },
});

// ── METRICS STRIP ─────────────────────────────────────────────

const MetricsStrip = React.memo(({ items, accent }: { items: { val: string; label: string }[]; accent: string }) => (
  <View style={ms.row}>
    {items.map((m, i) => (
      <React.Fragment key={m.label}>
        {i > 0 && <View style={[ms.sep, { backgroundColor: accent + '28' }]} />}
        <View style={ms.cell}>
          <Text style={[ms.val, { color: accent }]}>{m.val}</Text>
          <Text style={ms.label}>{m.label}</Text>
        </View>
      </React.Fragment>
    ))}
  </View>
));

const ms = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, marginBottom: 4 },
  cell: { flex: 1, alignItems: 'center' },
  val: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2, color: 'rgba(200,190,178,0.55)', marginTop: 3 },
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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <ActionTile icon={Zap} label={tr('home.ty.energyJournal', 'Dziennik Energii', 'Energy Journal')} sublabel={tr('home.ty.energyJournalSub', 'Śledź przepływ energii przez tydzień', 'Track your energy flow through the week')} accent={ac} onPress={() => navigation.navigate('EnergyJournal')} delay={0} isLight={isLight} />
        <ActionTile icon={BookOpen} label={tr('home.ty.journal', 'Dziennik', 'Journal')} sublabel={tr('home.ty.journalSub', 'Nazwij dzień własnymi słowami', 'Name the day in your own words')} accent={ac} onPress={() => navigation.navigate('JournalEntry')} delay={60} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.ty.soulContract', 'Kontrakt Duszy', 'Soul Contract')} sublabel={tr('home.ty.soulContractSub', 'Karmiczna mapa urodzeniowa', 'Your karmic birth map')} accent={ac} onPress={() => navigation.navigate('SoulContract')} delay={120} isLight={isLight} />
        <ActionTile icon={Brain} label={tr('home.ty.shadowWork', 'Praca z cieniem', 'Shadow Work')} sublabel={tr('home.ty.shadowWorkSub', 'Jungowska eksploracja nieświadomości', 'Jungian exploration of the unconscious')} accent={ac} onPress={() => navigation.navigate('ShadowWork')} delay={180} isLight={isLight} />
        <ActionTile icon={Sparkles} label={tr('home.ty.mantra', 'Generator Mantry', 'Mantra Generator')} sublabel={tr('home.ty.mantraSub', 'Spersonalizowana mantra wedyjska', 'A personalized Vedic mantra')} accent={ac} onPress={() => navigation.navigate('MantraGenerator')} delay={240} isLight={isLight} />
        <ActionTile icon={Target} label={tr('home.ty.visionBoard', 'Tablica Manifestacji', 'Manifestation Board')} sublabel={tr('home.ty.visionBoardSub', 'Kosmiczna mapa 9 intencji', 'A cosmic map of 9 intentions')} accent={ac} onPress={() => navigation.navigate('VisionBoard')} delay={300} isLight={isLight} />
        <ActionTile icon={CheckSquare2} label={tr('home.ty.habits', 'Nawyki Duchowe', 'Spiritual Habits')} sublabel={tr('home.ty.habitsSub', 'Śledź 12 codziennych praktyk', 'Track 12 daily practices')} accent="#10B981" onPress={() => navigation.navigate('SpiritualHabits')} delay={360} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }, { val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: dailyDraw ? '✓' : '○', label: tr('home.metric.card', 'KARTA', 'CARD') }]} />
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
      <MetricsStrip accent={ac} items={[{ val: String(pastReadings.length), label: tr('home.metric.readings', 'ODCZYTY', 'READINGS') }, { val: dailyDraw ? resolveUserFacingText(dailyDraw.card.name).slice(0,7) : tr('home.metric.waiting', 'Czeka', 'Waiting'), label: tr('home.metric.card', 'KARTA', 'CARD') }, { val: tarotDeck?.name?.slice(0,6) ?? 'Classic', label: tr('home.metric.deck', 'TALIA', 'DECK') }, { val: pastReadings[0]?.spread?.name?.slice(0,5) ?? tr('home.metric.none', 'Brak', 'None'), label: tr('home.metric.last', 'OSTATNI', 'LAST') }]} />
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
      <MetricsStrip accent={ac} items={[{ val: (() => { try { const { getZodiacSign } = require('../features/horoscope/utils/astrology'); return getZodiacSign(userData.birthDate).slice(0,4); } catch { return tr('home.metric.yours', 'Twój', 'Yours'); } })(), label: tr('home.metric.sign', 'ZNAK', 'SIGN') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: String(pastSessions.length), label: tr('home.metric.sessions', 'SESJI', 'SESSIONS') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }]} />
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
      <MetricsStrip accent={ac} items={[{ val: tr('home.metric.active', 'Aktywne', 'Active'), label: tr('home.metric.cycles', 'CYKLE', 'CYCLES') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: tr('home.metric.map', 'Mapa', 'Map'), label: tr('home.metric.transits', 'TRANZYTY', 'TRANSITS') }, { val: tr('home.metric.visible', 'Widoczne', 'Visible'), label: tr('home.metric.patterns', 'WZORCE', 'PATTERNS') }]} />
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
        <ActionTile icon={Gem} label={tr('home.support.crystals', 'Kryształy', 'Crystals')} sublabel={tr('home.support.crystalsSub', 'Przewodnik i odczyt kryształowy', 'Crystal guide and crystal reading')} accent={ac} onPress={() => navigation.navigate('CrystalGuide')} delay={240} isLight={isLight} />
      </View>
      <MetricsStrip accent={ac} items={[{ val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: tr('home.metric.active', 'Aktywne', 'Active'), label: tr('home.metric.affirmations', 'AFIRMACJE', 'AFFIRMATIONS') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }]} />
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
      <MetricsStrip accent={ac} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: String(entries.length), label: tr('home.metric.entries', 'WPISY', 'ENTRIES') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }]} />
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
      <MetricsStrip accent={ac} items={[{ val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }, { val: dailyPlan.energyScore + '%', label: tr('home.metric.energy', 'ENERGIA', 'ENERGY') }, { val: dailyPlan.ritualGuidance?.featured?.duration || '15m', label: tr('home.metric.time', 'CZAS', 'TIME') }, { val: dailyPlan.ritualGuidance?.featured?.category?.slice(0,5) || tr('home.metric.morning', 'Rano', 'Morning'), label: tr('home.metric.mode', 'TRYB', 'MODE') }]} />
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
        <MetricsStrip accent={ac} items={[{ val: String(dreamEntries.length), label: tr('home.metric.dreams', 'SNY', 'DREAMS') }, { val: dailyPlan.moonPhase?.icon || '🌙', label: tr('home.metric.moon', 'KSIĘŻYC', 'MOON') }, { val: dreamEntries.length > 0 ? tr('home.metric.active', 'Aktywne', 'Active') : tr('home.metric.waitingPlural', 'Czekają', 'Waiting'), label: tr('home.metric.symbols', 'SYMBOLE', 'SYMBOLS') }, { val: streaks.current + 'd', label: tr('home.metric.streak', 'CIĄGŁOŚĆ', 'STREAK') }]} />
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
  const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const streaks = useAppStore(s => s.streaks);
  const experience = useAppStore(s => s.experience);
  const checkInToday = useAppStore(s => s.checkInToday);
  const addFavoriteItem = useAppStore(s => s.addFavoriteItem);
  const setExperience = useAppStore(s => s.setExperience);
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
  const currentTheme = useMemo(() => getResolvedTheme(themeName), [themeName]);
  const isLight = currentTheme.background.startsWith('#F');
  const textColor = isLight ? '#1A1410' : '#F5F1EA';
  const subColor = isLight ? 'rgba(40,28,16,0.55)' : 'rgba(245,241,234,0.55)';
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
          <View>
            <Text style={[hs.brand, { color: isLight ? '#A97A39' : '#CEAE72' }]}>✦ AETHERA</Text>
            <Text style={[hs.greeting, { color: textColor }]}>{tr('home.greeting', 'Witaj,', 'Hello,')} {firstName}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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

          {/* WORLD HERO */}
          <Animated.View key={activeSurface.id} entering={FadeIn.duration(250)} style={hs.heroSection}>
            <WorldOrb accent={activeSurface.accent} surfaceId={activeSurface.id} />
            <Text style={[hs.heroEyebrow, { color: activeSurface.accent }]}>{activeSurface.eyebrow}</Text>
            <Text style={[hs.heroTitle, { color: textColor }]}>{activeSurface.title}</Text>
            <Text style={[hs.heroDesc, { color: subColor }]}>{worldDescs[activeSurface.id]}</Text>
            <View style={[hs.heroLine, { backgroundColor: activeSurface.accent }]} />
            {dailyPlan.oracleMessage && activeIndex === 0 && (
              <Text style={[hs.heroMessage, { color: isLight ? 'rgba(40,28,16,0.72)' : 'rgba(235,228,218,0.72)' }]}>{dailyPlan.oracleMessage}</Text>
            )}
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
  greeting: { fontSize: 21, fontWeight: '600', letterSpacing: -0.3 },
  scroll: { paddingHorizontal: 22, paddingTop: 12 },
  aiBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  aiBannerText: { fontSize: 13, lineHeight: 20, letterSpacing: 0.1 },
  heroSection: { alignItems: 'center', paddingVertical: 8, marginBottom: 20 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2.8, marginBottom: 8 },
  heroTitle: { fontSize: 42, fontWeight: '200', letterSpacing: -1.5, marginBottom: 8 },
  heroDesc: { fontSize: 14, lineHeight: 21, textAlign: 'center', paddingHorizontal: 28, marginBottom: 16 },
  heroLine: { width: 48, height: 2, borderRadius: 1, marginBottom: 14, opacity: 0.8 },
  heroMessage: { fontSize: 13, lineHeight: 21, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 28 },
});
