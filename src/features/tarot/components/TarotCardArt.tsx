import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

interface TarotCardArtProps {
  cardId: string;
  accent: string;
  textColor: string;
  width: number;
  height: number;
  artStyle?: 'classic' | 'golden' | 'moon' | 'obsidian' | 'geometry';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** 5-pointed star path centred at (cx,cy) with outer radius R and inner radius iR */
const starPath = (cx: number, cy: number, R: number, iR: number): string => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? R : iR;
    const a = toRad(i * 36 - 90);
    d += `${i === 0 ? 'M' : 'L'}${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)} `;
  }
  return d + 'Z';
};

/** Full circle as two arcs — useful for compound evenodd crescent shapes */
const circPath = (cx: number, cy: number, r: number): string =>
  `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 -${r * 2},0`;

/** Regular polygon path */
const polyPath = (cx: number, cy: number, R: number, sides: number, offsetDeg = 0): string => {
  let d = '';
  for (let i = 0; i < sides; i++) {
    const a = toRad((i * 360) / sides + offsetDeg - 90);
    d += `${i === 0 ? 'M' : 'L'}${(cx + R * Math.cos(a)).toFixed(2)},${(cy + R * Math.sin(a)).toFixed(2)} `;
  }
  return d + 'Z';
};

// ─── Suit symbol renderers ───────────────────────────────────────────────────

/** Cup/Chalice — bowl on stem on base */
const Cup = ({ x, y, s, f, k }: { x: number; y: number; s: number; f: string; k: string }) => {
  const h = s * 1.4;
  return (
    <G>
      {/* bowl */}
      <Path
        d={`M${x - s * 0.55},${y - h * 0.38} Q${x - s * 0.6},${y + h * 0.05} ${x},${y + h * 0.12} Q${x + s * 0.6},${y + h * 0.05} ${x + s * 0.55},${y - h * 0.38} Z`}
        fill={f}
        stroke={k}
        strokeWidth={0.6}
      />
      {/* stem */}
      <Line x1={x} y1={y + h * 0.12} x2={x} y2={y + h * 0.4} stroke={k} strokeWidth={0.7} />
      {/* base */}
      <Line x1={x - s * 0.35} y1={y + h * 0.4} x2={x + s * 0.35} y2={y + h * 0.4} stroke={k} strokeWidth={0.9} />
    </G>
  );
};

/** Sword — diamond blade + crossguard */
const Sword = ({ x, y, s, f, k }: { x: number; y: number; s: number; f: string; k: string }) => {
  const h = s * 1.6;
  return (
    <G>
      {/* blade */}
      <Path
        d={`M${x},${y - h * 0.5} L${x + s * 0.14},${y + h * 0.18} L${x},${y + h * 0.14} L${x - s * 0.14},${y + h * 0.18} Z`}
        fill={f}
        stroke={k}
        strokeWidth={0.5}
      />
      {/* crossguard */}
      <Line x1={x - s * 0.45} y1={y + h * 0.2} x2={x + s * 0.45} y2={y + h * 0.2} stroke={k} strokeWidth={0.9} strokeLinecap="round" />
      {/* grip */}
      <Line x1={x} y1={y + h * 0.2} x2={x} y2={y + h * 0.48} stroke={k} strokeWidth={0.8} />
    </G>
  );
};

/** Wand — vertical staff with leaf-branch */
const Wand = ({ x, y, s, f, k }: { x: number; y: number; s: number; f: string; k: string }) => {
  const h = s * 1.6;
  return (
    <G>
      {/* staff */}
      <Line x1={x} y1={y - h * 0.5} x2={x} y2={y + h * 0.5} stroke={k} strokeWidth={0.9} />
      {/* leaf sprouts */}
      <Path d={`M${x},${y - h * 0.1} Q${x - s * 0.4},${y - h * 0.28} ${x - s * 0.28},${y - h * 0.45}`} fill="none" stroke={f} strokeWidth={0.9} />
      <Path d={`M${x},${y - h * 0.1} Q${x + s * 0.4},${y - h * 0.28} ${x + s * 0.28},${y - h * 0.45}`} fill="none" stroke={f} strokeWidth={0.9} />
      <Path d={`M${x},${y + h * 0.08} Q${x - s * 0.3},${y - h * 0.05} ${x - s * 0.22},${y - h * 0.18}`} fill="none" stroke={f} strokeWidth={0.7} />
      <Path d={`M${x},${y + h * 0.08} Q${x + s * 0.3},${y - h * 0.05} ${x + s * 0.22},${y - h * 0.18}`} fill="none" stroke={f} strokeWidth={0.7} />
    </G>
  );
};

/** Pentacle — 5-pointed star inscribed in circle */
const Penta = ({ x, y, s, f, k }: { x: number; y: number; s: number; f: string; k: string }) => (
  <G>
    <Circle cx={x} cy={y} r={s * 0.58} fill="none" stroke={k} strokeWidth={0.6} />
    <Path d={starPath(x, y, s * 0.52, s * 0.22)} fill={f} stroke={k} strokeWidth={0.5} />
  </G>
);

type SuitKey = 'c' | 's' | 'w' | 'p';

const suit = (su: SuitKey, x: number, y: number, s: number, f: string, k: string) => {
  if (su === 'c') return <Cup x={x} y={y} s={s} f={f} k={k} />;
  if (su === 's') return <Sword x={x} y={y} s={s} f={f} k={k} />;
  if (su === 'w') return <Wand x={x} y={y} s={s} f={f} k={k} />;
  return <Penta x={x} y={y} s={s} f={f} k={k} />;
};

// ─── Pip layouts (positions as [x%,y%] within 100×88 viewBox) ───────────────

const W = 100;
const H = 88;
const cx = W / 2;

const PIPS: Record<number, [number, number][]> = {
  1:  [[cx, H * 0.5]],
  2:  [[cx, H * 0.28], [cx, H * 0.72]],
  3:  [[cx, H * 0.2],  [cx, H * 0.5],  [cx, H * 0.8]],
  4:  [[cx - 18, H * 0.28], [cx + 18, H * 0.28], [cx - 18, H * 0.72], [cx + 18, H * 0.72]],
  5:  [[cx - 18, H * 0.22], [cx + 18, H * 0.22], [cx, H * 0.5], [cx - 18, H * 0.78], [cx + 18, H * 0.78]],
  6:  [[cx - 18, H * 0.22], [cx + 18, H * 0.22], [cx - 18, H * 0.5], [cx + 18, H * 0.5], [cx - 18, H * 0.78], [cx + 18, H * 0.78]],
  7:  [[cx - 18, H * 0.2], [cx + 18, H * 0.2], [cx, H * 0.36], [cx - 18, H * 0.52], [cx + 18, H * 0.52], [cx - 18, H * 0.78], [cx + 18, H * 0.78]],
  8:  [[cx - 18, H * 0.18], [cx + 18, H * 0.18], [cx - 18, H * 0.38], [cx + 18, H * 0.38], [cx - 18, H * 0.62], [cx + 18, H * 0.62], [cx - 18, H * 0.82], [cx + 18, H * 0.82]],
  9:  [[cx - 18, H * 0.17], [cx + 18, H * 0.17], [cx - 18, H * 0.35], [cx + 18, H * 0.35], [cx, H * 0.5], [cx - 18, H * 0.65], [cx + 18, H * 0.65], [cx - 18, H * 0.83], [cx + 18, H * 0.83]],
  10: [[cx - 18, H * 0.16], [cx + 18, H * 0.16], [cx - 18, H * 0.32], [cx + 18, H * 0.32], [cx - 18, H * 0.5], [cx + 18, H * 0.5], [cx - 18, H * 0.68], [cx + 18, H * 0.68], [cx - 18, H * 0.84], [cx + 18, H * 0.84]],
};

// ─── Minor Arcana renderer ────────────────────────────────────────────────────

const renderMinorCard = (
  su: SuitKey,
  n: number,
  a: string,   // accent
  a8: string,  // accent + '80'
  a5: string,  // accent + '50'
  a3: string,  // accent + '30'
  t5: string,  // textColor + '50'
) => {
  const ss = 6.5; // symbol scale

  if (n >= 1 && n <= 10) {
    const positions = PIPS[n];
    return (
      <>
        {positions.map(([px, py], i) => (
          <G key={i}>{suit(su, px, py, ss, a5, a8)}</G>
        ))}
      </>
    );
  }

  // Court cards (11-14): stylised silhouettes
  const fy = H * 0.62; // figure base y
  const hy = H * 0.2;  // head centre y
  // Head circle
  const head = <Circle cx={cx} cy={hy} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />;
  // Body trapezoid
  const body = <Path d={`M${cx - 11},${hy + 9} L${cx + 11},${hy + 9} L${cx + 14},${fy} L${cx - 14},${fy} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />;
  // Crown (queen/king)
  const crown = (
    <Path
      d={`M${cx - 9},${hy - 9} L${cx - 6},${hy - 16} L${cx},${hy - 12} L${cx + 6},${hy - 16} L${cx + 9},${hy - 9} Z`}
      fill={a5}
      stroke={a8}
      strokeWidth={0.6}
    />
  );

  if (n === 11) {
    // Page: standing figure, suit symbol in hand
    return (
      <>
        {head}
        {body}
        {/* staff / implement */}
        <Line x1={cx + 14} y1={hy + 9} x2={cx + 14} y2={fy + 12} stroke={a8} strokeWidth={1.2} />
        <G>{suit(su, cx + 14, fy + 20, 5, a5, a8)}</G>
        {/* legs */}
        <Line x1={cx - 5} y1={fy} x2={cx - 5} y2={fy + 16} stroke={a8} strokeWidth={1.4} />
        <Line x1={cx + 5} y1={fy} x2={cx + 5} y2={fy + 16} stroke={a8} strokeWidth={1.4} />
      </>
    );
  }

  if (n === 12) {
    // Knight: horse + rider
    // Horse body ellipse
    const hx = cx - 10;
    const horeY = H * 0.7;
    return (
      <>
        <Ellipse cx={hx} cy={horeY} rx={20} ry={10} fill={a3} stroke={a8} strokeWidth={0.7} />
        {/* horse legs */}
        <Line x1={hx - 14} y1={horeY + 8} x2={hx - 18} y2={horeY + 18} stroke={a8} strokeWidth={1.2} />
        <Line x1={hx - 6} y1={horeY + 9} x2={hx - 8} y2={horeY + 18} stroke={a8} strokeWidth={1.2} />
        <Line x1={hx + 8} y1={horeY + 9} x2={hx + 10} y2={horeY + 18} stroke={a8} strokeWidth={1.2} />
        <Line x1={hx + 16} y1={horeY + 7} x2={hx + 20} y2={horeY + 18} stroke={a8} strokeWidth={1.2} />
        {/* horse neck/head */}
        <Path d={`M${hx + 18},${horeY - 4} Q${hx + 28},${horeY - 14} ${hx + 22},${horeY - 22}`} fill="none" stroke={a8} strokeWidth={1.2} />
        {/* rider */}
        <Circle cx={cx + 6} cy={horeY - 20} r={6} fill={a3} stroke={a8} strokeWidth={0.7} />
        <Path d={`M${cx},${horeY - 14} L${cx + 12},${horeY - 14} L${cx + 14},${horeY - 4} L${cx - 2},${horeY - 4} Z`} fill={a3} stroke={a8} strokeWidth={0.6} />
        {/* lance / weapon */}
        <Line x1={cx + 12} y1={horeY - 14} x2={cx + 24} y2={horeY - 32} stroke={a8} strokeWidth={1.0} />
        <G>{suit(su, cx + 24, horeY - 36, 4, a5, a8)}</G>
      </>
    );
  }

  if (n === 13) {
    // Queen: seated on throne
    return (
      <>
        {crown}
        {head}
        {body}
        {/* throne back */}
        <Rect x={cx - 18} y={hy - 22} width={36} height={5} rx={2} fill="none" stroke={a5} strokeWidth={0.7} />
        {/* orb in hand */}
        <Circle cx={cx - 16} cy={fy - 14} r={5} fill="none" stroke={a8} strokeWidth={0.8} />
        {/* suit symbol */}
        <G>{suit(su, cx + 16, fy - 12, 5, a5, a8)}</G>
        {/* legs */}
        <Line x1={cx - 5} y1={fy} x2={cx - 5} y2={fy + 14} stroke={a8} strokeWidth={1.4} />
        <Line x1={cx + 5} y1={fy} x2={cx + 5} y2={fy + 14} stroke={a8} strokeWidth={1.4} />
      </>
    );
  }

  // n === 14: King
  return (
    <>
      {crown}
      {head}
      {body}
      {/* throne back */}
      <Rect x={cx - 20} y={hy - 24} width={40} height={5} rx={2} fill="none" stroke={a5} strokeWidth={0.8} />
      {/* scepter */}
      <Line x1={cx + 16} y1={hy + 8} x2={cx + 16} y2={fy - 2} stroke={a8} strokeWidth={1.2} />
      <Circle cx={cx + 16} cy={hy + 6} r={3} fill={a5} stroke={a8} strokeWidth={0.6} />
      {/* suit symbol on lap */}
      <G>{suit(su, cx - 14, fy - 12, 5, a5, a8)}</G>
      {/* legs */}
      <Line x1={cx - 6} y1={fy} x2={cx - 6} y2={fy + 14} stroke={a8} strokeWidth={1.5} />
      <Line x1={cx + 6} y1={fy} x2={cx + 6} y2={fy + 14} stroke={a8} strokeWidth={1.5} />
    </>
  );
};

// ─── Major Arcana renderer ────────────────────────────────────────────────────

const renderMajorCard = (
  n: number,
  a: string,
  tc: string,
  a8: string,
  a5: string,
  a3: string,
  a2: string,
  t8: string,
  t5: string,
) => {
  switch (n) {
    case 0: // Głupiec — cliff, figure, staff, flower, sun
      return (
        <>
          {/* sun top-right */}
          <Circle cx={W * 0.82} cy={H * 0.14} r={9} fill={a3} stroke={a8} strokeWidth={0.7} />
          {[0,45,90,135,180,225,270,315].map((deg, i) => (
            <Line key={i} x1={W*0.82 + 11*Math.cos(toRad(deg))} y1={H*0.14 + 11*Math.sin(toRad(deg))}
              x2={W*0.82 + 15*Math.cos(toRad(deg))} y2={H*0.14 + 15*Math.sin(toRad(deg))}
              stroke={a8} strokeWidth={0.8} />
          ))}
          {/* cliff edge */}
          <Path d={`M10,${H*0.65} L${W*0.72},${H*0.65} L${W*0.75},${H*0.52} L${W*0.82},${H*0.62}`} fill="none" stroke={a5} strokeWidth={1.2} />
          {/* ground fill */}
          <Rect x={10} y={H*0.65} width={W*0.66} height={H*0.2} fill={a2} />
          {/* figure body */}
          <Circle cx={W*0.58} cy={H*0.38} r={6} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${W*0.58},${H*0.44} L${W*0.55},${H*0.65} L${W*0.61},${H*0.65}`} stroke={a8} strokeWidth={1.1} fill="none" />
          <Path d={`M${W*0.58},${H*0.48} L${W*0.48},${H*0.56} M${W*0.58},${H*0.48} L${W*0.72},${H*0.42}`} stroke={a8} strokeWidth={1.0} fill="none" />
          {/* staff */}
          <Line x1={W*0.72} y1={H*0.3} x2={W*0.72} y2={H*0.58} stroke={a8} strokeWidth={1.0} />
          {/* flower */}
          <Circle cx={W*0.72} cy={H*0.28} r={4} fill={a5} stroke={a8} strokeWidth={0.6} />
          <Circle cx={W*0.72} cy={H*0.28} r={2} fill={a8} />
        </>
      );

    case 1: // Mag — infinity, table, four suits, pointing arm
      return (
        <>
          {/* table */}
          <Rect x={cx - 28} y={H*0.52} width={56} height={3} rx={1} fill={a5} stroke={a8} strokeWidth={0.5} />
          <Line x1={cx-22} y1={H*0.55} x2={cx-22} y2={H*0.78} stroke={a8} strokeWidth={0.8} />
          <Line x1={cx+22} y1={H*0.55} x2={cx+22} y2={H*0.78} stroke={a8} strokeWidth={0.8} />
          {/* suits on table */}
          <G>{suit('c', cx - 20, H*0.72, 5, a5, a8)}</G>
          <G>{suit('s', cx - 7,  H*0.72, 5, a5, a8)}</G>
          <G>{suit('w', cx + 7,  H*0.72, 5, a5, a8)}</G>
          <G>{suit('p', cx + 20, H*0.72, 5, a5, a8)}</G>
          {/* figure */}
          <Circle cx={cx} cy={H*0.24} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx},${H*0.31} L${cx-8},${H*0.52} L${cx+8},${H*0.52}`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* arm pointing up */}
          <Line x1={cx+8} y1={H*0.38} x2={cx+22} y2={H*0.2} stroke={a8} strokeWidth={1.0} />
          {/* infinity above head */}
          <Path d={circPath(cx-7, H*0.11, 5.5) + ' ' + circPath(cx+7, H*0.11, 5.5)} fill={a5} fillRule="evenodd" stroke={a8} strokeWidth={0.5} />
        </>
      );

    case 2: // Papieżyca — two pillars, crescent, veil
      return (
        <>
          {/* pillars */}
          <Rect x={cx-32} y={H*0.12} width={10} height={H*0.76} rx={2} fill={a2} stroke={a8} strokeWidth={0.7} />
          <Rect x={cx+22} y={H*0.12} width={10} height={H*0.76} rx={2} fill={a2} stroke={a8} strokeWidth={0.7} />
          {/* veil wavy lines */}
          {[0,1,2,3,4].map(i => (
            <Path key={i}
              d={`M${cx-22},${H*(0.26+i*0.12)} Q${cx},${H*(0.22+i*0.12)} ${cx+22},${H*(0.26+i*0.12)}`}
              fill="none" stroke={a5} strokeWidth={0.7} />
          ))}
          {/* figure */}
          <Circle cx={cx} cy={H*0.27} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-10},${H*0.34} L${cx+10},${H*0.34} L${cx+12},${H*0.72} L${cx-12},${H*0.72} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* crescent moon on head */}
          <Path d={circPath(cx, H*0.18, 8) + ' ' + circPath(cx+4, H*0.18, 6)} fill={a5} fillRule="evenodd" />
          {/* scroll */}
          <Rect x={cx-8} y={H*0.44} width={16} height={10} rx={2} fill={a2} stroke={a8} strokeWidth={0.5} />
        </>
      );

    case 3: // Cesarzowa — crown, Venus, wheat
      return (
        <>
          {/* wheat stalks background */}
          {[-20,-10,0,10,20].map((dx, i) => (
            <G key={i}>
              <Line x1={cx+dx} y1={H*0.42} x2={cx+dx} y2={H*0.85} stroke={a5} strokeWidth={0.7} />
              <Path d={`M${cx+dx},${H*0.42} Q${cx+dx-6},${H*0.34} ${cx+dx-4},${H*0.28}`} fill="none" stroke={a5} strokeWidth={0.6} />
              <Path d={`M${cx+dx},${H*0.42} Q${cx+dx+6},${H*0.34} ${cx+dx+4},${H*0.28}`} fill="none" stroke={a5} strokeWidth={0.6} />
            </G>
          ))}
          {/* figure */}
          <Circle cx={cx} cy={H*0.26} r={8} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-14},${H*0.34} L${cx+14},${H*0.34} L${cx+18},${H*0.72} L${cx-18},${H*0.72} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* 12-star crown arc */}
          {Array.from({length: 12}).map((_, i) => {
            const a = toRad((i * 30) - 60);
            return <Circle key={i} cx={cx + 14*Math.cos(a)} cy={H*0.12 + 14*Math.sin(a)} r={1.8} fill={a8} />;
          })}
          {/* Venus symbol */}
          <Circle cx={cx+24} cy={H*0.36} r={5} fill="none" stroke={a8} strokeWidth={0.8} />
          <Line x1={cx+24} y1={H*0.36+5} x2={cx+24} y2={H*0.36+12} stroke={a8} strokeWidth={0.8} />
          <Line x1={cx+20} y1={H*0.36+9} x2={cx+28} y2={H*0.36+9} stroke={a8} strokeWidth={0.8} />
        </>
      );

    case 4: // Cesarz — throne, ram horns, scepter, orb
      return (
        <>
          {/* throne */}
          <Rect x={cx-22} y={H*0.14} width={44} height={H*0.72} rx={4} fill={a2} stroke={a8} strokeWidth={0.8} />
          <Rect x={cx-18} y={H*0.1} width={36} height={8} rx={3} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* figure */}
          <Circle cx={cx} cy={H*0.28} r={7} fill={a5} stroke={a8} strokeWidth={0.8} />
          <Rect x={cx-12} y={H*0.35} width={24} height={H*0.32} rx={2} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* ram horns */}
          <Path d={`M${cx-8},${H*0.22} Q${cx-22},${H*0.12} ${cx-18},${H*0.3}`} fill="none" stroke={a8} strokeWidth={1.1} />
          <Path d={`M${cx+8},${H*0.22} Q${cx+22},${H*0.12} ${cx+18},${H*0.3}`} fill="none" stroke={a8} strokeWidth={1.1} />
          {/* scepter */}
          <Line x1={cx+14} y1={H*0.36} x2={cx+14} y2={H*0.66} stroke={a8} strokeWidth={1.2} />
          <Path d={starPath(cx+14, H*0.32, 5, 2.5)} fill={a8} />
          {/* orb */}
          <Circle cx={cx-14} cy={H*0.52} r={6} fill="none" stroke={a8} strokeWidth={0.8} />
          <Line x1={cx-14} y1={H*0.52-6} x2={cx-14} y2={H*0.52-9} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx-14-3} y1={H*0.52-7} x2={cx-14+3} y2={H*0.52-7} stroke={a8} strokeWidth={0.7} />
        </>
      );

    case 5: // Hierofant — triple crown, crossed keys, pillars
      return (
        <>
          {/* pillars */}
          <Rect x={cx-30} y={H*0.2} width={8} height={H*0.65} rx={2} fill={a2} stroke={a8} strokeWidth={0.6} />
          <Rect x={cx+22} y={H*0.2} width={8} height={H*0.65} rx={2} fill={a2} stroke={a8} strokeWidth={0.6} />
          {/* figure */}
          <Circle cx={cx} cy={H*0.26} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-12},${H*0.33} L${cx+12},${H*0.33} L${cx+14},${H*0.74} L${cx-14},${H*0.74} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* triple crown (3 stacked arcs) */}
          {[0,1,2].map(i => (
            <Path key={i} d={`M${cx-10+i*2},${H*(0.14-i*0.04)} Q${cx},${H*(0.08-i*0.04)} ${cx+10-i*2},${H*(0.14-i*0.04)}`}
              fill="none" stroke={a8} strokeWidth={1.1 - i*0.2} />
          ))}
          {/* crossed keys */}
          <Line x1={cx-6} y1={H*0.58} x2={cx+6} y2={H*0.72} stroke={a8} strokeWidth={0.9} />
          <Line x1={cx+6} y1={H*0.58} x2={cx-6} y2={H*0.72} stroke={a8} strokeWidth={0.9} />
          <Circle cx={cx-8} cy={H*0.56} r={3} fill="none" stroke={a8} strokeWidth={0.7} />
          <Circle cx={cx+8} cy={H*0.56} r={3} fill="none" stroke={a8} strokeWidth={0.7} />
        </>
      );

    case 6: // Kochankowie — sun, angel, two figures
      return (
        <>
          {/* sun */}
          <Circle cx={cx} cy={H*0.12} r={10} fill={a3} stroke={a8} strokeWidth={0.7} />
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
            <Line key={i} x1={cx+12*Math.cos(toRad(deg))} y1={H*0.12+12*Math.sin(toRad(deg))}
              x2={cx+17*Math.cos(toRad(deg))} y2={H*0.12+17*Math.sin(toRad(deg))}
              stroke={a8} strokeWidth={0.8} />
          ))}
          {/* angel */}
          <Circle cx={cx} cy={H*0.32} r={6} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Path d={`M${cx},${H*0.38} L${cx-6},${H*0.54} L${cx+6},${H*0.54} Z`} fill={a3} stroke={a8} strokeWidth={0.6} />
          {/* wings */}
          <Path d={`M${cx-6},${H*0.36} Q${cx-22},${H*0.28} ${cx-18},${H*0.44}`} fill={a5} stroke={a8} strokeWidth={0.7} />
          <Path d={`M${cx+6},${H*0.36} Q${cx+22},${H*0.28} ${cx+18},${H*0.44}`} fill={a5} stroke={a8} strokeWidth={0.7} />
          {/* halo */}
          <Circle cx={cx} cy={H*0.28} r={8} fill="none" stroke={a5} strokeWidth={0.6} />
          {/* two figures below */}
          <Circle cx={cx-18} cy={H*0.62} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx-18} y1={H*0.67} x2={cx-18} y2={H*0.82} stroke={a8} strokeWidth={1.0} />
          <Circle cx={cx+18} cy={H*0.62} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx+18} y1={H*0.67} x2={cx+18} y2={H*0.82} stroke={a8} strokeWidth={1.0} />
        </>
      );

    case 7: // Rydwan — canopy, star, sphinxes, city
      return (
        <>
          {/* city walls background */}
          <Rect x={10} y={H*0.62} width={W-20} height={H*0.22} fill={a2} stroke={a5} strokeWidth={0.5} />
          {[16,30,44,56,70,84].map((x2, i) => (
            <Rect key={i} x={x2} y={H*0.56} width={8} height={H*0.1} fill={a2} stroke={a5} strokeWidth={0.4} />
          ))}
          {/* chariot */}
          <Rect x={cx-20} y={H*0.32} width={40} height={H*0.28} rx={3} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* canopy/roof */}
          <Rect x={cx-22} y={H*0.26} width={44} height={8} rx={2} fill={a5} stroke={a8} strokeWidth={0.7} />
          {/* star on canopy */}
          <Path d={starPath(cx, H*0.3, 4, 2)} fill={a8} />
          {/* wheels */}
          <Circle cx={cx-16} cy={H*0.62} r={7} fill="none" stroke={a8} strokeWidth={0.8} />
          <Circle cx={cx+16} cy={H*0.62} r={7} fill="none" stroke={a8} strokeWidth={0.8} />
          {/* sphinxes */}
          <Ellipse cx={cx-18} cy={H*0.76} rx={10} ry={5} fill={a2} stroke={a8} strokeWidth={0.6} />
          <Circle cx={cx-20} cy={H*0.7} r={4} fill={a3} stroke={a8} strokeWidth={0.6} />
          <Ellipse cx={cx+18} cy={H*0.76} rx={10} ry={5} fill={a2} stroke={a8} strokeWidth={0.6} />
          <Circle cx={cx+20} cy={H*0.7} r={4} fill={a3} stroke={a8} strokeWidth={0.6} />
          {/* figure in chariot */}
          <Circle cx={cx} cy={H*0.38} r={5} fill={a5} stroke={a8} strokeWidth={0.7} />
        </>
      );

    case 8: // Siła — infinity, lion, hands
      return (
        <>
          {/* infinity symbol above */}
          <Path d={circPath(cx-8, H*0.14, 6) + ' ' + circPath(cx+8, H*0.14, 6)} fill={a5} fillRule="evenodd" stroke={a8} strokeWidth={0.6} />
          {/* lion mane outer ring */}
          <Circle cx={cx} cy={H*0.52} r={22} fill="none" stroke={a5} strokeWidth={1.2} />
          {/* lion head */}
          <Circle cx={cx} cy={H*0.52} r={14} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* lion face details */}
          <Circle cx={cx-5} cy={H*0.5} r={2} fill={a8} />
          <Circle cx={cx+5} cy={H*0.5} r={2} fill={a8} />
          <Path d={`M${cx-4},${H*0.56} Q${cx},${H*0.59} ${cx+4},${H*0.56}`} fill="none" stroke={a8} strokeWidth={0.7} />
          {/* hands framing */}
          <Path d={`M${cx-24},${H*0.42} Q${cx-18},${H*0.36} ${cx-14},${H*0.42}`} fill="none" stroke={a8} strokeWidth={1.2} strokeLinecap="round" />
          <Path d={`M${cx+24},${H*0.42} Q${cx+18},${H*0.36} ${cx+14},${H*0.42}`} fill="none" stroke={a8} strokeWidth={1.2} strokeLinecap="round" />
          {/* figure above/behind */}
          <Circle cx={cx} cy={H*0.24} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
        </>
      );

    case 9: // Pustelnik — mountain, lantern, cloaked figure
      return (
        <>
          {/* mountain */}
          <Path d={`M10,${H*0.88} L${cx},${H*0.18} L${W-10},${H*0.88} Z`} fill={a2} stroke={a5} strokeWidth={1.0} />
          {/* snow cap */}
          <Path d={`M${cx-12},${H*0.3} L${cx},${H*0.18} L${cx+12},${H*0.3} Z`} fill={a3} />
          {/* figure */}
          <Circle cx={cx} cy={H*0.38} r={6} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* cloak */}
          <Path d={`M${cx-12},${H*0.44} Q${cx-10},${H*0.62} ${cx-14},${H*0.72} L${cx+14},${H*0.72} Q${cx+10},${H*0.62} ${cx+12},${H*0.44} Z`}
            fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* staff */}
          <Line x1={cx+12} y1={H*0.44} x2={cx+12} y2={H*0.78} stroke={a8} strokeWidth={1.2} />
          {/* lantern */}
          <Rect x={cx-18} y={H*0.38} width={9} height={12} rx={2} fill="none" stroke={a8} strokeWidth={0.7} />
          <Path d={starPath(cx-13.5, H*0.34, 3, 1.5)} fill={a8} />
        </>
      );

    case 10: // Koło Fortuny — wheel with spokes and letters
      return (
        <>
          {/* outer ring */}
          <Circle cx={cx} cy={H*0.5} r={34} fill="none" stroke={a8} strokeWidth={1.2} />
          {/* inner ring */}
          <Circle cx={cx} cy={H*0.5} r={24} fill="none" stroke={a5} strokeWidth={0.8} />
          {/* hub */}
          <Circle cx={cx} cy={H*0.5} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* 8 spokes */}
          {[0,45,90,135].map((deg, i) => (
            <G key={i}>
              <Line x1={cx + 7*Math.cos(toRad(deg))} y1={H*0.5 + 7*Math.sin(toRad(deg))}
                x2={cx + 24*Math.cos(toRad(deg))} y2={H*0.5 + 24*Math.sin(toRad(deg))}
                stroke={a8} strokeWidth={0.9} />
              <Line x1={cx + 7*Math.cos(toRad(deg+180))} y1={H*0.5 + 7*Math.sin(toRad(deg+180))}
                x2={cx + 24*Math.cos(toRad(deg+180))} y2={H*0.5 + 24*Math.sin(toRad(deg+180))}
                stroke={a8} strokeWidth={0.9} />
            </G>
          ))}
          {/* corner creatures (simplified) */}
          {[[-30,-30],[30,-30],[-30,30],[30,30]].map(([dx,dy], i) => (
            <Circle key={i} cx={cx+dx} cy={H*0.5+dy} r={4} fill={a2} stroke={a5} strokeWidth={0.5} />
          ))}
        </>
      );

    case 11: // Sprawiedliwość — scales, sword, crown
      return (
        <>
          {/* throne back */}
          <Rect x={cx-24} y={H*0.14} width={48} height={H*0.72} rx={4} fill={a2} stroke={a5} strokeWidth={0.6} />
          {/* figure */}
          <Circle cx={cx} cy={H*0.26} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Rect x={cx-12} y={H*0.33} width={24} height={H*0.34} rx={2} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* crown */}
          <Path d={`M${cx-10},${H*0.16} L${cx-8},${H*0.08} L${cx},${H*0.12} L${cx+8},${H*0.08} L${cx+10},${H*0.16} Z`} fill={a5} stroke={a8} strokeWidth={0.6} />
          {/* balance beam */}
          <Line x1={cx-26} y1={H*0.38} x2={cx+26} y2={H*0.38} stroke={a8} strokeWidth={1.0} />
          <Line x1={cx} y1={H*0.32} x2={cx} y2={H*0.38} stroke={a8} strokeWidth={0.8} />
          {/* pans */}
          <Path d={`M${cx-26},${H*0.38} Q${cx-22},${H*0.46} ${cx-18},${H*0.38}`} fill="none" stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx+18},${H*0.38} Q${cx+22},${H*0.46} ${cx+26},${H*0.38}`} fill="none" stroke={a8} strokeWidth={0.8} />
          {/* sword */}
          <Line x1={cx+16} y1={H*0.44} x2={cx+16} y2={H*0.78} stroke={a8} strokeWidth={1.2} />
          <Line x1={cx+10} y1={H*0.56} x2={cx+22} y2={H*0.56} stroke={a8} strokeWidth={0.8} />
        </>
      );

    case 12: // Wisielec — T-bar, inverted figure, halo
      return (
        <>
          {/* T-bar (tau cross) */}
          <Line x1={cx-28} y1={H*0.2} x2={cx+28} y2={H*0.2} stroke={a8} strokeWidth={2.0} />
          <Line x1={cx-28} y1={H*0.12} x2={cx-28} y2={H*0.2} stroke={a8} strokeWidth={1.6} />
          <Line x1={cx+28} y1={H*0.12} x2={cx+28} y2={H*0.2} stroke={a8} strokeWidth={1.6} />
          {/* rope */}
          <Line x1={cx} y1={H*0.2} x2={cx} y2={H*0.3} stroke={a8} strokeWidth={0.8} />
          {/* inverted figure — head at bottom */}
          <Circle cx={cx} cy={H*0.76} r={8} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* radiant halo */}
          <Circle cx={cx} cy={H*0.76} r={13} fill="none" stroke={a5} strokeWidth={0.6} />
          {/* body */}
          <Path d={`M${cx-10},${H*0.68} L${cx+10},${H*0.68} L${cx+8},${H*0.3} L${cx-8},${H*0.3} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* arms out */}
          <Line x1={cx-10} y1={H*0.44} x2={cx-22} y2={H*0.36} stroke={a8} strokeWidth={1.0} />
          <Line x1={cx+10} y1={H*0.44} x2={cx+22} y2={H*0.36} stroke={a8} strokeWidth={1.0} />
        </>
      );

    case 13: // Śmierć — skull, twin towers, white rose, rising sun
      return (
        <>
          {/* twin towers */}
          <Rect x={14} y={H*0.22} width={14} height={H*0.66} fill={a2} stroke={a5} strokeWidth={0.7} />
          <Rect x={W-28} y={H*0.22} width={14} height={H*0.66} fill={a2} stroke={a5} strokeWidth={0.7} />
          {/* rising sun between towers */}
          <Circle cx={cx} cy={H*0.88} r={14} fill={a3} stroke={a5} strokeWidth={0.6} />
          {/* skull */}
          <Circle cx={cx} cy={H*0.3} r={12} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Rect x={cx-7} y={H*0.37} width={14} height={8} rx={2} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* eye sockets */}
          <Circle cx={cx-4} cy={H*0.28} r={3} fill={a2} />
          <Circle cx={cx+4} cy={H*0.28} r={3} fill={a2} />
          {/* nose */}
          <Path d={`M${cx-2},${H*0.33} L${cx},${H*0.36} L${cx+2},${H*0.33}`} fill="none" stroke={a2} strokeWidth={0.7} />
          {/* white rose */}
          <Circle cx={cx} cy={H*0.6} r={7} fill={a5} stroke={a8} strokeWidth={0.6} />
          <Circle cx={cx} cy={H*0.6} r={3} fill={a8} />
          {/* stem */}
          <Line x1={cx} y1={H*0.67} x2={cx} y2={H*0.82} stroke={a8} strokeWidth={0.8} />
        </>
      );

    case 14: // Umiarkowanie — angel, two chalices, flowing liquid, triangle
      return (
        <>
          {/* pool at bottom */}
          <Ellipse cx={cx} cy={H*0.82} rx={28} ry={7} fill={a3} stroke={a5} strokeWidth={0.7} />
          {/* figure */}
          <Circle cx={cx} cy={H*0.3} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-12},${H*0.37} L${cx+12},${H*0.37} L${cx+14},${H*0.72} L${cx-14},${H*0.72} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* wings */}
          <Path d={`M${cx-12},${H*0.42} Q${cx-30},${H*0.3} ${cx-26},${H*0.54}`} fill={a5} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx+12},${H*0.42} Q${cx+30},${H*0.3} ${cx+26},${H*0.54}`} fill={a5} stroke={a8} strokeWidth={0.8} />
          {/* triangle on chest */}
          <Path d={polyPath(cx, H*0.52, 7, 3)} fill="none" stroke={a8} strokeWidth={0.7} />
          {/* two chalices */}
          <G>{suit('c', cx-18, H*0.56, 6, a5, a8)}</G>
          <G>{suit('c', cx+18, H*0.56, 6, a5, a8)}</G>
          {/* flowing liquid arc */}
          <Path d={`M${cx-12},${H*0.5} Q${cx},${H*0.42} ${cx+12},${H*0.5}`} fill="none" stroke={a8} strokeWidth={0.8} strokeDasharray="2,2" />
        </>
      );

    case 15: // Diabeł — bat wings, pentagram, devil, chained figures
      return (
        <>
          {/* bat wings */}
          <Path d={`M${cx},${H*0.36} Q${cx-36},${H*0.18} ${cx-30},${H*0.54}`} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx},${H*0.36} Q${cx+36},${H*0.18} ${cx+30},${H*0.54}`} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* wing membrane lines */}
          <Line x1={cx} y1={H*0.36} x2={cx-20} y2={H*0.28} stroke={a5} strokeWidth={0.5} />
          <Line x1={cx} y1={H*0.36} x2={cx+20} y2={H*0.28} stroke={a5} strokeWidth={0.5} />
          {/* devil head */}
          <Circle cx={cx} cy={H*0.3} r={8} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* horns */}
          <Path d={`M${cx-7},${H*0.22} L${cx-5},${H*0.12} L${cx-2},${H*0.22}`} fill={a8} />
          <Path d={`M${cx+7},${H*0.22} L${cx+5},${H*0.12} L${cx+2},${H*0.22}`} fill={a8} />
          {/* inverted pentagram */}
          <Path d={starPath(cx, H*0.15, 6, 3)} fill={a5} stroke={a8} strokeWidth={0.5} />
          {/* pedestal */}
          <Rect x={cx-12} y={H*0.54} width={24} height={8} rx={2} fill={a2} stroke={a8} strokeWidth={0.6} />
          {/* chained figures */}
          <Circle cx={cx-16} cy={H*0.72} r={5} fill={a3} stroke={a8} strokeWidth={0.6} />
          <Line x1={cx-16} y1={H*0.77} x2={cx-16} y2={H*0.86} stroke={a8} strokeWidth={0.9} />
          <Line x1={cx-16} y1={H*0.62} x2={cx} y2={H*0.58} stroke={a5} strokeWidth={0.7} />
          <Circle cx={cx+16} cy={H*0.72} r={5} fill={a3} stroke={a8} strokeWidth={0.6} />
          <Line x1={cx+16} y1={H*0.77} x2={cx+16} y2={H*0.86} stroke={a8} strokeWidth={0.9} />
          <Line x1={cx+16} y1={H*0.62} x2={cx} y2={H*0.58} stroke={a5} strokeWidth={0.7} />
        </>
      );

    case 16: // Wieża — tall tower, lightning, crown, falling figures, flames
      return (
        <>
          {/* tower base */}
          <Rect x={cx-16} y={H*0.3} width={32} height={H*0.58} rx={3} fill={a2} stroke={a8} strokeWidth={1.0} />
          {/* tower top / battlements */}
          <Rect x={cx-18} y={H*0.24} width={36} height={8} rx={2} fill={a3} stroke={a8} strokeWidth={0.8} />
          {[cx-14, cx-6, cx+2, cx+10].map((x2, i) => (
            <Rect key={i} x={x2} y={H*0.18} width={6} height={8} rx={1} fill={a3} stroke={a8} strokeWidth={0.6} />
          ))}
          {/* windows */}
          <Rect x={cx-6} y={H*0.44} width={12} height={9} rx={1} fill={a3} stroke={a5} strokeWidth={0.5} />
          <Rect x={cx-6} y={H*0.58} width={12} height={9} rx={1} fill={a3} stroke={a5} strokeWidth={0.5} />
          {/* lightning bolt */}
          <Path d={`M${cx+22},${H*0.12} L${cx+12},${H*0.3} L${cx+18},${H*0.3} L${cx+8},${H*0.5}`} fill="none" stroke={a8} strokeWidth={1.8} strokeLinejoin="round" />
          {/* crown flying off */}
          <Path d={`M${cx-8},${H*0.14} L${cx-6},${H*0.08} L${cx},${H*0.11} L${cx+6},${H*0.08} L${cx+8},${H*0.14} Z`} fill={a5} stroke={a8} strokeWidth={0.6} />
          {/* falling figures */}
          <Circle cx={cx-22} cy={H*0.46} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx-22} y1={H*0.51} x2={cx-26} y2={H*0.66} stroke={a8} strokeWidth={1.0} />
          <Circle cx={cx+24} cy={H*0.52} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx+24} y1={H*0.57} x2={cx+28} y2={H*0.72} stroke={a8} strokeWidth={1.0} />
          {/* flames at base */}
          {[-12,-4,4,12].map((dx, i) => (
            <Path key={i} d={`M${cx+dx},${H*0.88} Q${cx+dx-4},${H*0.78} ${cx+dx},${H*0.72} Q${cx+dx+4},${H*0.78} ${cx+dx+8},${H*0.88}`} fill={a5} stroke="none" />
          ))}
        </>
      );

    case 17: // Gwiazda — 8-pointed star, small stars, kneeling figure, water
      return (
        <>
          {/* 8-pointed large star */}
          <Path d={starPath(cx, H*0.22, 14, 6)} fill={a5} stroke={a8} strokeWidth={0.6} />
          {/* 7 small stars */}
          {[[-24,-10],[-30,4],[-22,16],[24,-10],[30,4],[22,16],[0,-24]].map(([dx,dy], i) => (
            <Path key={i} d={starPath(cx+dx, H*0.22+dy, 4, 1.8)} fill={a3} />
          ))}
          {/* kneeling figure */}
          <Circle cx={cx} cy={H*0.58} r={6} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Path d={`M${cx-8},${H*0.64} L${cx+8},${H*0.64} L${cx+6},${H*0.78} L${cx-6},${H*0.78} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* arms pouring water */}
          <Path d={`M${cx-8},${H*0.66} L${cx-22},${H*0.72}`} stroke={a8} strokeWidth={0.9} />
          <Path d={`M${cx+8},${H*0.66} L${cx+22},${H*0.68}`} stroke={a8} strokeWidth={0.9} />
          {/* water waves */}
          <Path d={`M12,${H*0.82} Q${cx-10},${H*0.78} ${cx},${H*0.82} Q${cx+10},${H*0.86} ${W-12},${H*0.82}`} fill="none" stroke={a5} strokeWidth={0.8} />
          <Path d={`M12,${H*0.87} Q${cx-10},${H*0.83} ${cx},${H*0.87} Q${cx+10},${H*0.91} ${W-12},${H*0.87}`} fill="none" stroke={a5} strokeWidth={0.6} />
        </>
      );

    case 18: // Księżyc — moon with face, two towers, wolf heads, crayfish
      return (
        <>
          {/* moon */}
          <Circle cx={cx} cy={H*0.18} r={14} fill={a3} stroke={a8} strokeWidth={0.8} />
          {/* face dots on moon */}
          <Circle cx={cx-4} cy={H*0.16} r={1.5} fill={a8} />
          <Circle cx={cx+4} cy={H*0.16} r={1.5} fill={a8} />
          <Path d={`M${cx-4},${H*0.21} Q${cx},${H*0.24} ${cx+4},${H*0.21}`} fill="none" stroke={a8} strokeWidth={0.7} />
          {/* falling rays/drops */}
          {[-10,-5,0,5,10].map((dx, i) => (
            <Circle key={i} cx={cx+dx} cy={H*0.34+i%2*3} r={1} fill={a5} />
          ))}
          {/* path/road */}
          <Path d={`M${cx-4},${H*0.88} L${cx-4},${H*0.56} Q${cx},${H*0.48} ${cx+4},${H*0.56} L${cx+4},${H*0.88}`} fill="none" stroke={a5} strokeWidth={0.7} />
          {/* twin towers */}
          <Rect x={14} y={H*0.42} width={14} height={H*0.46} fill={a2} stroke={a5} strokeWidth={0.7} />
          <Rect x={W-28} y={H*0.42} width={14} height={H*0.46} fill={a2} stroke={a5} strokeWidth={0.7} />
          {/* wolf heads */}
          <Circle cx={cx-24} cy={H*0.6} r={6} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Path d={`M${cx-28},${H*0.54} L${cx-26},${H*0.48} L${cx-22},${H*0.54}`} fill={a3} stroke={a8} strokeWidth={0.5} />
          <Circle cx={cx+24} cy={H*0.6} r={6} fill={a3} stroke={a8} strokeWidth={0.7} />
          <Path d={`M${cx+28},${H*0.54} L${cx+26},${H*0.48} L${cx+22},${H*0.54}`} fill={a3} stroke={a8} strokeWidth={0.5} />
          {/* crayfish */}
          <Ellipse cx={cx} cy={H*0.82} rx={6} ry={4} fill={a5} stroke={a8} strokeWidth={0.6} />
          <Line x1={cx-8} y1={H*0.8} x2={cx-14} y2={H*0.76} stroke={a8} strokeWidth={0.6} />
          <Line x1={cx+8} y1={H*0.8} x2={cx+14} y2={H*0.76} stroke={a8} strokeWidth={0.6} />
        </>
      );

    case 19: // Słońce — large sun, child on horse, sunflowers
      return (
        <>
          {/* large sun */}
          <Circle cx={cx} cy={H*0.22} r={18} fill={a3} stroke={a8} strokeWidth={0.8} />
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
            <Line key={i}
              x1={cx + 20*Math.cos(toRad(deg))} y1={H*0.22 + 20*Math.sin(toRad(deg))}
              x2={cx + 28*Math.cos(toRad(deg))} y2={H*0.22 + 28*Math.sin(toRad(deg))}
              stroke={a8} strokeWidth={1.0} />
          ))}
          {/* face on sun */}
          <Circle cx={cx-5} cy={H*0.2} r={1.5} fill={a8} />
          <Circle cx={cx+5} cy={H*0.2} r={1.5} fill={a8} />
          <Path d={`M${cx-5},${H*0.25} Q${cx},${H*0.28} ${cx+5},${H*0.25}`} fill="none" stroke={a8} strokeWidth={0.7} />
          {/* horse */}
          <Ellipse cx={cx-4} cy={H*0.72} rx={18} ry={9} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Circle cx={cx+12} cy={H*0.62} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* horse legs */}
          {[-14,-6,4,12].map((dx, i) => (
            <Line key={i} x1={cx+dx} y1={H*0.8} x2={cx+dx+2} y2={H*0.88} stroke={a8} strokeWidth={1.2} />
          ))}
          {/* child on horse */}
          <Circle cx={cx-2} cy={H*0.6} r={5} fill={a5} stroke={a8} strokeWidth={0.7} />
          {/* sunflowers */}
          <Circle cx={14} cy={H*0.6} r={4} fill={a5} stroke={a8} strokeWidth={0.6} />
          <Line x1={14} y1={H*0.64} x2={14} y2={H*0.78} stroke={a8} strokeWidth={0.7} />
          <Circle cx={W-14} cy={H*0.56} r={4} fill={a5} stroke={a8} strokeWidth={0.6} />
          <Line x1={W-14} y1={H*0.6} x2={W-14} y2={H*0.74} stroke={a8} strokeWidth={0.7} />
        </>
      );

    case 20: // Sąd — angel with wings, trumpet, 3 rising figures
      return (
        <>
          {/* angel */}
          <Circle cx={cx} cy={H*0.18} r={7} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-8},${H*0.25} L${cx+8},${H*0.25} L${cx+6},${H*0.42} L${cx-6},${H*0.42} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* wings */}
          <Path d={`M${cx-8},${H*0.28} Q${cx-32},${H*0.2} ${cx-28},${H*0.42}`} fill={a5} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx+8},${H*0.28} Q${cx+32},${H*0.2} ${cx+28},${H*0.42}`} fill={a5} stroke={a8} strokeWidth={0.8} />
          {/* trumpet */}
          <Path d={`M${cx+6},${H*0.3} L${cx+20},${H*0.28} L${cx+24},${H*0.34} L${cx+8},${H*0.38} Z`} fill={a2} stroke={a8} strokeWidth={0.6} />
          {/* banner cross on trumpet */}
          <Line x1={cx+20} y1={H*0.22} x2={cx+20} y2={H*0.3} stroke={a8} strokeWidth={0.7} />
          <Line x1={cx+16} y1={H*0.24} x2={cx+24} y2={H*0.24} stroke={a8} strokeWidth={0.6} />
          {/* clouds */}
          <Path d={`M10,${H*0.46} Q${cx-20},${H*0.4} ${cx},${H*0.46} Q${cx+20},${H*0.4} ${W-10},${H*0.46}`} fill="none" stroke={a5} strokeWidth={0.7} />
          {/* 3 rising figures */}
          {[-22, 0, 22].map((dx, i) => (
            <G key={i}>
              <Circle cx={cx+dx} cy={H*0.66} r={5} fill={a3} stroke={a8} strokeWidth={0.7} />
              <Path d={`M${cx+dx-6},${H*0.71} L${cx+dx+6},${H*0.71} L${cx+dx+4},${H*0.84} L${cx+dx-4},${H*0.84} Z`} fill={a3} stroke={a8} strokeWidth={0.6} />
              {/* arms raised */}
              <Line x1={cx+dx-6} y1={H*0.74} x2={cx+dx-12} y2={H*0.66} stroke={a8} strokeWidth={0.8} />
              <Line x1={cx+dx+6} y1={H*0.74} x2={cx+dx+12} y2={H*0.66} stroke={a8} strokeWidth={0.8} />
            </G>
          ))}
        </>
      );

    case 21: // Świat — oval wreath, dancing figure, 4 corner creatures
      return (
        <>
          {/* oval wreath */}
          <Ellipse cx={cx} cy={H*0.5} rx={32} ry={40} fill="none" stroke={a8} strokeWidth={1.4} />
          <Ellipse cx={cx} cy={H*0.5} rx={28} ry={36} fill="none" stroke={a5} strokeWidth={0.7} />
          {/* dancing figure */}
          <Circle cx={cx} cy={H*0.38} r={6} fill={a3} stroke={a8} strokeWidth={0.8} />
          <Path d={`M${cx-6},${H*0.44} L${cx+6},${H*0.44} L${cx+10},${H*0.62} L${cx-4},${H*0.62} Z`} fill={a3} stroke={a8} strokeWidth={0.7} />
          {/* legs dancing */}
          <Line x1={cx+4} y1={H*0.62} x2={cx+10} y2={H*0.76} stroke={a8} strokeWidth={1.1} />
          <Line x1={cx-2} y1={H*0.62} x2={cx-8} y2={H*0.74} stroke={a8} strokeWidth={1.1} />
          {/* arms */}
          <Line x1={cx-6} y1={H*0.5} x2={cx-16} y2={H*0.44} stroke={a8} strokeWidth={1.0} />
          <Line x1={cx+6} y1={H*0.5} x2={cx+16} y2={H*0.54} stroke={a8} strokeWidth={1.0} />
          {/* 4 corner creatures */}
          <Circle cx={14} cy={H*0.12} r={6} fill={a2} stroke={a5} strokeWidth={0.6} />
          <Circle cx={W-14} cy={H*0.12} r={6} fill={a2} stroke={a5} strokeWidth={0.6} />
          <Circle cx={14} cy={H*0.88} r={6} fill={a2} stroke={a5} strokeWidth={0.6} />
          <Circle cx={W-14} cy={H*0.88} r={6} fill={a2} stroke={a5} strokeWidth={0.6} />
        </>
      );

    default:
      return (
        <Path d={starPath(cx, H*0.5, 18, 8)} fill={a3} stroke={a8} strokeWidth={0.8} />
      );
  }
};

// ─── Style system ─────────────────────────────────────────────────────────────

const getStyleAlphas = (accent: string, textColor: string, style: string) => {
  switch (style) {
    case 'golden': return {
      a8: accent + 'FF', a5: accent + 'B3', a3: accent + '66', a2: accent + '40',
      t8: textColor + 'FF', t5: textColor + 'CC',
    };
    case 'moon': return {
      a8: accent + '7A', a5: accent + '2E', a3: accent + '18', a2: accent + '0C',
      t8: textColor + '7A', t5: textColor + '3D',
    };
    case 'obsidian': return {
      a8: accent + 'E6', a5: accent + 'A6', a3: accent + '60', a2: accent + '28',
      t8: textColor + 'E6', t5: textColor + 'A6',
    };
    case 'geometry': return {
      a8: accent + '99', a5: accent + 'CC', a3: accent + '99', a2: accent + '55',
      t8: textColor + '80', t5: textColor + '60',
    };
    default: return { // classic
      a8: accent + 'CC', a5: accent + '80', a3: accent + '4D', a2: accent + '2A',
      t8: textColor + 'CC', t5: textColor + '80',
    };
  }
};

const renderArtBackground = (style: string, a8: string, a5: string, a3: string, a2: string) => {
  switch (style) {
    case 'golden':
      return (
        <G opacity={0.32}>
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return <Line key={i} x1={cx} y1={H / 2} x2={cx + 72 * Math.cos(angle)} y2={H / 2 + 72 * Math.sin(angle)} stroke={a8} strokeWidth={0.4} />;
          })}
          <Circle cx={cx} cy={H / 2} r={6} fill={a3} stroke={a8} strokeWidth={0.4} />
          <Circle cx={cx} cy={H / 2} r={20} fill="none" stroke={a5} strokeWidth={0.3} />
          <Circle cx={cx} cy={H / 2} r={36} fill="none" stroke={a3} strokeWidth={0.3} />
        </G>
      );
    case 'moon': {
      const stars: [number, number, number][] = [
        [14, 9, 2.1], [86, 7, 1.4], [7, 70, 1.7], [93, 64, 1.9],
        [51, 80, 1.5], [29, 17, 1.3], [74, 27, 1.9], [88, 45, 1.4],
      ];
      return (
        <G opacity={0.55}>
          {stars.map(([sx, sy, r], i) => (
            <Path key={i}
              d={`M${sx},${sy - r} L${sx + r * 0.35},${sy - r * 0.35} L${sx + r},${sy} L${sx + r * 0.35},${sy + r * 0.35} L${sx},${sy + r} L${sx - r * 0.35},${sy + r * 0.35} L${sx - r},${sy} L${sx - r * 0.35},${sy - r * 0.35} Z`}
              fill={a5}
            />
          ))}
          <Path d={`M5,${H * 0.52} Q${cx},${H * 0.42} ${W - 5},${H * 0.52}`} fill="none" stroke={a3} strokeWidth={0.5} />
        </G>
      );
    }
    case 'obsidian':
      return (
        <G opacity={0.2}>
          {[[-14, 0, W + 14, H], [0, 0, W, H], [14, 0, W - 14, H], [28, 0, W - 28, H]].map(([x1, y1, x2, y2], i) => (
            <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a8} strokeWidth={0.5} />
          ))}
          {[[W + 14, 0, -14, H], [W, 0, 0, H], [W - 14, 0, 14, H]].map(([x1, y1, x2, y2], i) => (
            <Line key={i + 4} x1={x1} y1={y1} x2={x2} y2={y2} stroke={a8} strokeWidth={0.4} />
          ))}
        </G>
      );
    case 'geometry': {
      const r = 19;
      const pts: [number, number][] = [
        [cx, H / 2],
        [cx + r, H / 2],
        [cx - r, H / 2],
        [cx + r * 0.5, H / 2 - r * 0.866],
        [cx - r * 0.5, H / 2 - r * 0.866],
        [cx + r * 0.5, H / 2 + r * 0.866],
        [cx - r * 0.5, H / 2 + r * 0.866],
      ];
      return (
        <G opacity={0.18}>
          {pts.map(([px, py], i) => (
            <Circle key={i} cx={px} cy={py} r={r} fill="none" stroke={a8} strokeWidth={0.55} />
          ))}
        </G>
      );
    }
    default: // classic — subtle dot grid
      return (
        <G opacity={0.28}>
          {([25, 50, 75] as number[]).flatMap(gx =>
            ([18, 36, 54, 70] as number[]).map(gy => (
              <Circle key={`${gx}-${gy}`} cx={gx} cy={gy} r={0.8} fill={a3} />
            ))
          )}
        </G>
      );
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const TarotCardArt: React.FC<TarotCardArtProps> = ({ cardId, accent, textColor, width, height, artStyle = 'classic' }) => {
  // Derive alpha variants based on art style
  const { a8, a5, a3, a2, t8, t5 } = getStyleAlphas(accent, textColor, artStyle);

  // Parse cardId
  const majorMatch = /^(\d+)$/.exec(cardId);
  const minorMatch = /^([cswp])(\d+)$/.exec(cardId);

  let content: React.ReactNode = null;

  if (majorMatch) {
    const n = parseInt(majorMatch[1], 10);
    content = renderMajorCard(n, accent, textColor, a8, a5, a3, a2, t8, t5);
  } else if (minorMatch) {
    const su = minorMatch[1] as SuitKey;
    const n = parseInt(minorMatch[2], 10);
    content = renderMinorCard(su, n, accent, a8, a5, a3, t5);
  } else {
    // Fallback: decorative star
    content = <Path d={starPath(cx, H*0.5, 18, 8)} fill={a3} stroke={a8} strokeWidth={0.8} />;
  }

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width={width} height={height}>
      {renderArtBackground(artStyle, a8, a5, a3, a2)}
      {content}
    </Svg>
  );
};
