import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SC, G as SG, Line as SL, Path as SP } from 'react-native-svg';
import { MoonStar, Orbit, Shield, Sparkles, SunMedium } from 'lucide-react-native';
import { TarotCardData, TarotDeck } from '../types';
import { Typography } from '../../../components/Typography';
import { resolveUserFacingText } from '../../../core/utils/contentResolver';
import { TarotCardArt } from './TarotCardArt';

interface TarotCardVisualProps {
  deck: TarotDeck;
  card?: TarotCardData;
  isReversed?: boolean;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  subtitle?: string;
}

const SIZE_MAP = {
  small: {
    width: 145,
    height: 266,
    radius: 22,
    emblem: 22,
    artH: 158,
    title: 'cardTitle' as const,
    inset: 6,
    paddingX: 8,
    paddingY: 8,
    titleLines: 2,
    copyLines: 2,
    footerLines: 2,
    titleStyle: { fontSize: 13, lineHeight: 17 },
    microStyle: { fontSize: 9, lineHeight: 12 },
    footerStyle: { fontSize: 9, lineHeight: 13 },
  },
  medium: {
    width: 196,
    height: 358,
    radius: 28,
    emblem: 30,
    artH: 226,
    title: 'cardTitle' as const,
    inset: 8,
    paddingX: 12,
    paddingY: 10,
    titleLines: 2,
    copyLines: 2,
    footerLines: 2,
    titleStyle: { fontSize: 16, lineHeight: 21 },
    microStyle: { fontSize: 10, lineHeight: 14 },
    footerStyle: { fontSize: 10, lineHeight: 14 },
  },
  large: {
    width: 252,
    height: 460,
    radius: 32,
    emblem: 36,
    artH: 296,
    title: 'cardTitle' as const,
    inset: 10,
    paddingX: 14,
    paddingY: 12,
    titleLines: 2,
    copyLines: 3,
    footerLines: 3,
    titleStyle: { fontSize: 20, lineHeight: 26 },
    microStyle: { fontSize: 11, lineHeight: 15 },
    footerStyle: { fontSize: 11, lineHeight: 15 },
  },
};

const getSuitGlyph = (card?: TarotCardData) => {
  if (!card) return 'Arkan';
  if (card.suit === 'cups') return 'Kielichy';
  if (card.suit === 'swords') return 'Miecze';
  if (card.suit === 'wands') return 'Buławy';
  if (card.suit === 'pentacles') return 'Denary';
  return 'Wielkie Arkana';
};

const renderMotifIcon = (motif: TarotDeck['motif'], color: string, size: number) => {
  if (motif === 'moon') return <MoonStar color={color} size={size} strokeWidth={1.35} />;
  if (motif === 'golden') return <SunMedium color={color} size={size} strokeWidth={1.35} />;
  if (motif === 'geometry') return <Orbit color={color} size={size} strokeWidth={1.35} />;
  if (motif === 'obsidian') return <Sparkles color={color} size={size} strokeWidth={1.35} />;
  return <Shield color={color} size={size} strokeWidth={1.35} />;
};

const renderBackPattern = (deck: TarotDeck, w: number, h: number) => {
  const a0 = deck.accent[0];
  const a1 = deck.accent[1];
  const cx = w / 2;
  const cy = h / 2;

  // ── Sunburst (golden_sanctuary) ─────────────────────────────────────────
  if (deck.patternStyle === 'sunburst') {
    const rays = 18;
    const rO = Math.min(w, h) * 0.46;
    const rI = rO * 0.14;
    return (
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <SG>
          {Array.from({ length: rays }, (_, i) => {
            const a1a = ((i * 360) / rays * Math.PI) / 180;
            const a2a = (((i + 0.5) * 360) / rays * Math.PI) / 180;
            const a3a = (((i + 1) * 360) / rays * Math.PI) / 180;
            const x1 = cx + rI * Math.cos(a1a); const y1 = cy + rI * Math.sin(a1a);
            const x2 = cx + rO * Math.cos(a2a); const y2 = cy + rO * Math.sin(a2a);
            const x3 = cx + rI * Math.cos(a3a); const y3 = cy + rI * Math.sin(a3a);
            return <SP key={i} d={`M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} L${x3.toFixed(1)},${y3.toFixed(1)} Z`} fill={i % 2 === 0 ? a0 + '28' : a1 + '18'} />;
          })}
          <SC cx={cx} cy={cy} r={rO} fill="none" stroke={a0 + '44'} strokeWidth={1.2} />
          <SC cx={cx} cy={cy} r={rO * 0.55} fill="none" stroke={a1 + '33'} strokeWidth={0.7} />
          <SC cx={cx} cy={cy} r={rO * 0.22} fill={a0 + '22'} stroke={a0 + '55'} strokeWidth={0.9} />
          <SC cx={cx} cy={cy} r={rO * 0.08} fill={a0 + '66'} />
          {/* Corner flourishes */}
          {([[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]] as [number, number][]).map(([dx, dy], i) => (
            <SC key={i} cx={dx} cy={dy} r={7} fill="none" stroke={a0 + '44'} strokeWidth={0.8} />
          ))}
        </SG>
      </Svg>
    );
  }

  // ── Phases / Moon (moonlit_veil) ────────────────────────────────────────
  if (deck.patternStyle === 'phases') {
    const moonR = Math.min(w, h) * 0.22;
    const stars: [number, number, number][] = [
      [w * 0.1, h * 0.09, 4.2], [w * 0.9, h * 0.07, 3.0], [w * 0.07, h * 0.46, 3.4],
      [w * 0.93, h * 0.42, 4.0], [w * 0.14, h * 0.82, 3.2], [w * 0.87, h * 0.8, 3.0],
      [w * 0.5, h * 0.11, 2.8], [w * 0.28, h * 0.9, 2.5], [w * 0.73, h * 0.92, 3.0],
      [w * 0.32, h * 0.05, 2.2], [w * 0.68, h * 0.06, 2.0],
    ];
    const diamond = (sx: number, sy: number, r: number) =>
      `M${sx},${sy - r} L${sx + r * 0.38},${sy - r * 0.38} L${sx + r},${sy} L${sx + r * 0.38},${sy + r * 0.38} L${sx},${sy + r} L${sx - r * 0.38},${sy + r * 0.38} L${sx - r},${sy} L${sx - r * 0.38},${sy - r * 0.38} Z`;
    return (
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <SG>
          {/* Crescent moon */}
          <SC cx={cx} cy={cy} r={moonR} fill={a0 + '1A'} stroke={a0 + '55'} strokeWidth={1.1} />
          <SC cx={cx + moonR * 0.42} cy={cy} r={moonR * 0.8} fill={deck.backGradient[1]} />
          {/* Stars */}
          {stars.map(([sx, sy, r], i) => (
            <SP key={i} d={diamond(sx, sy, r)} fill={a0 + (i % 3 === 0 ? '77' : '55')} />
          ))}
          {/* Soft halos */}
          <SC cx={cx} cy={cy} r={moonR * 1.85} fill="none" stroke={a1 + '28'} strokeWidth={0.7} />
          <SC cx={cx} cy={cy} r={moonR * 2.9} fill="none" stroke={a1 + '18'} strokeWidth={0.5} />
        </SG>
      </Svg>
    );
  }

  // ── Facets / Crystal (obsidian_mirror) ──────────────────────────────────
  if (deck.patternStyle === 'facets') {
    const r = Math.min(w, h) * 0.38;
    const hex = Array.from({ length: 6 }, (_, i) => {
      const a = (i * 60 * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
    });
    const hexPath = hex.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
    const innerHex = hex.map((p, i) => {
      const sx = cx + (p[0] - cx) * 0.48; const sy = cy + (p[1] - cy) * 0.48;
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)},${sy.toFixed(1)}`;
    }).join(' ') + ' Z';
    return (
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <SG>
          <SP d={hexPath} fill={a0 + '10'} stroke={a0 + '55'} strokeWidth={1.4} />
          {/* Vertex-to-vertex diagonals */}
          {([[0, 3], [1, 4], [2, 5]] as [number, number][]).map(([i1, i2], i) => (
            <SL key={i} x1={hex[i1][0]} y1={hex[i1][1]} x2={hex[i2][0]} y2={hex[i2][1]} stroke={a1 + '3A'} strokeWidth={0.8} />
          ))}
          {/* Inner hexagon */}
          <SP d={innerHex} fill="none" stroke={a0 + '38'} strokeWidth={0.9} />
          {/* Vertex → center rays (alternate) */}
          {[0, 2, 4].map(i => (
            <SL key={i} x1={hex[i][0]} y1={hex[i][1]} x2={cx} y2={cy} stroke={a0 + '28'} strokeWidth={0.5} />
          ))}
          {/* Center dot */}
          <SC cx={cx} cy={cy} r={4.5} fill={a0 + '44'} stroke={a0 + '66'} strokeWidth={0.7} />
          {/* Corner diamonds */}
          {([[10, 10], [w - 10, 10], [10, h - 10], [w - 10, h - 10]] as [number, number][]).map(([dx, dy], i) => (
            <SP key={i} d={`M${dx},${dy - 7} L${dx + 7},${dy} L${dx},${dy + 7} L${dx - 7},${dy} Z`} fill="none" stroke={a0 + '50'} strokeWidth={0.9} />
          ))}
        </SG>
      </Svg>
    );
  }

  // ── Lattice / Flower of Life (sacred_geometry) ──────────────────────────
  if (deck.patternStyle === 'lattice') {
    const fr = Math.min(w, h) * 0.14;
    const centers: [number, number][] = [
      [cx, cy],
      ...Array.from({ length: 6 }, (_, i) => {
        const a = (i * 60 * Math.PI) / 180;
        return [cx + fr * 2 * Math.cos(a), cy + fr * 2 * Math.sin(a)] as [number, number];
      }),
    ];
    return (
      <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
        <SG>
          {/* Flower of Life circles */}
          {centers.map(([fx, fy], i) => (
            <SC key={i} cx={fx} cy={fy} r={fr} fill={a0 + '0D'} stroke={a0 + (i === 0 ? '55' : '38')} strokeWidth={0.7} />
          ))}
          {/* Outer enveloping circle */}
          <SC cx={cx} cy={cy} r={fr * 3.02} fill="none" stroke={a1 + '33'} strokeWidth={0.9} />
          <SC cx={cx} cy={cy} r={fr * 4} fill="none" stroke={a1 + '1A'} strokeWidth={0.6} />
          {/* Corner triangles */}
          {([[w * 0.05, h * 0.035], [w * 0.95, h * 0.035], [w * 0.05, h * 0.965], [w * 0.95, h * 0.965]] as [number, number][]).map(([tx, ty], i) => {
            const ts = 11;
            const dx = i % 2 === 0 ? ts : -ts;
            const dy = i < 2 ? ts : -ts;
            return <SP key={i} d={`M${tx},${ty} L${tx + dx},${ty} L${tx},${ty + dy} Z`} fill="none" stroke={a0 + '50'} strokeWidth={0.8} />;
          })}
        </SG>
      </Svg>
    );
  }

  // ── Compass (classic + rider_waite default) ─────────────────────────────
  const ring = Math.min(w, h) * 0.31;
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <SG>
        {/* Concentric rings */}
        {([1, 0.72, 0.46] as number[]).map((scale, i) => (
          <SC key={i} cx={cx} cy={cy} r={ring * scale} fill="none"
            stroke={i === 0 ? a0 + '55' : a1 + '35'} strokeWidth={i === 0 ? 1.3 : 0.8}
          />
        ))}
        {/* 16 rays: 8 long + 8 short alternating */}
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i * 22.5 * Math.PI) / 180;
          const main = i % 2 === 0;
          const r1 = ring * 0.46; const r2 = ring * (main ? 1.18 : 0.82);
          return <SL key={i}
            x1={cx + r1 * Math.cos(angle)} y1={cy + r1 * Math.sin(angle)}
            x2={cx + r2 * Math.cos(angle)} y2={cy + r2 * Math.sin(angle)}
            stroke={main ? a0 + '55' : a0 + '2E'} strokeWidth={main ? 0.9 : 0.5}
          />;
        })}
        {/* Cardinal diamond points N/S/E/W */}
        {[0, 90, 180, 270].map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const pr = ring * 0.52;
          const px = cx + pr * Math.cos(a); const py = cy + pr * Math.sin(a);
          const ds = 5.5;
          return <SP key={i} d={`M${px},${py - ds} L${px + ds},${py} L${px},${py + ds} L${px - ds},${py} Z`} fill={a0 + '44'} stroke={a0 + '66'} strokeWidth={0.7} />;
        })}
        {/* Corner circles */}
        {([[11, 11], [w - 11, 11], [11, h - 11], [w - 11, h - 11]] as [number, number][]).map(([dx, dy], i) => (
          <SC key={i} cx={dx} cy={dy} r={6} fill="none" stroke={a0 + '44'} strokeWidth={1} />
        ))}
      </SG>
    </Svg>
  );
};

const renderCornerOrnament = (style: string, a0: string, a1: string, pos: object) => {
  switch (style) {
    case 'sanctuary': // golden — trefoil (3 tiny circles)
      return (
        <View key={JSON.stringify(pos)} style={{ position: 'absolute', width: 14, height: 14, ...pos }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: a0 + '55', position: 'absolute', top: 0, left: 4 }} />
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: a0 + '44', position: 'absolute', top: 6, left: 0 }} />
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: a0 + '44', position: 'absolute', top: 6, left: 8 }} />
        </View>
      );
    case 'veil': // moon — photo corner arcs (two lines)
      return (
        <View key={JSON.stringify(pos)} style={{ position: 'absolute', width: 10, height: 10, borderTopWidth: 1.2, borderLeftWidth: 1.2, borderColor: a0 + '70', ...pos }} />
      );
    case 'obsidian': // sharp diamond
      return (
        <View key={JSON.stringify(pos)} style={{ position: 'absolute', width: 9, height: 9, borderWidth: 1, borderColor: a0 + '66', transform: [{ rotate: '45deg' }], ...pos }} />
      );
    case 'geometry': // small triangle
      return (
        <View key={JSON.stringify(pos)} style={{ position: 'absolute', width: 10, height: 10, borderBottomWidth: 1.2, borderRightWidth: 1.2, borderColor: a0 + '60', ...pos }} />
      );
    default: // heritage — classic small diamond dot
      return (
        <View key={JSON.stringify(pos)} style={{ position: 'absolute', width: 7, height: 7, borderRadius: 1, backgroundColor: a0 + '44', transform: [{ rotate: '45deg' }], ...pos }} />
      );
  }
};

const renderFrameDecor = (deck: TarotDeck, metrics: (typeof SIZE_MAP)[keyof typeof SIZE_MAP]) => {
  const a0 = deck.accent[0];
  const a1 = deck.accent[1];
  const ofs = 18; // corner ornament offset from frame edge

  const cornerPositions = [
    { top: ofs, left: ofs },
    { top: ofs, right: ofs },
    { bottom: ofs, left: ofs },
    { bottom: ofs, right: ofs },
  ];

  return (
    <>
      <View style={[styles.frameOuter, { borderColor: a0 + '55', borderRadius: metrics.radius - 8 }]} />
      <View style={[styles.frameInner, { borderColor: a1 + '35', borderRadius: metrics.radius - 12 }]} />
      <View style={[styles.topRule, { backgroundColor: a0 + '44' }]} />
      <View style={[styles.bottomRule, { backgroundColor: a0 + '30' }]} />
      {cornerPositions.map((pos) => renderCornerOrnament(deck.frameStyle, a0, a1, pos))}
    </>
  );
};

const renderFaceCenter = (
  deck: TarotDeck,
  card: TarotCardData | undefined,
  metrics: (typeof SIZE_MAP)[keyof typeof SIZE_MAP],
  title: string,
  isReversed?: boolean,
) => {
  const motif = renderMotifIcon(deck.motif, deck.accent[0], metrics.emblem);
  const artWidth = metrics.width - metrics.paddingX * 2 - metrics.inset * 2 - 12;
  const imageUrl = card && deck.imageMap ? deck.imageMap[card.id] : null;

  return (
    <View style={styles.faceCenter}>
      <View style={[
        styles.artShell,
        { borderColor: deck.accent[0] + '40', backgroundColor: deck.accent[0] + '0D' },
        imageUrl ? styles.artShellImage : null,
      ]}>
        {!imageUrl && (
          <LinearGradient
            colors={[deck.accent[0] + '22', 'transparent', deck.accent[1] + '12']}
            style={StyleSheet.absoluteFill}
          />
        )}
        {imageUrl ? (
          <Image
            source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
            style={[
              styles.cardImage,
              { width: artWidth, height: metrics.artH },
              isReversed ? { transform: [{ rotate: '180deg' }] } : null,
            ]}
            resizeMode="contain"
          />
        ) : card ? (
          <TarotCardArt
            cardId={card.id}
            accent={deck.accent[0]}
            textColor={deck.textOnCard}
            width={artWidth}
            height={metrics.artH}
            artStyle={deck.motif}
          />
        ) : (
          <View style={styles.motifWrap}>{motif}</View>
        )}
      </View>
      <Typography
        variant={metrics.title}
        color={deck.textOnCard}
        align="center"
        style={[styles.cardTitle, metrics.titleStyle]}
        numberOfLines={metrics.titleLines}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
      >
        {title}
      </Typography>
      <Typography
        variant="microLabel"
        color={deck.accent[1]}
        align="center"
        style={[styles.cardMicroCopy, metrics.microStyle]}
        numberOfLines={metrics.copyLines}
      >
        {card ? resolveUserFacingText(card.description) : deck.textureLabel}
      </Typography>
    </View>
  );
};

export const TarotCardVisual = ({ deck, card, isReversed, faceDown, size = 'medium', subtitle }: TarotCardVisualProps) => {
  const metrics = SIZE_MAP[size];
  const title = card ? resolveUserFacingText(card.name) : deck.name;

  if (faceDown) {
    return (
      <View style={[styles.shadowWrap, { width: metrics.width, height: metrics.height, borderRadius: metrics.radius }]}>
        <LinearGradient
          colors={deck.backGradient}
          style={[styles.card, { width: metrics.width, height: metrics.height, borderRadius: metrics.radius, borderColor: deck.border }]}
        >
          {renderBackPattern(deck, metrics.width, metrics.height)}
          <View
            style={[
              styles.innerFrame,
              {
                margin: metrics.inset,
                borderRadius: metrics.radius - 6,
                borderColor: deck.accent[0] + '40',
                paddingHorizontal: metrics.paddingX,
                paddingVertical: metrics.paddingY,
              },
            ]}
          >
            {renderFrameDecor(deck, metrics)}
            <View style={styles.backTop}>
              <Typography variant="microLabel" color={deck.accent[0]}>{deck.cardBackLabel}</Typography>
              <Typography variant="microLabel" color={deck.accent[1]} style={styles.backTexture}>{deck.textureLabel}</Typography>
            </View>
            <View style={styles.backCenter}>
              <View style={[styles.backMedallion, { borderColor: deck.accent[0] + '36', backgroundColor: deck.accent[0] + '12' }]}>
                {renderMotifIcon(deck.motif, deck.accent[0], metrics.emblem + 4)}
              </View>
            </View>
            <View style={styles.backBottom}>
              <Typography variant="microLabel" color={deck.accent[1]} align="center">
                {subtitle || 'Ceremonia odsłonięcia'}
              </Typography>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.shadowWrap, { width: metrics.width, height: metrics.height, borderRadius: metrics.radius }]}>
      <LinearGradient
        colors={deck.faceGradient}
        style={[styles.card, { width: metrics.width, height: metrics.height, borderRadius: metrics.radius, borderColor: deck.border }]}
      >
        <View
          style={[
            styles.innerFrame,
            {
              margin: metrics.inset,
              borderRadius: metrics.radius - 6,
              borderColor: deck.border,
              paddingHorizontal: metrics.paddingX,
              paddingVertical: metrics.paddingY,
            },
          ]}
        >
          {renderFrameDecor(deck, metrics)}
          <View style={styles.faceHeader}>
            <Typography variant="microLabel" color={deck.accent[0]}>{getSuitGlyph(card)}</Typography>
            <Typography variant="microLabel" color={deck.accent[1]} align="right">
              {subtitle || (isReversed ? 'Energia odwrócona' : 'Energia otwarta')}
            </Typography>
          </View>
          {renderFaceCenter(deck, card, metrics, title, isReversed)}
          <View style={styles.faceFooter}>
            <View style={[styles.footerRule, { backgroundColor: deck.accent[0] }]} />
            <Typography
              variant="microLabel"
              color={deck.textOnCard}
              align="center"
              style={metrics.footerStyle}
              numberOfLines={metrics.footerLines}
            >
              {card ? resolveUserFacingText(card.advice) : deck.mood}
            </Typography>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shadowWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 28,
    elevation: 12,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  innerFrame: {
    flex: 1,
    borderWidth: 1,
    paddingTop: 8,
    overflow: 'hidden',
  },
  frameOuter: {
    ...StyleSheet.absoluteFillObject,
    top: 2,
    left: 2,
    right: 2,
    bottom: 2,
    borderWidth: 1.2,
  },
  frameInner: {
    ...StyleSheet.absoluteFillObject,
    top: 7,
    left: 7,
    right: 7,
    bottom: 7,
    borderWidth: 0.8,
  },
  topRule: {
    position: 'absolute',
    top: 14,
    left: 24,
    right: 24,
    height: 1,
  },
  bottomRule: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    height: 1,
  },
  backTop: { alignItems: 'center', paddingTop: 4 },
  backTexture: { marginTop: 6, opacity: 0.82 },
  backCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backMedallion: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBottom: { alignItems: 'center', paddingBottom: 4 },
  faceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    minHeight: 26,
    gap: 8,
  },
  faceCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    gap: 7,
  },
  artShell: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: 8,
  },
  artShellImage: {
    paddingVertical: 0,
  },
  cardImage: {
    borderRadius: 14,
  },
  motifWrap: {
    minHeight: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceFooter: {
    alignItems: 'center',
    minHeight: 64,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  footerRule: {
    width: 40,
    height: 1,
    marginBottom: 10,
    opacity: 0.68,
  },
  cardTitle: {
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  cardMicroCopy: {
    opacity: 0.82,
    paddingHorizontal: 2,
    flexShrink: 1,
  },
});
