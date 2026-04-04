import React from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path, G, Ellipse, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: W, height: H } = Dimensions.get('window');

// ── TAROT — karty, gwiazdy, zloto ────────────────────────────
export const TarotBackground = ({ color = '#CEAE72', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#FBF5E8', '#F4ECD8', '#EDE0C6'] as const : ['#0A0705', '#130E0A', '#1A1208'] as const}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.12 : 0.22}>
      <G>
        {/* Karty w tle */}
        {[0,1,2,3,4,5,6,7].map(i => (
          <G key={i} transform={`translate(${30 + i*48}, ${40 + (i%3)*60}) rotate(${-20 + i*12})`}>
            <Rect x={-18} y={-28} width={36} height={56} rx={5}
              stroke={color} strokeWidth={1.4} fill="none" opacity={0.6 - i*0.06}/>
            <Line x1={-10} y1={-16} x2={10} y2={-16} stroke={color} strokeWidth={0.8} opacity={0.5}/>
            <Circle cx={0} cy={4} r={7} stroke={color} strokeWidth={0.8} fill="none" opacity={0.5}/>
            <Path d={`M0,-4 L2,2 L-4,0 L4,0 L-2,2 Z`} stroke={color} strokeWidth={0.6} fill="none" opacity={0.6}/>
          </G>
        ))}
        {/* Gwiazdy */}
        {[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(i => (
          <Circle key={`s${i}`} cx={(i*137)%W} cy={(i*97)%300} r={i%4===0?2.2:1.2}
            fill={i%6===0?color:'rgba(255,255,255,0.6)'} opacity={0.4+i%3*0.15}/>
        ))}
        {/* Okrag mistyczny */}
        <Circle cx={W/2} cy={H*0.35} r={120} stroke={color} strokeWidth={0.6} fill="none"
          strokeDasharray="6 10" opacity={0.2}/>
        <Circle cx={W/2} cy={H*0.35} r={80} stroke={color} strokeWidth={0.4} fill="none"
          strokeDasharray="3 6" opacity={0.15}/>
      </G>
    </Svg>
  </View>
);

// ── HOROSKOP — kolo zodiaku, orbity ──────────────────────────
export const HoroscopeBackground = ({ color = '#A78BFA', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#F3F0FC', '#EDE8FA', '#E5DDF7'] as const : ['#080610', '#0F0A1C', '#160E26'] as const} style={StyleSheet.absoluteFill}/>
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.12 : 0.2}>
      <G>
        {[160,120,80,40].map((r,i) => (
          <Circle key={i} cx={W/2} cy={H*0.3} r={r}
            stroke={color} strokeWidth={0.8-i*0.15} fill="none"
            strokeDasharray={i%2===0?"5 8":"none"} opacity={0.6-i*0.1}/>
        ))}
        {Array.from({length:12}, (_,i) => {
          const a = (i*30-90)*Math.PI/180;
          const x = W/2+Math.cos(a)*160; const y = H*0.3+Math.sin(a)*160;
          return (
            <G key={i}>
              <Circle cx={x} cy={y} r={4} fill={color} opacity={0.5}/>
              <Line x1={W/2} y1={H*0.3} x2={x} y2={y}
                stroke={color} strokeWidth={0.4} opacity={0.2}/>
            </G>
          );
        })}
        <Circle cx={W/2} cy={H*0.3} r={12} fill={color} opacity={0.25}/>
        {/* Gwiazdy tla */}
        {Array.from({length:20}, (_,i) => (
          <Circle key={`bg${i}`} cx={(i*173+50)%W} cy={(i*89+30)%(H*0.9)}
            r={i%5===0?1.8:0.9} fill="white" opacity={0.2+i%3*0.1}/>
        ))}
      </G>
    </Svg>
  </View>
);

// ── ASTROLOGIA — konstelacje, mapa nieba ──────────────────────
export const AstrologyBackground = ({ color = '#60A5FA', isLight = false }: { color?: string; isLight?: boolean }) => {
  const stars = [[50,40],[130,30],[220,60],[300,35],[170,80],[80,110],[250,100],[350,50],[400,80],[60,160],[200,140],[330,130]];
  const lines = [[0,2],[2,4],[1,4],[5,6],[6,7],[8,7],[9,10],[10,11]];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={isLight ? ['#EEF4FC', '#E4EEF8', '#D8E8F2'] as const : ['#040810', '#080F1E', '#0C1428'] as const} style={StyleSheet.absoluteFill}/>
      <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.14 : 0.25}>
        <G>
          {lines.map(([a,b],i) => (
            <Line key={i} x1={stars[a][0]} y1={stars[a][1]} x2={stars[b][0]} y2={stars[b][1]}
              stroke={color} strokeWidth={0.7} opacity={0.5}/>
          ))}
          {stars.map(([x,y],i) => (
            <Circle key={i} cx={x} cy={y} r={i%4===0?3:i%3===0?2:1.2}
              fill={i%4===0?color:i%3===0?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.5)'}
              opacity={0.6+i%3*0.15}/>
          ))}
          <Circle cx={W/2} cy={H*0.25} r={100} stroke={color} strokeWidth={0.5}
            fill="none" strokeDasharray="4 8" opacity={0.15}/>
          {Array.from({length:8}, (_,i) => {
            const a = i*45*Math.PI/180;
            return <Line key={`r${i}`} x1={W/2} y1={H*0.25}
              x2={W/2+Math.cos(a)*100} y2={H*0.25+Math.sin(a)*100}
              stroke={color} strokeWidth={0.3} opacity={0.12}/>;
          })}
        </G>
      </Svg>
    </View>
  );
};

// ── RYTUALY — ogien, spirale, ceremonialne ────────────────────
export const RitualsBackground = ({ color = '#F97316', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#FFF5EE', '#FFF0E4', '#FFE8D6'] as const : ['#0A0603', '#150A05', '#1E100A'] as const} style={StyleSheet.absoluteFill}/>
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.12 : 0.2}>
      <G>
        {/* Plomien */}
        <Path d={`M${W/2},50 C${W/2-20},30 ${W/2-30},10 ${W/2},5 C${W/2+5},15 ${W/2+15},10 ${W/2+20},20 C${W/2+30},5 ${W/2+25},30 ${W/2},50Z`}
          stroke={color} strokeWidth={1.5} fill="none" opacity={0.7}/>
        <Path d={`M${W/2},70 C${W/2-15},50 ${W/2-20},30 ${W/2},25 C${W/2+5},35 ${W/2+15},30 ${W/2+10},50 Z`}
          stroke={color} strokeWidth={1} fill="none" opacity={0.5}/>
        {/* Spirale */}
        {[0,1,2].map(i => (
          <G key={i}>
            <Circle cx={W*0.2+i*W*0.3} cy={H*0.6} r={30+i*15}
              stroke={color} strokeWidth={0.8} fill="none"
              strokeDasharray="3 5" opacity={0.4-i*0.1}/>
            <Circle cx={W*0.2+i*W*0.3} cy={H*0.6} r={15+i*8}
              stroke={color} strokeWidth={0.5} fill="none" opacity={0.3}/>
          </G>
        ))}
        {/* Iskry */}
        {Array.from({length:12}, (_,i) => (
          <Circle key={`sp${i}`} cx={(i*97+W/2-200)%W} cy={(i*67+100)%400}
            r={i%3===0?2:1} fill={color} opacity={0.3+i%4*0.1}/>
        ))}
        {/* Linie obrządku */}
        <Line x1={W*0.1} y1={H*0.75} x2={W*0.9} y2={H*0.75}
          stroke={color} strokeWidth={0.8} opacity={0.3}/>
        <Line x1={W*0.2} y1={H*0.78} x2={W*0.8} y2={H*0.78}
          stroke={color} strokeWidth={0.5} opacity={0.2}/>
      </G>
    </Svg>
  </View>
);

// ── OCZYSZCZANIE — fale wody, oddech ─────────────────────────
export const CleansingBackground = ({ color = '#34D399', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient
      colors={isLight ? ['#E8F5F0', '#D4EDE6', '#BFDED5'] as const : ['#030A08', '#050F0C', '#081510'] as const}
      style={StyleSheet.absoluteFill}
    />
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.2}>
      <G>
        {/* Fale */}
        {[0,1,2,3].map(i => (
          <Path key={i}
            d={`M0,${200+i*60} C${W*0.15},${190+i*60} ${W*0.25},${215+i*60} ${W*0.4},${200+i*60} C${W*0.55},${185+i*60} ${W*0.65},${215+i*60} ${W*0.8},${200+i*60} C${W*0.9},${190+i*60} ${W},${205+i*60} ${W},${200+i*60}`}
            stroke={color} strokeWidth={1.5-i*0.2} fill="none"
            opacity={0.7-i*0.15} strokeLinecap="round"/>
        ))}
        {/* Kola oddechu */}
        {[0,1,2].map(i => (
          <Circle key={`b${i}`} cx={W/2} cy={100} r={30+i*25}
            stroke={color} strokeWidth={0.8} fill="none"
            opacity={0.5-i*0.15} strokeDasharray={i===0?"none":"4 6"}/>
        ))}
        {/* Krople */}
        {[[W*0.2,80],[W*0.7,120],[W*0.45,60],[W*0.85,90]].map(([x,y],i) => (
          <G key={`d${i}`}>
            <Circle cx={x} cy={y} r={3} fill={color} opacity={0.4}/>
            <Path d={`M${x},${y+3} C${x-4},${y+10} ${x+4},${y+10} ${x},${y+3}`}
              stroke={color} strokeWidth={0.8} fill={color} opacity={0.3}/>
          </G>
        ))}
      </G>
    </Svg>
  </View>
);

// ── WSPARCIE — serce, cieplo, miękkość ───────────────────────
export const SupportBackground = ({ color = '#F472B6', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#FEF0F4', '#FDE8EF', '#FDDCE8'] as const : ['#0A0508', '#140A10', '#1C0E16'] as const} style={StyleSheet.absoluteFill}/>
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.18}>
      <G>
        {/* Serca */}
        {[0,1,2].map(i => {
          const cx = W*0.2+i*W*0.3; const cy = 80+i*40; const s = 20+i*10;
          return (
            <G key={i}>
              <Path d={`M${cx},${cy+s*0.3} C${cx},${cy} ${cx-s},${cy} ${cx-s},${cy+s*0.4} C${cx-s},${cy+s} ${cx},${cy+s*1.4} ${cx},${cy+s*1.4} C${cx},${cy+s*1.4} ${cx+s},${cy+s} ${cx+s},${cy+s*0.4} C${cx+s},${cy} ${cx},${cy} ${cx},${cy+s*0.3}Z`}
                stroke={color} strokeWidth={1.2} fill="none" opacity={0.6-i*0.15}/>
            </G>
          );
        })}
        {/* Miekkie kola */}
        {[0,1,2,3].map(i => (
          <Circle key={`c${i}`} cx={W*0.1+i*W*0.27} cy={H*0.5+i*30}
            r={50+i*20} stroke={color} strokeWidth={0.6} fill="none"
            opacity={0.25-i*0.05} strokeDasharray="3 8"/>
        ))}
        {/* Punkciki */}
        {Array.from({length:16}, (_,i) => (
          <Circle key={`p${i}`} cx={(i*113+60)%W} cy={(i*79+100)%500}
            r={i%4===0?2.5:1.2} fill={color} opacity={0.2+i%3*0.1}/>
        ))}
      </G>
    </Svg>
  </View>
);

// ── SEN — ksiezyc, gwiazdy, nocne niebo ──────────────────────
export const DreamsBackground = ({ color = '#818CF8', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#EEF0F8', '#E4E8F5', '#D8DFF0'] as const : ['#020308', '#040510', '#080A1A'] as const} style={StyleSheet.absoluteFill}/>
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.12 : 0.25}>
      <G>
        {/* Ksiezyc */}
        <Path d={`M${W*0.72},60 C${W*0.58},66 ${W*0.52},82 ${W*0.58},96 C${W*0.46},90 ${W*0.42},74 ${W*0.52},60 Z`}
          fill={color} opacity={0.5}/>
        <Circle cx={W*0.68} cy={78} r={34} stroke={color} strokeWidth={1.5}
          fill="none" opacity={0.4}/>
        {/* Gwiazdy */}
        {Array.from({length:25}, (_,i) => {
          const x = (i*137+20)%W; const y = (i*89+10)%350;
          const r = i%6===0?2.8:i%3===0?1.8:0.9;
          return <Circle key={i} cx={x} cy={y} r={r}
            fill={i%6===0?color:i%3===0?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.4)'}
            opacity={0.3+i%4*0.15}/>;
        })}
        {/* Mgla snu */}
        {[0,1,2].map(i => (
          <Ellipse key={i} cx={W*(0.2+i*0.3)} cy={H*0.45+i*40}
            rx={80+i*30} ry={25+i*10}
            stroke={color} strokeWidth={0.5} fill="none"
            opacity={0.2} strokeDasharray="4 8"/>
        ))}
        {/* Szlak gwiezdny */}
        <Path d={`M${W*0.1},${H*0.2} Q${W*0.3},${H*0.15} ${W*0.5},${H*0.22} Q${W*0.7},${H*0.28} ${W*0.9},${H*0.2}`}
          stroke={color} strokeWidth={0.8} fill="none" opacity={0.3}
          strokeDasharray="3 6"/>
      </G>
    </Svg>
  </View>
);

// ── ORACLE — mistyczne kolo, energie ─────────────────────────
export const OracleBackground = ({ color = '#CEAE72', isLight = false }: { color?: string; isLight?: boolean }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={isLight ? ['#FEFAEC', '#FAF2D4', '#F5E8BC'] as const : ['#060508', '#0C0A10', '#120E18'] as const} style={StyleSheet.absoluteFill}/>
    <Svg width={W} height={H} style={StyleSheet.absoluteFill} opacity={isLight ? 0.10 : 0.2}>
      <G>
        {[120,90,60,30].map((r,i) => (
          <Circle key={i} cx={W/2} cy={H*0.28} r={r}
            stroke={color} strokeWidth={0.8+i*0.15} fill="none"
            strokeDasharray={i%2===0?"5 8":"none"} opacity={0.5-i*0.08}/>
        ))}
        {Array.from({length:8}, (_,i) => {
          const a = i*45*Math.PI/180;
          return (
            <G key={i}>
              <Line x1={W/2+Math.cos(a)*30} y1={H*0.28+Math.sin(a)*30}
                x2={W/2+Math.cos(a)*120} y2={H*0.28+Math.sin(a)*120}
                stroke={color} strokeWidth={0.5} opacity={0.4}/>
              <Circle cx={W/2+Math.cos(a)*120} cy={H*0.28+Math.sin(a)*120}
                r={3} fill={color} opacity={0.6}/>
            </G>
          );
        })}
        <Circle cx={W/2} cy={H*0.28} r={10} fill={color} opacity={0.35}/>
      </G>
    </Svg>
  </View>
);