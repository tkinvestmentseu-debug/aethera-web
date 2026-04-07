// @ts-nocheck
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { StyleSheet, View, Dimensions, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, {
  Circle,
  Defs,
  RadialGradient,
  Stop,
  Path,
  Text as SvgText,
  Line,
} from 'react-native-svg';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { getZodiacSign, ZODIAC_SYMBOLS, ZODIAC_LABELS } from '../features/horoscope/utils/astrology';
import { useTranslation } from 'react-i18next';

const { width: SW, height: SH } = Dimensions.get('window');

const GOLD = '#CEAE72';
const PORTAL_SIZE = Math.min(SW * 0.72, 320);
const PORTAL_R = PORTAL_SIZE / 2;

// ─── Sign accent colours ─────────────────────────────────────────────────────
const SIGN_COLORS: Record<string, string> = {
  Aries:       '#E25454',
  Taurus:      '#4CAF88',
  Gemini:      '#F6C844',
  Cancer:      '#9EC8E8',
  Leo:         '#FF9A3C',
  Virgo:       '#84C084',
  Libra:       '#C880D4',
  Scorpio:     '#8B5CF6',
  Sagittarius: '#FF6F61',
  Capricorn:   '#6EA8C4',
  Aquarius:    '#5BE0E0',
  Pisces:      '#A78CE8',
};

// ─── Personalised Polish messages ────────────────────────────────────────────
const SIGN_MESSAGES: Record<string, string> = {
  Aries:
    'Twój ogień duszy zapala drogi, których inni jeszcze nie widzą. Baran — pionier, wojownik, inicjator. Sanktuarium czeka na Twoją odwagę.',
  Taurus:
    'W ciszy i pięknie odnajdujesz prawdę. Byk — strażnik ziemi, mistrz zmysłów i trwałości. Sanktuarium otworzy się na Twój głęboki rytm.',
  Gemini:
    'Twój umysł to dwa skrzydła — razem unoszą Cię ponad granice. Bliźnięta — posłaniec gwiazd, tkacz słów i idei. Sanktuarium rezonuje z Twoim głosem.',
  Cancer:
    'Twoja intuicja jest kompasem duszy. Rak — strażnik wspomnień, kapłan uczuć i domowych świętości. Sanktuarium poczuło już Twoje przybycie.',
  Leo:
    'Jesteś słońcem w ludzkim ciele. Lew — władca serca, twórca blasku i inspiracji. Sanktuarium zapala swoje światła na Twoje powitanie.',
  Virgo:
    'W szczegółach ukrywa się magia, którą tylko Ty dostrzegasz. Panna — uzdrowicielka, mistrzyni doskonałości. Sanktuarium przygotowało dla Ciebie przestrzeń precyzji.',
  Libra:
    'Poszukujesz harmonii, bo nosisz ją już w sobie. Waga — strażnik równowagi, artysta duszy i relacji. Sanktuarium wita Cię w swojej symetrii.',
  Scorpio:
    'Dotykasz głębin, w których inni nie śmią nurkować. Skorpion — alchemik przemian, strażnik tajemnicy i odrodzenia. Sanktuarium otwiera przed Tobą swoje podziemia.',
  Sagittarius:
    'Twoja dusza zawsze była w podróży. Strzelec — poszukiwacz prawdy, łucznik gwiazd i mądrości. Sanktuarium zaprasza Cię na najgłębszą wyprawę.',
  Capricorn:
    'Budujesz góry ze swojej woli i cierpliwości. Koziorożec — architekt losu, strażnik czasu i dziedzictwa. Sanktuarium stoi na fundamencie, który Ty rozumiesz.',
  Aquarius:
    'Jesteś posłańcem przyszłości, zanim jeszcze nadeszła. Wodnik — rewolucjonista duszy, wizjoner i wyzwoliciel. Sanktuarium otwiera się na Twoją wizję.',
  Pisces:
    'Pływasz w oceanach, których inni nie widzą. Ryby — mistyk, uzdrowiciel i śniący. Sanktuarium jest dla Ciebie najbardziej naturalnym miejscem na świecie.',
};

const SIGN_ORDER = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces',
];
const ZODIAC_RING_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];

// ─── Golden floating particle data (30 particles) ────────────────────────────
const GOLD_PARTICLES = [
  { x: 0.08, y: 0.18, s: 3.5, d: 0,   sp: 3200 },
  { x: 0.88, y: 0.14, s: 2.5, d: 300, sp: 2800 },
  { x: 0.15, y: 0.72, s: 3.0, d: 600, sp: 3600 },
  { x: 0.82, y: 0.68, s: 2.0, d: 200, sp: 2600 },
  { x: 0.42, y: 0.08, s: 2.8, d: 450, sp: 3000 },
  { x: 0.92, y: 0.44, s: 2.2, d: 700, sp: 3400 },
  { x: 0.04, y: 0.86, s: 3.2, d: 150, sp: 2900 },
  { x: 0.64, y: 0.92, s: 1.8, d: 550, sp: 3100 },
  { x: 0.30, y: 0.22, s: 2.4, d: 400, sp: 2700 },
  { x: 0.72, y: 0.26, s: 2.0, d: 250, sp: 3300 },
  { x: 0.18, y: 0.48, s: 2.6, d: 500, sp: 2500 },
  { x: 0.78, y: 0.55, s: 1.6, d: 100, sp: 3700 },
  { x: 0.52, y: 0.96, s: 2.2, d: 650, sp: 2800 },
  { x: 0.36, y: 0.80, s: 2.8, d: 350, sp: 3200 },
  { x: 0.60, y: 0.10, s: 1.8, d: 480, sp: 2400 },
  { x: 0.96, y: 0.78, s: 2.4, d: 80,  sp: 3500 },
  { x: 0.24, y: 0.62, s: 3.0, d: 620, sp: 2600 },
  { x: 0.68, y: 0.38, s: 1.6, d: 180, sp: 3800 },
  { x: 0.46, y: 0.30, s: 2.2, d: 380, sp: 2900 },
  { x: 0.12, y: 0.94, s: 2.6, d: 530, sp: 3100 },
  { x: 0.84, y: 0.92, s: 1.8, d: 270, sp: 2700 },
  { x: 0.56, y: 0.76, s: 2.0, d: 440, sp: 3000 },
  { x: 0.22, y: 0.36, s: 2.4, d: 320, sp: 3300 },
  { x: 0.76, y: 0.82, s: 3.0, d: 560, sp: 2800 },
  { x: 0.38, y: 0.56, s: 1.8, d: 420, sp: 3500 },
  { x: 0.66, y: 0.50, s: 2.6, d: 130, sp: 2600 },
  { x: 0.10, y: 0.40, s: 2.0, d: 600, sp: 3000 },
  { x: 0.90, y: 0.30, s: 2.4, d: 240, sp: 3400 },
  { x: 0.48, y: 0.18, s: 1.6, d: 480, sp: 2500 },
  { x: 0.34, y: 0.98, s: 2.8, d: 360, sp: 3200 },
];

// ─── GoldParticle ─────────────────────────────────────────────────────────────
const GoldParticle = ({ x, y, s, d, sp, color }) => {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1100 }),
          withTiming(0.08, { duration: 1500 }),
        ),
        -1,
        true,
      ),
    );
    ty.value = withDelay(
      d,
      withRepeat(
        withSequence(
          withTiming(-16, { duration: sp, easing: Easing.inOut(Easing.sin) }),
          withTiming(16,  { duration: sp, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    tx.value = withDelay(
      d + 180,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: sp * 1.3, easing: Easing.inOut(Easing.sin) }),
          withTiming(7,  { duration: sp * 1.3, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x * SW,
          top: y * SH,
          width: s,
          height: s,
          borderRadius: s / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

// ─── OrbitingBody ─────────────────────────────────────────────────────────────
const OrbitingBody = ({ radius, size, speed, startAngle, color }) => {
  const angle = useSharedValue(startAngle);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(700, withTiming(0.88, { duration: 800 }));
    angle.value = withRepeat(
      withTiming(startAngle + 360, { duration: speed, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const rad = (angle.value * Math.PI) / 180;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: Math.cos(rad) * radius - size / 2 },
        { translateY: Math.sin(rad) * radius - size / 2 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: PORTAL_R,
          top: PORTAL_R,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
};

// ─── ZodiacGlyphRing ──────────────────────────────────────────────────────────
const ZodiacGlyphRing = ({ accentColor, userSignIndex }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 40000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const rotStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rotation.value}deg` }],
  }));

  const RING_SIZE = PORTAL_SIZE + 64;
  const RING_R    = RING_SIZE / 2;
  const GLYPH_R   = PORTAL_R + 28;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: RING_SIZE,
          height: RING_SIZE,
          top: -32,
          left: -32,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rotStyle,
      ]}
    >
      <Svg width={RING_SIZE} height={RING_SIZE}>
        {/* orbit track */}
        <Circle
          cx={RING_R}
          cy={RING_R}
          r={GLYPH_R}
          fill="none"
          stroke={GOLD + '28'}
          strokeWidth={0.7}
          strokeDasharray="3 10"
        />
        {ZODIAC_RING_GLYPHS.map((glyph, i) => {
          const a   = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const cx  = RING_R + Math.cos(a) * GLYPH_R;
          const cy  = RING_R + Math.sin(a) * GLYPH_R;
          const active = i === userSignIndex;
          return (
            <SvgText
              key={i}
              x={cx}
              y={cy + 5}
              textAnchor="middle"
              fontSize={active ? 17 : 12}
              fill={active ? accentColor : GOLD + '65'}
              fontWeight={active ? '700' : '400'}
              opacity={active ? 1.0 : 0.60}
            >
              {glyph}
            </SvgText>
          );
        })}
      </Svg>
    </Animated.View>
  );
};

// ─── PortalGateway ────────────────────────────────────────────────────────────
const PortalGateway = ({ accentColor, openScale }) => {
  const pulse1      = useSharedValue(1);
  const pulse2      = useSharedValue(1);
  const pulse3      = useSharedValue(1);
  const rayRotation = useSharedValue(0);

  useEffect(() => {
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.94, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
    pulse2.value = withDelay(600, withRepeat(
      withSequence(
        withTiming(1.13, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.88, { duration: 2300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    ));
    pulse3.value = withDelay(1200, withRepeat(
      withSequence(
        withTiming(1.18, { duration: 2700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.84, { duration: 2700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    ));
    rayRotation.value = withRepeat(
      withTiming(360, { duration: 22000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value * openScale.value }],
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value * openScale.value }],
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value * openScale.value }],
  }));
  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${rayRotation.value}deg` }],
  }));
  const openFadeStyle = useAnimatedStyle(() => ({
    opacity: openScale.value > 1.4 ? Math.max(0, 1 - (openScale.value - 1.4) * 2) : 1,
    transform: [{ scale: openScale.value }],
  }));

  const cx = PORTAL_R;
  const cy = PORTAL_R;

  // 12 light rays from center
  const RAY_PATHS = Array.from({ length: 12 }, (_, i) => {
    const a  = (i / 12) * Math.PI * 2;
    const x2 = cx + Math.cos(a) * PORTAL_R * 0.82;
    const y2 = cy + Math.sin(a) * PORTAL_R * 0.82;
    return `M ${cx} ${cy} L ${x2} ${y2}`;
  });

  return (
    <Animated.View
      style={[
        {
          width: PORTAL_SIZE,
          height: PORTAL_SIZE,
          alignItems: 'center',
          justifyContent: 'center',
        },
        openFadeStyle,
      ]}
    >
      {/* Outer pulsing glow rings */}
      <Animated.View style={[StyleSheet.absoluteFill, ring3Style]}>
        <Svg width={PORTAL_SIZE} height={PORTAL_SIZE}>
          <Circle cx={cx} cy={cy} r={PORTAL_R * 0.88} fill="none" stroke={accentColor + '16'} strokeWidth={1.4} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ring2Style]}>
        <Svg width={PORTAL_SIZE} height={PORTAL_SIZE}>
          <Circle cx={cx} cy={cy} r={PORTAL_R * 0.76} fill="none" stroke={accentColor + '28'} strokeWidth={1.2} />
        </Svg>
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, ring1Style]}>
        <Svg width={PORTAL_SIZE} height={PORTAL_SIZE}>
          <Circle cx={cx} cy={cy} r={PORTAL_R * 0.62} fill="none" stroke={accentColor + '42'} strokeWidth={1.0} />
        </Svg>
      </Animated.View>

      {/* Rotating light rays */}
      <Animated.View style={[StyleSheet.absoluteFill, raysStyle]}>
        <Svg width={PORTAL_SIZE} height={PORTAL_SIZE}>
          {RAY_PATHS.map((d, i) => (
            <Path
              key={i}
              d={d}
              stroke={accentColor + (i % 2 === 0 ? '20' : '12')}
              strokeWidth={i % 3 === 0 ? 1.1 : 0.6}
            />
          ))}
        </Svg>
      </Animated.View>

      {/* Static portal structure */}
      <Svg
        width={PORTAL_SIZE}
        height={PORTAL_SIZE}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient id="portalBg" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor={accentColor} stopOpacity={0.28} />
            <Stop offset="50%"  stopColor={accentColor} stopOpacity={0.10} />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0.00} />
          </RadialGradient>
          <RadialGradient id="orbCenter" cx="50%" cy="50%" r="50%">
            <Stop offset="0%"   stopColor="#FFFFFF"    stopOpacity={0.96} />
            <Stop offset="35%"  stopColor={accentColor} stopOpacity={0.88} />
            <Stop offset="75%"  stopColor={accentColor} stopOpacity={0.48} />
            <Stop offset="100%" stopColor={accentColor} stopOpacity={0.00} />
          </RadialGradient>
        </Defs>

        {/* Soft portal glow fill */}
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.88} fill="url(#portalBg)" />

        {/* Double gate circle */}
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.50} fill="none" stroke={GOLD + '65'} strokeWidth={1.5} />
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.44} fill="none" stroke={GOLD + '38'} strokeWidth={0.9} />

        {/* Eight tick marks on the gate */}
        {Array.from({ length: 8 }, (_, i) => {
          const a  = (i / 8) * Math.PI * 2;
          const r1 = PORTAL_R * 0.44;
          const r2 = PORTAL_R * 0.52;
          return (
            <Line
              key={i}
              x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
              stroke={GOLD + '55'} strokeWidth={1.0}
            />
          );
        })}

        {/* Central orb */}
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.21} fill="url(#orbCenter)" />
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.13} fill={accentColor} opacity={0.55} />
        <Circle cx={cx} cy={cy} r={PORTAL_R * 0.065} fill="#FFFFFF" opacity={0.92} />
      </Svg>

      {/* 3 orbiting planets */}
      <OrbitingBody radius={PORTAL_R * 0.36} size={6}   speed={8000}  startAngle={0}   color={accentColor} />
      <OrbitingBody radius={PORTAL_R * 0.54} size={4.5} speed={12500} startAngle={120} color={'#A78BFA'} />
      <OrbitingBody radius={PORTAL_R * 0.70} size={3.5} speed={18000} startAngle={240} color={'#6EE7B7'} />
    </Animated.View>
  );
};

// ─── Main MagicEntryScreen ────────────────────────────────────────────────────
export const MagicEntryScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const setOnboarded = useAppStore(s => s.setOnboarded);

  const name        = userData?.name || 'Podróżniku';
  const birthDate   = userData?.birthDate || '';
  const sign        = birthDate ? getZodiacSign(birthDate) : 'Pisces';
  const signSymbol  = ZODIAC_SYMBOLS[sign] || '✦';
  const signLabel   = ZODIAC_LABELS[sign]  || sign;
  const signMessage = SIGN_MESSAGES[sign]  || SIGN_MESSAGES['Pisces'];
  const accentColor = SIGN_COLORS[sign]    || GOLD;
  const userSignIndex = SIGN_ORDER.indexOf(sign);

  const screenOpacity = useSharedValue(0);
  const openScale     = useSharedValue(1);
  const [portalOpening, setPortalOpening] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    screenOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, []);

  const screenFadeStyle = useAnimatedStyle(() => ({ opacity: screenOpacity.value }));

  const doComplete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    setOnboarded(true);
  };

  const handleEnter = useCallback(() => {
    if (portalOpening) return;
    setPortalOpening(true);

    // Portal burst — scale up the gateway
    openScale.value = withTiming(2.8, {
      duration: 700,
      easing: Easing.in(Easing.cubic),
    });

    // Fade screen to black then navigate
    screenOpacity.value = withDelay(
      480,
      withTiming(0, { duration: 450 }, (finished) => {
        if (finished) runOnJS(doComplete)();
      }),
    );
  }, [portalOpening]);

  return (
    <Animated.View style={[styles.container, screenFadeStyle]}>
      {/* Cosmic background — always dark */}
      <LinearGradient
        colors={['#030107', '#07030F', '#0C0518', '#07030F']}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Sign-colored ambient bloom */}
      <View
        style={[
          styles.ambientBloom,
          { backgroundColor: accentColor + '07' },
        ]}
      />

      {/* 30 floating golden particles */}
      {GOLD_PARTICLES.map((p, i) => (
        <GoldParticle
          key={i}
          x={p.x} y={p.y} s={p.s} d={p.d} sp={p.sp}
          color={i % 3 === 0 ? accentColor + 'CC' : GOLD + 'BB'}
        />
      ))}

      {/* ── Portal section ──────────────────────────────────────────────── */}
      <View style={styles.portalSection}>
        <ZodiacGlyphRing accentColor={accentColor} userSignIndex={userSignIndex} />
        <PortalGateway   accentColor={accentColor} openScale={openScale} />
      </View>

      {/* ── Text section ────────────────────────────────────────────────── */}
      <View style={styles.textSection}>
        {/* Greeting + name */}
        <Animated.View entering={FadeInDown.delay(350).duration(700)}>
          <Text style={styles.greetingLabel}>WITAJ</Text>
          <Text style={[styles.userName, { color: accentColor }]}>{name}</Text>
        </Animated.View>

        {/* Sign divider */}
        <Animated.View entering={FadeInDown.delay(650).duration(600)} style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: accentColor + '48' }]} />
          <Text style={[styles.signSymbol, { color: accentColor }]}>{signSymbol}</Text>
          <View style={[styles.dividerLine, { backgroundColor: accentColor + '48' }]} />
        </Animated.View>

        {/* Sign name */}
        <Animated.View entering={FadeInDown.delay(850).duration(600)}>
          <Text style={[styles.signName, { color: accentColor + 'CC' }]}>
            {signLabel.toUpperCase()}
          </Text>
        </Animated.View>

        {/* Sacred message card */}
        <Animated.View entering={FadeInDown.delay(1100).duration(700)} style={styles.messageCard}>
          <LinearGradient
            colors={[accentColor + '12', accentColor + '06', 'transparent']}
            style={styles.messageGradient}
          >
            <Text style={styles.sanctuaryEyebrow}>SANKTUARIUM CZEKA</Text>
            <Text style={styles.messageText}>{signMessage}</Text>
            <Text style={[styles.messageSub, { color: accentColor + '99' }]}>
              Twoje miejsce mocy zostało przygotowane
            </Text>
          </LinearGradient>
        </Animated.View>
      </View>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.delay(1700).duration(700)}
        style={styles.ctaContainer}
      >
        <Pressable
          onPress={handleEnter}
          disabled={portalOpening}
          style={({ pressed }) => [
            styles.ctaButton,
            {
              borderColor: accentColor + '70',
              transform: [{ scale: pressed ? 0.965 : 1.0 }],
              opacity: pressed ? 0.82 : 1.0,
            },
          ]}
        >
          <LinearGradient
            colors={[accentColor + 'D0', accentColor + 'F0', accentColor + 'D0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <Text style={styles.ctaText}>Wejdź do Sanktuarium  ✦</Text>
          </LinearGradient>
        </Pressable>

        <Animated.View entering={FadeIn.delay(2100).duration(600)}>
          <Text style={styles.ctaHint}>Twoja podróż do siebie właśnie się zaczyna</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030107',
  },

  ambientBloom: {
    position: 'absolute',
    width: SH * 0.58,
    height: SH * 0.58,
    borderRadius: SH * 0.29,
    top: SH * 0.08,
    left: SW / 2 - SH * 0.29,
    zIndex: 0,
  },

  // Portal
  portalSection: {
    position: 'absolute',
    top: SH * 0.05,
    left: SW / 2 - PORTAL_R,
    width: PORTAL_SIZE,
    height: PORTAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  textSection: {
    position: 'absolute',
    top: SH * 0.05 + PORTAL_SIZE + 4,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 26,
  },

  greetingLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 5,
    color: GOLD + '80',
    textAlign: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 4,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    width: SW * 0.58,
  },
  dividerLine: {
    flex: 1,
    height: 0.8,
  },
  signSymbol: {
    fontSize: 20,
    marginHorizontal: 12,
  },

  signName: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 5,
    textAlign: 'center',
    marginBottom: 14,
  },

  messageCard: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 2,
  },
  messageGradient: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 0.8,
    borderColor: GOLD + '1C',
  },
  sanctuaryEyebrow: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 4,
    color: GOLD + '68',
    textAlign: 'center',
    marginBottom: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#D4C9A8',
    textAlign: 'center',
    opacity: 0.90,
    marginBottom: 10,
  },
  messageSub: {
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // CTA
  ctaContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  ctaButton: {
    width: '100%',
    borderRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#06030F',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  ctaHint: {
    fontSize: 11,
    color: GOLD + '60',
    letterSpacing: 1.2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
