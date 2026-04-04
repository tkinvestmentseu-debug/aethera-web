import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    width: 130,
    height: 236,
    radius: 22,
    emblem: 22,
    artH: 102,
    title: 'cardTitle' as const,
    inset: 6,
    paddingX: 10,
    paddingY: 10,
    titleLines: 3,
    copyLines: 2,
    footerLines: 2,
    titleStyle: { fontSize: 15, lineHeight: 20 },
    microStyle: { fontSize: 10, lineHeight: 13 },
    footerStyle: { fontSize: 10, lineHeight: 14 },
  },
  medium: {
    width: 182,
    height: 324,
    radius: 28,
    emblem: 30,
    artH: 144,
    title: 'cardTitle' as const,
    inset: 8,
    paddingX: 14,
    paddingY: 12,
    titleLines: 3,
    copyLines: 3,
    footerLines: 3,
    titleStyle: { fontSize: 18, lineHeight: 23 },
    microStyle: { fontSize: 11, lineHeight: 15 },
    footerStyle: { fontSize: 11, lineHeight: 15 },
  },
  large: {
    width: 228,
    height: 408,
    radius: 32,
    emblem: 36,
    artH: 182,
    title: 'editorialHeader' as const,
    inset: 10,
    paddingX: 16,
    paddingY: 14,
    titleLines: 3,
    copyLines: 4,
    footerLines: 4,
    titleStyle: { fontSize: 23, lineHeight: 28 },
    microStyle: { fontSize: 12, lineHeight: 17 },
    footerStyle: { fontSize: 12, lineHeight: 18 },
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
  const centerX = w / 2;
  const centerY = h / 2;
  const ring = Math.min(w, h) * 0.31;

  return (
    <>
      {[1, 0.76, 0.5].map((scale, index) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: ring * 2 * scale,
            height: ring * 2 * scale,
            borderRadius: ring * scale,
            borderWidth: index === 0 ? 1.2 : 0.8,
            borderColor: index === 0 ? a0 + '55' : a1 + '35',
            top: centerY - ring * scale,
            left: centerX - ring * scale,
          }}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 1,
              height: ring * 1.25,
              backgroundColor: i % 3 === 0 ? a0 + '55' : a0 + '24',
              left: centerX,
              top: centerY - ring * 0.15,
              transform: [{ rotate: `${(i * 30)}deg` }],
            }}
          />
        );
      })}
      {[
        { top: 12, left: 12 },
        { top: 12, right: 12 },
        { bottom: 12, left: 12 },
        { bottom: 12, right: 12 },
      ].map((pos, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            width: 18,
            height: 18,
            borderRadius: 9,
            borderWidth: 1,
            borderColor: a0 + '44',
            ...pos,
          }}
        />
      ))}
    </>
  );
};

const renderFrameDecor = (deck: TarotDeck, metrics: (typeof SIZE_MAP)[keyof typeof SIZE_MAP]) => {
  const a0 = deck.accent[0];
  const a1 = deck.accent[1];

  return (
    <>
      <View style={[styles.frameOuter, { borderColor: a0 + '55', borderRadius: metrics.radius - 8 }]} />
      <View style={[styles.frameInner, { borderColor: a1 + '35', borderRadius: metrics.radius - 12 }]} />
      <View style={[styles.topRule, { backgroundColor: a0 + '44' }]} />
      <View style={[styles.bottomRule, { backgroundColor: a0 + '30' }]} />
    </>
  );
};

const renderFaceCenter = (
  deck: TarotDeck,
  card: TarotCardData | undefined,
  metrics: (typeof SIZE_MAP)[keyof typeof SIZE_MAP],
  title: string,
) => {
  const motif = renderMotifIcon(deck.motif, deck.accent[0], metrics.emblem);
  const artWidth = metrics.width - metrics.paddingX * 2 - metrics.inset * 2 - 12;

  return (
    <View style={styles.faceCenter}>
      <View style={[styles.artShell, { borderColor: deck.accent[0] + '40', backgroundColor: deck.accent[0] + '0D' }]}>
        <LinearGradient
          colors={[deck.accent[0] + '22', 'transparent', deck.accent[1] + '12']}
          style={StyleSheet.absoluteFill}
        />
        {card ? (
          <TarotCardArt
            cardId={card.id}
            accent={deck.accent[0]}
            textColor={deck.textOnCard}
            width={artWidth}
            height={metrics.artH}
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
          {renderFaceCenter(deck, card, metrics, title)}
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
    justifyContent: 'center',
    paddingHorizontal: 2,
    gap: 10,
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
