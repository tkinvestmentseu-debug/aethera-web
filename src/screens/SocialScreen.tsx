// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Dimensions, TextInput, Pressable, KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, FadeInDown, FadeInUp, ZoomIn, Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import {
  Globe2, Users, Star, Moon, Flame, Wind,
  Sparkles, Heart, MessageCircle, Trophy, Target, Calendar,
  BookOpen, Zap, Eye, Crown, ChevronRight, Feather,
  Plus, Check, Clock, TrendingUp, ArrowRight, Flower2, Radio, Infinity,
} from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout, shadows } from '../core/theme/designSystem';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { formatLocaleNumber } from '../core/utils/localeFormat';
import i18n from '../core/i18n';
import { useTheme } from '../core/hooks/useTheme';
import { useAuthStore } from '../store/useAuthStore';
import {
  collection, onSnapshot, query, orderBy, limit,
  doc, runTransaction, serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '../core/config/firebase.config';
const { width: SW } = Dimensions.get('window');
const SP = layout.padding.screen;

// ─── Globe constants (module-level to avoid recalculation) ────────────────────

const GLOBE_SIZE = Math.min(SW - 80, 240);
const GLOBE_R = GLOBE_SIZE / 2;

const GLOBE_DOTS = [
  { i: 0, a: 0.3,  r: 0.78, color: '#6366F1', size: 10 },
  { i: 1, a: 1.05, r: 0.82, color: '#EC4899', size: 12 },
  { i: 2, a: 1.9,  r: 0.76, color: '#F59E0B', size: 9 },
  { i: 3, a: 2.65, r: 0.83, color: '#10B981', size: 11 },
  { i: 4, a: 3.5,  r: 0.78, color: '#60A5FA', size: 10 },
  { i: 5, a: 4.3,  r: 0.80, color: '#A78BFA', size: 12 },
  { i: 6, a: 5.15, r: 0.74, color: '#CEAE72', size: 9 },
  { i: 7, a: 5.9,  r: 0.82, color: '#34D399', size: 11 },
].map(d => ({
  ...d,
  cx: GLOBE_R + (GLOBE_R * d.r) * Math.sin(d.a),
  cy: GLOBE_R - (GLOBE_R * d.r) * Math.cos(d.a),
}));

const GLOBE_CONNECTIONS = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0],[1,5],[3,7]];

const getGlobeLine = (d1, d2) => {
  const dx = d2.cx - d1.cx, dy = d2.cy - d1.cy;
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  return {
    position: 'absolute' as const,
    left: (d1.cx + d2.cx) / 2 - len / 2,
    top: (d1.cy + d2.cy) / 2,
    width: len,
    height: 1,
    backgroundColor: d1.color + '50',
    transform: [{ rotate: `${angle}deg` }],
  };
};

// ─── Static demo data ─────────────────────────────────────────────────────────

const ONLINE_COUNT = 1247;

const MEDITATION_CIRCLE = {
  nextAt: '20:00', participants: 384,
  topic: 'Uziemienie i spokój wewnętrzny', timeLeft: '2h 14min',
};

const DAILY_TAROT = {
  card: 'Gwiazda', number: 'XVII', theme: 'Nadzieja i odnowienie',
  interpretations: 127, energy: 'Yin',
  topComment: 'Ta karta przypomniała mi, że po każdej ciemności przychodzi światło.',
};

// LIVE_RITUALS and SOUL_MATCHES loaded from Firebase in component

const DREAM_SYMBOLS = [
  { symbol: '🌊', name: 'Woda', count: 342, trend: '+18%' },
  { symbol: '🐍', name: 'Wąż', count: 198, trend: '+34%' },
  { symbol: '🏔', name: 'Góra', count: 167, trend: '-5%' },
  { symbol: '🌕', name: 'Księżyc', count: 289, trend: '+22%' },
  { symbol: '🔥', name: 'Ogień', count: 154, trend: '+11%' },
  { symbol: '✈️', name: 'Lot', count: 201, trend: '+29%' },
];

const COMMUNITY_AFFIRMATION = {
  text: 'Jestem gotow(a) przyjąć miłość, której szukam w sobie od dawna.',
  votes: 2341,
  reactions: { '💛': 891, '✨': 654, '🌸': 796 },
};

const CHALLENGES = [
  { id: 1, title: '7 Dni Wdzięczności', days: 7, joined: 1892, completion: 67, color: '#F59E0B', Icon: Heart,
    desc: 'Zapisuj każdego dnia 3 rzeczy za które jesteś wdzięczny/a' },
  { id: 2, title: '21 Dni Medytacji', days: 21, joined: 934, completion: 43, color: '#6366F1', Icon: Moon,
    desc: 'Codzienna 10-minutowa sesja uważności i ciszy wewnętrznej' },
  { id: 3, title: '30 Dni bez Reaktywności', days: 30, joined: 512, completion: 28, color: '#10B981', Icon: Wind,
    desc: 'Ćwicz świadomą odpowiedź zamiast automatycznej reakcji' },
];

const INTENTIONS = [
  { id: 1, text: 'Przyciągam obfitość i spokój do mojego życia', witnesses: 47, energy: 92, time: '2h temu' },
  { id: 2, text: 'Uwalniamy wszystko, co nas ogranicza tej nocy', witnesses: 134, energy: 88, time: '5h temu' },
  { id: 3, text: 'Moje relacje są pełne miłości i wzajemnego szacunku', witnesses: 89, energy: 85, time: '7h temu' },
];

// FEED_ITEMS and MENTORS loaded from Firebase in component

const COSMIC_EVENTS = [
  { id: 1, title: 'Pełnia Księżyca w Wadze', date: '13 Kwi', daysLeft: 13, participants: 3420, color: '#6366F1', Icon: Moon,
    desc: 'Czas równowagi, relacji i piękna. Idealna noc na rytuały harmonii.' },
  { id: 2, title: 'Merkury Bezpośredni', date: '7 Kwi', daysLeft: 7, participants: 1892, color: '#F59E0B', Icon: Globe2,
    desc: 'Koniec retrogradu — wróć do projektów i komunikacji.' },
  { id: 3, title: 'Portal Lwa 8:8', date: '8 Sie', daysLeft: 130, participants: 8901, color: '#DC2626', Icon: Star,
    desc: 'Najpotężniejszy portal roku. Manifestacja i aktywacja DNA.' },
];

// CHRONICLES loaded from Firebase in component

// 12 feature tiles — each scrolls to its section
const FEATURE_TILES = [
  { id: 'meditation', Icon: Globe2, emoji: '🌐', eyebrow: 'SYNCHRONICZNA', title: 'Krąg Energetyczny', desc: 'Medytacja z setkami dusz w tym samym momencie', stat: `${MEDITATION_CIRCLE.participants} gotowych · ${MEDITATION_CIRCLE.nextAt}`, color: '#6366F1' },
  { id: 'tarot', Icon: Star, emoji: '✦', eyebrow: 'ZBIOROWY ODCZYT', title: 'Tarot Wspólnoty', desc: 'Karta i energia całej wspólnoty na dziś', stat: `${DAILY_TAROT.interpretations} interpretacji dziś`, color: '#F59E0B' },
  { id: 'rituals', Icon: Flame, emoji: '🕯', eyebrow: 'NA ŻYWO', title: 'Rytuały na Żywo', desc: 'Ceremonie i kręgi prowadzone przez mistrzów', stat: 'Dołącz · Twórz · Prowadź', color: '#DC2626' },
  { id: 'matching', Icon: Heart, emoji: '💜', eyebrow: 'REZONANS DUSZ', title: 'Kosmiczne Dopasowanie', desc: 'Odkryj dusze rezonujące z twoją energią', stat: 'Odkryj swoje bliźnie dusze', color: '#EC4899' },
  { id: 'dreams', Icon: Moon, emoji: '🌙', eyebrow: 'ANONIMOWE', title: 'Symbolarium Snów', desc: 'Trendy i zbiorowe symbole snów wspólnoty', stat: `${DREAM_SYMBOLS.reduce((s, d) => s + d.count, 0)} snów tej nocy`, color: '#818CF8' },
  { id: 'affirmation', Icon: Sparkles, emoji: '💫', eyebrow: 'CO 24H', title: 'Afirmacja Wspólnoty', desc: 'Wzmacniaj i głosuj zbiorową intencję dnia', stat: `${formatLocaleNumber(2341)} ${i18n.language?.startsWith('en') ? 'votes' : 'głosów'}`, color: '#FBBF24' },
  { id: 'challenges', Icon: Trophy, emoji: '👑', eyebrow: 'TRANSFORMACJA', title: 'Wyzwania Ducha', desc: 'Zbiorowe ścieżki zmiany — razem łatwiej', stat: `${formatLocaleNumber(CHALLENGES.reduce((s, c) => s + c.joined, 0))} ${i18n.language?.startsWith('en') ? 'participants' : 'uczestników'}`, color: '#F97316' },
  { id: 'intentions', Icon: Target, emoji: '🎯', eyebrow: 'MANIFESTACJA', title: 'Komora Intencji', desc: 'Wysyłaj intencje i bądź świadkiem innych', stat: `${INTENTIONS.reduce((s, i) => s + i.witnesses, 0)} świadków`, color: '#10B981' },
  { id: 'feed', Icon: Feather, emoji: '🪶', eyebrow: 'PASMO ŻYWE', title: 'Pasmo Świadomości', desc: 'Refleksje, rytuały i przełomy społeczności', stat: 'Dziel się · Inspiruj', color: '#8B5CF6' },
  { id: 'mentors', Icon: Crown, emoji: '✦', eyebrow: 'MISTRZOWIE', title: 'Mentorzy Duszy', desc: 'Prywatne sesje z duchowymi przewodnikami', stat: 'Sesje 1:1 z mistrzami', color: '#CEAE72' },
  { id: 'events', Icon: Calendar, emoji: '🗓', eyebrow: 'SPOTKANIA', title: 'Kalendarz Wydarzeń', desc: 'Grupowe spotkania, rytuały i sesje na żywo z użytkownikami z całego świata', stat: 'Dołącz · Twórz · Zapraszaj', color: '#60A5FA' },
  { id: 'chronicle', Icon: BookOpen, emoji: '📖', eyebrow: 'ARCHIWUM', title: 'Kronika Wspólnoty', desc: 'Eseje, raporty i mądrość duchowej ścieżki', stat: 'Eseje · Refleksje · Mądrość', color: '#A78BFA' },
  { id: 'globalshare', Icon: Globe2, emoji: '🌍', eyebrow: 'GLOBALNY', title: 'Globalny Strumień', desc: 'Dziel się tarotem, horoskopem i wglądami z całym światem', stat: '3,847 dzielących się dziś', color: '#34D399' },
  { id: 'chat', Icon: MessageCircle, emoji: '💬', eyebrow: 'CZATY NA ŻYWO', title: 'Czaty Wspólnoty', desc: 'Pokoje rozmów — medytacja, tarot, sny i więcej', stat: '1,247 dusz online teraz', color: '#60A5FA' },
  { id: 'gratitude', Icon: Flower2, emoji: '🌸', eyebrow: 'WDZIĘCZNOŚĆ', title: 'Tablica Wdzięczności', desc: 'Dziel się wdzięcznością i inspiruj innych', stat: 'Żywy strumień ✦', color: '#F472B6' },
  { id: 'groupmed', Icon: Radio, emoji: '🔮', eyebrow: 'MEDYTACJA NA ŻYWO', title: 'Grupowa Medytacja', desc: 'Medytuj razem ze wspólnotą każdego dnia o 21:00', stat: 'Codziennie · 21:00', color: '#818CF8' },
  { id: 'sync', Icon: Infinity, emoji: '🌀', eyebrow: 'SYNCHRONICZNOŚCI', title: 'Znaczące Zbieżności', desc: 'Dziel się synchronicznościami i znakami od wszechświata', stat: 'Twój znak może być wskazówką', color: '#2DD4BF' },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

// ── Animated 3D Globe Hero ───────────────────────────────────────────────────
const AetherGlobe = React.memo(({ accent, textColor, subColor, isLight }) => {
  const { t } = useTranslation();

  const spin = useSharedValue(0);
  const centerGlow = useSharedValue(0.8);
  const outerRing = useSharedValue(1);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 22000, easing: Easing.linear }), -1, false,
    );
    centerGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700 }),
        withTiming(0.4, { duration: 1700 }),
      ), -1, false,
    );
    outerRing.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2200 }),
        withTiming(1.0, { duration: 2200 }),
      ), -1, false,
    );
    return () => {
      cancelAnimation(spin);
      cancelAnimation(centerGlow);
      cancelAnimation(outerRing);
    };
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: centerGlow.value,
    transform: [{ scale: 0.85 + centerGlow.value * 0.2 }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerRing.value }],
    opacity: 2.06 - outerRing.value,
  }));

  const G = GLOBE_SIZE;
  const R = GLOBE_R;

  return (
    <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 22 }}>
      {/* Glow halos */}
      <Animated.View style={[{
        position: 'absolute', top: -14,
        width: G + 68, height: G + 68, borderRadius: (G + 68) / 2,
        borderWidth: 1, borderColor: '#6366F118',
      }, ringStyle]} />
      <View style={{
        position: 'absolute', top: -4,
        width: G + 36, height: G + 36, borderRadius: (G + 36) / 2,
        borderWidth: 1, borderColor: '#6366F128',
      }} />

      {/* Globe sphere */}
      <View style={{
        width: G, height: G, borderRadius: R,
        overflow: 'hidden',
        borderWidth: 1.5, borderColor: '#6366F155',
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.55,
        shadowRadius: 28,
        elevation: 12,
      }}>
        {/* Deep space background */}
        <LinearGradient
          colors={['#0D0820', '#100838', '#0A1230']}
          style={StyleSheet.absoluteFill}
        />

        {/* Star field */}
        {[{t:12,l:30},{t:45,l:190},{t:80,l:70},{t:140,l:210},{t:170,l:120},{t:200,l:50},{t:60,l:145},{t:110,l:25}].map((s, i) => (
          <View key={i} style={{
            position: 'absolute', top: s.t, left: s.l,
            width: i % 3 === 0 ? 2 : 1, height: i % 3 === 0 ? 2 : 1,
            borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.6)',
          }} />
        ))}

        {/* Rotating grid */}
        <Animated.View style={[StyleSheet.absoluteFillObject, spinStyle]}>
          {[0.26, 0.5, 0.74].map((t, i) => (
            <View key={i} style={{
              position: 'absolute', top: G * t, left: 0, right: 0,
              height: 1, backgroundColor: '#6366F130',
            }} />
          ))}
          {[0, 40, 80, 120].map((deg, i) => (
            <View key={i} style={{
              position: 'absolute', top: 0, bottom: 0, left: R - 0.5,
              width: 1, backgroundColor: '#6366F120',
              transform: [{ rotate: `${deg}deg` }],
            }} />
          ))}
        </Animated.View>

        {/* Connection lines between users */}
        {GLOBE_CONNECTIONS.map(([a, b], idx) => (
          <View key={idx} style={getGlobeLine(GLOBE_DOTS[a], GLOBE_DOTS[b])} pointerEvents="none" />
        ))}

        {/* User dots */}
        {GLOBE_DOTS.map(d => (
          <View key={d.i} style={{
            position: 'absolute',
            top: d.cy - d.size / 2,
            left: d.cx - d.size / 2,
            width: d.size, height: d.size,
            borderRadius: d.size / 2,
            backgroundColor: d.color,
            borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
            shadowColor: d.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 1,
            shadowRadius: 6,
            elevation: 4,
          }} />
        ))}

        {/* Oracle center node */}
        <Animated.View style={[{
          position: 'absolute',
          top: R - 22, left: R - 22,
          width: 44, height: 44, borderRadius: 22,
          alignItems: 'center', justifyContent: 'center',
          borderWidth: 1.5, borderColor: 'rgba(206,174,114,0.65)',
        }, glowStyle]}>
          <LinearGradient
            colors={['rgba(206,174,114,0.4)', 'rgba(206,174,114,0.15)']}
            style={StyleSheet.absoluteFill}
          />
          <Text style={{ fontSize: 20, color: '#CEAE72' }}>✦</Text>
        </Animated.View>

        {/* Top highlight shine */}
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)', 'transparent']}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: G * 0.45, borderRadius: R,
          }}
          pointerEvents="none"
        />
      </View>

      {/* Branding below globe */}
      <View style={{ marginTop: 16, alignItems: 'center', gap: 3 }}>
        <LinearGradient
          colors={[accent + 'CC', '#6366F1CC']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={{ paddingHorizontal: 18, paddingVertical: 5, borderRadius: 20 }}
        >
          <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 2.5 }}>
            {t('social.aethera_duniai_oracle', 'Aethera DuniAI & Oracle')}
          </Text>
        </LinearGradient>
        <Text style={{ color: subColor, fontSize: 11, marginTop: 2 }}>
          {t('social.laczaca_dusze_z_calego_swiata', 'Łącząca dusze z całego świata')}
        </Text>
      </View>
    </View>
  );
});

const OnlinePulse = ({ color = '#10B981', size = 10 }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(2, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0, { duration: 1000 }), withTiming(0.5, { duration: 1000 })), -1, false);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, aStyle]} />
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: color }} />
    </View>
  );
};

const SectionLabel = ({ icon: Icon, title, sub, color, textColor, subColor, action, onAction }) => (
  <View style={sh.secLabelRow}>
    <View style={[sh.secLabelIcon, { backgroundColor: color + '20' }]}>
      <Icon color={color} size={16} strokeWidth={2} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={[sh.secLabelTitle, { color: textColor }]}>{title}</Text>
      {sub ? <Text style={[sh.secLabelSub, { color: subColor }]}>{sub}</Text> : null}
    </View>
    {action && (
      <Pressable onPress={onAction} style={[sh.secLabelAction, { borderColor: color + '44' }]}>
        <Text style={[sh.secLabelActionText, { color }]}>{action}</Text>
      </Pressable>
    )}
  </View>
);

// WOW Feature Tile — glossy, animated, glass-effect large rectangular tiles
const FeatureTile = React.memo(({ tile, onPress, textColor, subColor, isLight, index }) => {
  const scale = useSharedValue(1);
  const shimmerX = useSharedValue(-120);
  const artPulse = useSharedValue(1);

  const scaleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shimmerX.value }] }));
  const artStyle = useAnimatedStyle(() => ({
    transform: [{ scale: artPulse.value }],
    opacity: 0.7 + artPulse.value * 0.3,
  }));

  useEffect(() => {
    const delay = 800 + index * 180;
    const tid = setTimeout(() => {
      shimmerX.value = withRepeat(
        withTiming(SW + 120, { duration: 2800, easing: Easing.bezier(0.25, 0.46, 0.45, 0.94) }),
        -1, false,
      );
      artPulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1400 + index * 80 }),
          withTiming(0.96, { duration: 1400 + index * 80 }),
        ), -1, false,
      );
    }, delay);
    return () => {
      clearTimeout(tid);
      cancelAnimation(shimmerX);
      cancelAnimation(artPulse);
    };
  }, []);

  return (
    <Animated.View entering={FadeInDown.delay(60 + index * 40).duration(420)}>
      <Animated.View style={scaleStyle}>
        <Pressable
          onPressIn={() => { scale.value = withSpring(0.975, { damping: 16 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 16 }); }}
          onPress={onPress}
          style={[sh.hTile, {
            borderColor: tile.color + '50',
            backgroundColor: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(12,8,28,0.80)',
          }]}
        >
          {/* Full background gradient */}
          <LinearGradient
            colors={[tile.color + '30', tile.color + '18', tile.color + '08', 'transparent']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Top shimmer line */}
          <LinearGradient
            colors={['transparent', tile.color + 'EE', tile.color + 'EE', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }}
            pointerEvents="none"
          />
          {/* Bottom subtle line */}
          <LinearGradient
            colors={['transparent', tile.color + '30', 'transparent']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1 }}
            pointerEvents="none"
          />
          {/* Animated shimmer sweep */}
          <Animated.View
            style={[{
              position: 'absolute', top: 0, bottom: 0, width: 80,
              backgroundColor: 'transparent',
            }, shimmerStyle]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
          {/* Corner decorations */}
          <View style={{ position: 'absolute', top: 8, right: 10, width: 10, height: 10,
            borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: tile.color + '80' }} pointerEvents="none" />
          <View style={{ position: 'absolute', bottom: 8, left: 14, width: 7, height: 7,
            borderBottomWidth: 1, borderLeftWidth: 1, borderColor: tile.color + '45' }} pointerEvents="none" />

          {/* Art circle — large */}
          <Animated.View style={[sh.hTileArt, {
            backgroundColor: tile.color + '20',
            borderColor: tile.color + '45',
          }, artStyle]}>
            <LinearGradient
              colors={[tile.color + '50', tile.color + '20', tile.color + '08']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Outer ring */}
            <View style={{
              position: 'absolute',
              width: 88, height: 88, borderRadius: 44,
              borderWidth: 1, borderColor: tile.color + '28',
              top: -6, left: -6,
            }} />
            <tile.Icon color={tile.color} size={28} strokeWidth={1.5} />
            {/* Emoji badge */}
            <View style={{
              position: 'absolute', bottom: 2, right: 2,
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: tile.color + '28',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 11 }}>{tile.emoji}</Text>
            </View>
          </Animated.View>

          {/* Content */}
          <View style={{ flex: 1, paddingLeft: 16, paddingRight: 6, gap: 4 }}>
            {/* Eyebrow badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: tile.color + '20',
              borderWidth: 1, borderColor: tile.color + '35',
              borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
              alignSelf: 'flex-start',
            }}>
              <Text style={[sh.hTileEyebrow, { color: tile.color }]}>{tile.eyebrow}</Text>
            </View>
            <Text style={[sh.hTileTitle, { color: textColor }]} numberOfLines={1}>{tile.title}</Text>
            <Text style={[sh.hTileDesc, { color: subColor }]} numberOfLines={2}>{tile.desc}</Text>
            {/* Stat row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 }}>
              <View style={{
                width: 7, height: 7, borderRadius: 3.5,
                backgroundColor: tile.color,
                shadowColor: tile.color, shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9, shadowRadius: 3, elevation: 2,
              }} />
              <Text style={[sh.hTileStat, { color: tile.color }]} numberOfLines={1}>{tile.stat}</Text>
            </View>
          </View>

          {/* Arrow button */}
          <View style={[sh.hTileArrow, { backgroundColor: tile.color + '20', borderColor: tile.color + '40' }]}>
            <LinearGradient
              colors={[tile.color + '30', tile.color + '10']}
              style={StyleSheet.absoluteFill}
            />
            <ArrowRight color={tile.color} size={15} strokeWidth={2.5} />
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

const GoldSep = ({ accent }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 }}>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: accent + '33' }} />
    <Text style={{ color: accent, fontSize: 13, fontWeight: '800' }}>✦</Text>
    <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: accent + '33' }} />
  </View>
);

// ─── Main screen ───────────────────────────────────────────────────────────────

export const SocialScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const tr = (key: string, pl: string, en: string, options?: Record<string, unknown>) => (
    t(key, { defaultValue: i18n.language?.startsWith('en') ? en : pl, ...options })
  );
  const insets = useSafeAreaInsets();
  const { currentTheme, isLight } = useTheme();
  const theme = currentTheme;
  const textColor = isLight ? '#1A1108' : '#F5F1EA';
  const subColor = isLight ? 'rgba(30,20,10,0.55)' : 'rgba(245,241,234,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
  const scrollRef = useRef(null);
  const sectionYRefs = useRef({});
  const accent = theme.primary || '#CEAE72';

  const { currentUser } = useAuthStore();

  const [feedInput, setFeedInput] = useState('');
  const [liked, setLiked] = useState({});
  const [joinedChallenges, setJoinedChallenges] = useState({});
  const [witnessed, setWitnessed] = useState({});
  const [affVoted, setAffVoted] = useState(false);
  const [meditationJoined, setMeditationJoined] = useState(false);
  const [myIntention, setMyIntention] = useState('');
  const [myIntentionSent, setMyIntentionSent] = useState(false);
  const [liveOnline, setLiveOnline] = useState(ONLINE_COUNT);
  const [meditationCount, setMeditationCount] = useState(MEDITATION_CIRCLE.participants);

  // Firebase real-time data
  const [liveRituals, setLiveRituals] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [chronicles, setChronicles] = useState<any[]>([]);
  const [dreamSymbolsLive, setDreamSymbolsLive] = useState(DREAM_SYMBOLS);
  const [activeCount, setActiveCount] = useState(ONLINE_COUNT);

  // Firebase listeners
  useEffect(() => {
    const unsubRituals = onSnapshot(
      query(collection(db, 'rituals'), orderBy('createdAt', 'desc'), limit(3)),
      snap => setLiveRituals(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const unsubPosts = onSnapshot(
      query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(3)),
      snap => setFeedPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const unsubMentors = onSnapshot(
      query(collection(db, 'mentors'), limit(3)),
      snap => setMentors(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const unsubChronicles = onSnapshot(
      query(collection(db, 'chronicles'), orderBy('createdAt', 'desc'), limit(3)),
      snap => setChronicles(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      () => {}
    );
    const unsubActive = onSnapshot(
      collection(db, 'activeMeditations'),
      snap => setActiveCount(Math.max(ONLINE_COUNT, snap.size + ONLINE_COUNT)),
      () => {}
    );
    return () => {
      unsubRituals(); unsubPosts(); unsubMentors(); unsubChronicles(); unsubActive();
    };
  }, []);
  const localizedFeatureTiles = useMemo(() => FEATURE_TILES.map((tile) => ({
    ...tile,
    title: tr(`social.tiles.${tile.id}.title`, tile.title, ({
      meditation: 'Energy Circle',
      tarot: 'Community Tarot',
      rituals: 'Live Rituals',
      matching: 'Cosmic Match',
      dreams: 'Dream Symbolarium',
      affirmation: 'Community Affirmation',
      challenges: 'Soul Challenges',
      intentions: 'Intention Chamber',
      feed: 'Field of Awareness',
      mentors: 'Soul Mentors',
      events: 'Cosmic Portals',
      chronicle: 'Community Chronicle',
      globalshare: 'Global Stream',
      chat: 'Community Chats',
    } as any)[tile.id] || tile.title),
    desc: tr(`social.tiles.${tile.id}.desc`, tile.desc, ({
      meditation: 'Meditate with hundreds of souls at the same moment',
      tarot: 'The card and energy of the whole community today',
      rituals: 'Ceremonies and circles guided live',
      matching: 'Discover souls resonating with your energy',
      dreams: 'Trends and shared dream symbols of the community',
      affirmation: 'Vote on and strengthen the intention of the day',
      challenges: 'Collective paths of transformation',
      intentions: 'Send intentions and witness others',
      feed: 'Reflections, rituals, and breakthroughs of the community',
      mentors: 'Private sessions with spiritual guides',
      events: 'Shared celebrations and planetary energies',
      chronicle: 'Essays, reports, and wisdom of the path',
      globalshare: 'Share tarot, horoscope, and insights with the world',
      chat: 'Live rooms for meditation, tarot, dreams, and more',
    } as any)[tile.id] || tile.desc),
    stat: tile.id === 'affirmation'
      ? `${formatLocaleNumber(2341)} ${tr('social.stat.votes', 'głosów', 'votes')}`
      : tile.id === 'challenges'
        ? `${formatLocaleNumber(CHALLENGES.reduce((s, c) => s + c.joined, 0))} ${tr('social.stat.participants', 'uczestników', 'participants')}`
        : tile.id === 'chronicle'
          ? tr('social.stat.chronicles', 'Eseje · Refleksje', 'Essays · Reflections')
          : tile.id === 'chat'
            ? `${formatLocaleNumber(ONLINE_COUNT)} ${tr('social.stat.onlineNow', 'dusz online teraz', 'souls online now')}`
            : tile.stat,
  })), [i18n.language]);

  // Simulate live activity — small fluctuations every few seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const delta = Math.floor(Math.random() * 11) - 5;
      setLiveOnline(prev => Math.max(1200, prev + delta));
      setMeditationCount(prev => Math.max(370, prev + Math.floor(Math.random() * 5) - 2));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const TILE_ROUTES = {
    meditation: 'EnergyCircle',
    tarot: 'CommunityTarot',
    rituals: 'LiveRituals',
    matching: 'SoulMatch',
    dreams: 'DreamSymbols',
    affirmation: 'CommunityAffirmation',
    challenges: 'SpiritualChallenges',
    intentions: 'IntentionChamber',
    feed: 'Consciousness',
    mentors: 'SoulMentors',
    events: 'CommunityEvents',
    chronicle: 'CommunityChronicle',
    globalshare: 'GlobalShare',
    chat: 'CommunityChat',
    gratitude: 'GratitudeWall',
    groupmed: 'GroupMeditation',
    sync: 'Synchronicities',
  };

  const handleTilePress = (id) => {
    const route = TILE_ROUTES[id];
    if (route) {
      navigation.navigate(route);
    }
  };

  const registerSection = (id) => (e) => {
    sectionYRefs.current[id] = e.nativeEvent.layout.y;
  };

  return (
<View style={{ flex: 1, backgroundColor: theme.background }}>
  <SafeAreaView edges={['top']} style={{ flex: 1}}>

      <LinearGradient
        colors={isLight
          ? ['rgba(206,174,114,0.07)', 'rgba(99,102,241,0.04)', 'transparent']
          : ['rgba(99,102,241,0.12)', 'rgba(124,58,237,0.06)', 'transparent']}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: SP, paddingBottom: 120 }}
      >

        {/* ── HERO HEADER ── */}
        <Animated.View entering={FadeInDown.duration(400)} style={[sh.hero, { paddingBottom: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[sh.heroEyebrow, { color: accent }]}>{tr('social.hero.eyebrow', '✦ KOSMICZNA WSPÓLNOTA', '✦ COSMIC COMMUNITY')}</Text>
            <Text style={[sh.heroTitle, { color: textColor }]}>{tr('social.hero.title', 'Jesteś połączona', 'You are connected')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <OnlinePulse color="#10B981" size={10} />
              <Text style={[sh.heroSub, { color: subColor }]}>{formatLocaleNumber(liveOnline)} {tr('social.hero.online', 'dusz aktywnych teraz', 'souls active now')}</Text>
            </View>
          </View>
          <View style={[sh.heroBadge, { backgroundColor: accent + '18', borderColor: accent + '40' }]}>
            <Sparkles color={accent} size={18} strokeWidth={1.8} />
            <Text style={[sh.heroBadgeText, { color: accent }]}>{tr('social.hero.live', 'NA ŻYWO', 'LIVE')}</Text>
          </View>
        </Animated.View>

        {/* ── 3D GLOBE HERO ── */}
        <Animated.View entering={ZoomIn.delay(200).duration(600)}>
          <AetherGlobe accent={accent} textColor={textColor} subColor={subColor} isLight={isLight} />
        </Animated.View>

        {/* ── LIVE NOW STRIP ── */}
        {liveRituals.length > 0 && (
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -SP, marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: SP }}>
              {liveRituals.map((r, i) => {
                const rColor = r.color || '#7C3AED';
                return (
                  <Animated.View key={r.id} entering={FadeInUp.delay(80 + i * 40).duration(340)}>
                    <Pressable onPress={() => navigation.navigate('LiveRituals')} style={[sh.liveStrip, { borderColor: rColor + '50', backgroundColor: rColor + '12' }]}>
                      <LinearGradient colors={[rColor + '18', 'transparent']} style={StyleSheet.absoluteFill} />
                      <Flame color={rColor} size={12} strokeWidth={2} />
                      <Text style={[sh.liveStripText, { color: textColor }]} numberOfLines={1}>{r.name || r.title || 'Rytuał'}</Text>
                      <View style={[sh.liveStripBadge, { backgroundColor: rColor + '22' }]}>
                        <Text style={[sh.liveStripBadgeText, { color: rColor }]}>{t('social.live', 'LIVE')}</Text>
                      </View>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          </ScrollView>
        </Animated.View>
        )}

        {/* ── FEATURE HUB TILES — horizontal full-width ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={sh.hubHeader}>
            <Text style={[sh.hubTitle, { color: subColor }]}>{tr('social.hub.title', 'PORTALE WSPÓLNOTY', 'COMMUNITY PORTALS')}</Text>
            <Text style={[sh.hubSub, { color: accent }]}>{tr('social.hub.count', '17 przestrzeni', '17 spaces')}</Text>
          </View>
          <View style={{ gap: 10 }}>
            {localizedFeatureTiles.map((tile, i) => (
              <FeatureTile
                key={tile.id}
                tile={tile}
                index={i}
                textColor={textColor}
                subColor={subColor}
                isLight={isLight}
                onPress={() => handleTilePress(tile.id)}
              />
            ))}
          </View>
        </Animated.View>

        <GoldSep accent={accent} />

        {/* ── 1. KRĄG ENERGETYCZNY ── */}
        <Animated.View entering={FadeInDown.delay(120).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('meditation')}>
          <SectionLabel
            icon={Globe2}
            title={tr('social.section.energyCircleTitle', 'Krąg Energetyczny', 'Energy Circle')}
            sub={tr('social.section.energyCircleSub', 'Synchroniczna medytacja grupy', 'Synchronous group meditation')}
            color="#6366F1"
            textColor={textColor}
            subColor={subColor}
          />
          <LinearGradient
            colors={['#6366F120', '#7C3AED12', 'transparent']}
            style={[sh.card, { borderColor: '#6366F148' }]}
          >
            {/* Top shimmer */}
            <LinearGradient colors={['transparent', '#6366F1AA', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
            <View style={sh.circleRow}>
              <View>
                <Text style={[sh.bigTime, { color: '#A5B4FC' }]}>{MEDITATION_CIRCLE.nextAt}</Text>
                <Text style={[sh.bigTimeLabel, { color: subColor }]}>{tr('social.energy.nextSession', 'następna sesja', 'next session')}</Text>
              </View>
              <View style={{ gap: 6, alignItems: 'flex-end' }}>
                <View style={[sh.statChip, { backgroundColor: '#6366F128' }]}>
                  <Users color="#A5B4FC" size={12} strokeWidth={2} />
                  <Text style={[sh.statChipText, { color: '#A5B4FC' }]}>{meditationCount} {tr('social.energy.ready', 'gotowych', 'ready')}</Text>
                </View>
                <View style={[sh.statChip, { backgroundColor: '#F59E0B1E' }]}>
                  <Clock color="#FCD34D" size={12} strokeWidth={2} />
                  <Text style={[sh.statChipText, { color: '#FCD34D' }]}>{tr('social.energy.in', 'za', 'in')} {MEDITATION_CIRCLE.timeLeft}</Text>
                </View>
              </View>
            </View>
            <Text style={[sh.circleTopic, { color: textColor }]}>{tr('social.energy.topic', MEDITATION_CIRCLE.topic, 'Grounding and inner peace')}</Text>
            {/* Participant dots */}
            <View style={{ flexDirection: 'row', gap: 5, marginBottom: 14 }}>
              {[...Array(8)].map((_, i) => (
                <View key={i} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#6366F1' + (i < 5 ? 'CC' : '30') }} />
              ))}
              <Text style={{ color: subColor, fontSize: 11, marginLeft: 2 }}>+376 {tr('social.more', 'więcej', 'more')}</Text>
            </View>
            {/* Energy bar */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: subColor, letterSpacing: 1, marginBottom: 5 }}>{tr('social.energy.circleEnergy', 'ENERGIA KRĘGU', 'CIRCLE ENERGY')}</Text>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: '#6366F118', overflow: 'hidden' }}>
                <Animated.View entering={FadeInUp.delay(300).duration(600)} style={{ width: '78%', height: '100%', borderRadius: 3, backgroundColor: '#6366F1' }} />
              </View>
              <Text style={{ fontSize: 10, color: '#A5B4FC', fontWeight: '700', marginTop: 3 }}>78% — {tr('social.energy.highCoherence', 'wysoka spójność', 'high coherence')}</Text>
            </View>
            <Pressable
              style={[sh.joinBtn, { backgroundColor: meditationJoined ? '#10B98122' : '#6366F1', borderColor: meditationJoined ? '#10B981' : 'transparent' }]}
              onPress={() => setMeditationJoined(!meditationJoined)}
            >
              {meditationJoined ? <Check color="#10B981" size={16} strokeWidth={2.5} /> : <Globe2 color="#fff" size={16} />}
              <Text style={[sh.joinBtnText, { color: meditationJoined ? '#10B981' : '#fff' }]}>
                {meditationJoined
                  ? tr('social.energy.joined', 'Dołączyłeś do kręgu ✓', 'You joined the circle ✓')
                  : tr('social.energy.join', 'Dołącz do kręgu', 'Join the circle')}
              </Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>

        {/* ── 2. TAROT WSPÓLNOTY ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('tarot')}>
          <SectionLabel icon={Star} title={tr('social.section.tarotTitle', 'Tarot Wspólnoty', 'Community Tarot')} sub={tr('social.section.tarotSub', 'Karta dnia całej wspólnoty', 'The community card of the day')} color="#F59E0B" textColor={textColor} subColor={subColor} />
          <View style={[sh.card, { borderColor: '#F59E0B30', backgroundColor: cardBg }]}>
            <LinearGradient colors={['#F59E0B10', 'transparent']} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['transparent', '#F59E0BAA', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
            <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-start' }}>
              <LinearGradient colors={['#7C3AED', '#4F46E5']} style={sh.tarotMini}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isLight ? 'rgba(37,29,22,0.65)' : 'rgba(255,255,255,0.65)', letterSpacing: 0.5 }}>{DAILY_TAROT.number}</Text>
                <Star color="#FCD34D" size={24} strokeWidth={1.5} />
                <Text style={{ fontSize: 9, fontWeight: '700', color: '#FCD34D', textAlign: 'center' }}>{tr('social.tarot.card', DAILY_TAROT.card, 'The Star')}</Text>
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[sh.cardTitle, { color: textColor }]}>{tr('social.tarot.theme', DAILY_TAROT.theme, 'Hope and renewal')}</Text>
                <Text style={[sh.cardSub, { color: subColor, marginBottom: 8 }]}>{tr('social.tarot.energyLabel', 'Energia', 'Energy')}: {DAILY_TAROT.energy}</Text>
                <View style={[sh.commentBubble, { backgroundColor: isLight ? 'rgba(240,230,215,0.90)' : 'rgba(255,255,255,0.06)', borderColor: cardBorder }]}>
                  <Text style={[sh.commentText, { color: subColor }]} numberOfLines={3}>{tr('social.tarot.comment', DAILY_TAROT.topComment, 'This card reminded me that after every darkness, light returns.')}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                  <Pressable style={[sh.miniChip, { borderColor: '#F59E0B44' }]}>
                    <MessageCircle color="#F59E0B" size={12} strokeWidth={2} />
                    <Text style={[sh.miniChipText, { color: '#F59E0B' }]}>{DAILY_TAROT.interpretations} {tr('social.tarot.interpretations', 'interpretacji', 'interpretations')}</Text>
                  </Pressable>
                  <Pressable style={[sh.miniChip, { borderColor: '#F59E0B44' }]}>
                    <Feather color="#F59E0B" size={12} strokeWidth={2} />
                    <Text style={[sh.miniChipText, { color: '#F59E0B' }]}>{tr('social.tarot.addYours', 'Dodaj swoją', 'Add yours')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── 3. RYTUAŁY NA ŻYWO ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('rituals')}>
          <SectionLabel icon={Flame} title={tr('social.section.liveRitualsTitle', 'Rytuały na Żywo', 'Live Rituals')} sub={tr('social.section.liveRitualsSub', 'Ceremonie prowadzone przez mistrzów', 'Ceremonies led by masters')} color="#DC2626" textColor={textColor} subColor={subColor} />
          <View style={{ gap: 8 }}>
            {liveRituals.length === 0 ? (
              <Pressable onPress={() => navigation.navigate('LiveRituals')} style={[sh.card, sh.rowCard, { borderColor: '#DC262638', justifyContent: 'center' }]}>
                <LinearGradient colors={['#DC262610', 'transparent']} style={StyleSheet.absoluteFill} />
                <Flame color="#DC2626" size={18} strokeWidth={1.8} />
                <Text style={[sh.rowTitle, { color: textColor, marginLeft: 10 }]}>{tr('social.rituals.startFirst', 'Zacznij pierwszy rytuał', 'Start the first ritual')}</Text>
                <ArrowRight color="#DC2626" size={14} strokeWidth={2.5} style={{ marginLeft: 'auto' }} />
              </Pressable>
            ) : liveRituals.map((r, i) => {
              const rColor = r.color || '#7C3AED';
              return (
                <Animated.View key={r.id} entering={FadeInUp.delay(160 + i * 35).duration(360)}>
                  <Pressable onPress={() => navigation.navigate('LiveRituals')} style={[sh.card, sh.rowCard, { borderColor: rColor + '38' }]}>
                    <LinearGradient colors={[rColor + '14', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[sh.challengeIcon, { backgroundColor: rColor + '1C' }]}>
                      <Flame color={rColor} size={20} strokeWidth={1.8} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.rowTitle, { color: textColor }]}>{r.name || r.title || tr('social.ritual.unnamed', 'Rytuał Wspólnoty', 'Community Ritual')}</Text>
                      <Text style={[sh.rowSub, { color: subColor }]}>{tr('social.ritual.hostedBy', 'Prowadzi:', 'Hosted by:')} {r.hostName || tr('social.ritual.host', 'Mistrz Wspólnoty', 'Community Master')} · {r.participantCount || r.participants || 0} {tr('social.participants', 'uczestników', 'participants')}</Text>
                    </View>
                    <View style={[sh.roundBtn, { backgroundColor: rColor, borderColor: rColor }]}>
                      <ArrowRight color="#fff" size={14} strokeWidth={2.5} />
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 4. KOSMICZNE DOPASOWANIE ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('matching')}>
          <SectionLabel icon={Heart} title={tr('social.section.matchingTitle', 'Kosmiczne Dopasowanie', 'Cosmic Match')} sub={tr('social.section.matchingSub', 'Energie i rezonans dusz', 'Soul resonance and energies')} color="#EC4899" textColor={textColor} subColor={subColor} action={tr('social.moreBtn', 'Więcej', 'More')} onAction={() => navigation.navigate('SoulMatch')} />
          <Pressable onPress={() => navigation.navigate('SoulMatch')} style={[sh.card, { borderColor: '#EC489938', overflow: 'hidden' }]}>
            <LinearGradient colors={['#EC489914', '#8B5CF608', 'transparent']} style={StyleSheet.absoluteFill} />
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>💜</Text>
              <Text style={[sh.cardTitle, { color: textColor, textAlign: 'center', fontSize: 16 }]}>{tr('social.match.discover', 'Odkryj dusze rezonujące z twoją energią', 'Discover souls resonating with your energy')}</Text>
              <Text style={[sh.cardSub, { color: subColor, textAlign: 'center', marginTop: 4 }]}>{tr('social.match.sub', 'Na podstawie twojego znaku zodiaku i archetypu', 'Based on your zodiac sign and archetype')}</Text>
              <View style={[sh.statChip, { backgroundColor: '#EC489920', marginTop: 14, paddingHorizontal: 16, paddingVertical: 7 }]}>
                <Heart color="#EC4899" size={12} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#EC4899', marginLeft: 5 }}>{tr('social.match.btn', 'Znajdź swoje rezonujące dusze', 'Find your resonant souls')}</Text>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {/* ── 5. SYMBOLARIUM SNÓW ── */}
        <Animated.View entering={FadeInDown.delay(220).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('dreams')}>
          <SectionLabel icon={Moon} title={tr('social.section.dreamsTitle', 'Symbolarium Snów', 'Dream Symbolarium')} sub={tr('social.section.dreamsSub', 'Trendy snów wspólnoty · anonimowo', 'Community dream trends · anonymous')} color="#818CF8" textColor={textColor} subColor={subColor} action={tr('common.add', 'Dodaj', 'Add')} />
          <View style={[sh.card, { borderColor: '#818CF830', backgroundColor: cardBg }]}>
            <LinearGradient colors={['#818CF810', 'transparent']} style={StyleSheet.absoluteFill} />
            <Text style={[sh.cardSub, { color: subColor, marginBottom: 12 }]}>{tr('social.dreams.mostCommon', 'Najczęstsze symbole tej nocy', 'Most common symbols tonight')}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {DREAM_SYMBOLS.map((s) => (
                <Pressable key={s.name} style={[sh.dreamChip, { backgroundColor: isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.06)', borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 20, marginBottom: 3 }}>{s.symbol}</Text>
                  <Text style={[sh.dreamName, { color: textColor }]}>{tr(`social.dreams.symbol.${s.symbol}`, s.name, ({ '🌊':'Water','🐍':'Snake','🏔':'Mountain','🌕':'Moon','🔥':'Fire','✈️':'Flight' } as any)[s.symbol] || s.name)}</Text>
                  <Text style={{ fontSize: 10, color: subColor }}>{s.count}x</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: s.trend.startsWith('+') ? '#10B981' : '#F87171' }}>{s.trend}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={[sh.miniChip, { borderColor: '#818CF844', alignSelf: 'flex-start', marginTop: 12 }]}>
              <Plus color="#818CF8" size={12} />
              <Text style={[sh.miniChipText, { color: '#818CF8' }]}>{tr('social.dreams.addSymbol', 'Dodaj symbol ze swojego snu', 'Add a symbol from your dream')}</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── 6. AFIRMACJA WSPÓLNOTY ── */}
        <Animated.View entering={FadeInDown.delay(160).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('affirmation')}>
          <SectionLabel icon={Sparkles} title={tr('social.section.affirmationTitle', 'Afirmacja Wspólnoty', 'Community Affirmation')} sub={tr('social.section.affirmationSub', 'Głosowanie co 24h', 'Voting every 24h')} color="#FBBF24" textColor={textColor} subColor={subColor} />
          <LinearGradient
            colors={['#F59E0B16', '#FBBF2410', 'transparent']}
            style={[sh.card, { borderColor: '#F59E0B38' }]}
          >
            <LinearGradient colors={['transparent', '#F59E0BAA', 'transparent']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
            <Text style={[sh.affText, { color: textColor }]}>"{tr('social.affirmation.text', COMMUNITY_AFFIRMATION.text, 'I am ready to receive the love I have been seeking within myself for so long.')}"</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 12 }}>
              {Object.entries(COMMUNITY_AFFIRMATION.reactions).map(([emoji, count]) => (
                <View key={emoji} style={[sh.reactionChip, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 14 }}>{emoji}</Text>
                  <Text style={[sh.reactionCount, { color: subColor }]}>{count}</Text>
                </View>
              ))}
            </View>
            {/* Energy bar */}
            <View style={{ marginBottom: 14 }}>
              <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F59E0B18', overflow: 'hidden' }}>
                <View style={{ width: '87%', height: '100%', borderRadius: 3, backgroundColor: '#F59E0B' }} />
              </View>
              <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700', marginTop: 3 }}>87% {tr('social.affirmation.confirmed', 'społeczności potwierdziło', 'of the community confirmed')}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Pressable
                style={[sh.voteBtn, { backgroundColor: affVoted ? '#F59E0B1A' : '#F59E0B' }]}
                onPress={() => setAffVoted(!affVoted)}
              >
                {affVoted ? <Check color="#F59E0B" size={14} strokeWidth={2.5} /> : <Heart color="#fff" size={14} />}
                <Text style={[sh.voteBtnText, { color: affVoted ? '#F59E0B' : '#fff' }]}>
                  {affVoted ? tr('social.affirmation.confirmedState', 'Potwierdzona', 'Confirmed') : tr('social.affirmation.confirm', 'Potwierdź', 'Confirm')}
                </Text>
              </Pressable>
              <Text style={[sh.voteCount, { color: subColor }]}>{formatLocaleNumber(COMMUNITY_AFFIRMATION.votes + (affVoted ? 1 : 0))} {tr('social.voteCount', 'głosów', 'votes')}</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── 7. WYZWANIA DUCHA ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('challenges')}>
          <SectionLabel icon={Trophy} title={tr('social.section.challengesTitle', 'Wyzwania Ducha', 'Soul Challenges')} sub={tr('social.section.challengesSub', 'Zbiorowe ścieżki transformacji', 'Collective paths of transformation')} color="#F97316" textColor={textColor} subColor={subColor} action={tr('common.all', 'Wszystkie', 'All')} />
          <View style={{ gap: 8 }}>
            {CHALLENGES.map((c, i) => {
              const joined = joinedChallenges[c.id];
              return (
                <Animated.View key={c.id} entering={FadeInUp.delay(190 + i * 40).duration(360)}>
                  <View style={[sh.card, { borderColor: c.color + '38', padding: 14 }]}>
                    <LinearGradient colors={[c.color + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={[sh.challengeIcon, { backgroundColor: c.color + '1C' }]}>
                        <c.Icon color={c.color} size={20} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[sh.rowTitle, { color: textColor }]}>{tr(`social.challenges.${c.id}.title`, c.title, ({1:'7 Days of Gratitude',2:'21 Days of Meditation',3:'30 Days Without Reactivity'} as any)[c.id] || c.title)}</Text>
                        <Text style={[sh.rowSub, { color: subColor }]}>{formatLocaleNumber(c.joined)} {tr('social.participants', 'uczestników', 'participants')} · {c.days} {tr('social.days', 'dni', 'days')}</Text>
                        <Text style={[{ fontSize: 12, color: subColor, lineHeight: 17, marginTop: 4 }]}>{tr(`social.challenges.${c.id}.desc`, c.desc, ({
                          1: 'Write down 3 things you are grateful for each day.',
                          2: 'A daily 10-minute practice of mindfulness and inner silence.',
                          3: 'Practice conscious response instead of automatic reaction.',
                        } as any)[c.id] || c.desc)}</Text>
                        <View style={[sh.progressBar, { backgroundColor: c.color + '1E', marginTop: 10 }]}>
                          <View style={[sh.progressFill, { width: `${c.completion}%`, backgroundColor: c.color }]} />
                        </View>
                        <Text style={{ fontSize: 10, color: c.color, fontWeight: '700', marginTop: 3 }}>{c.completion}% {tr('social.challenges.completed', 'ukończono', 'completed')}</Text>
                      </View>
                      <Pressable
                        style={[sh.roundBtn, { backgroundColor: joined ? c.color + '1C' : c.color, borderColor: c.color }]}
                        onPress={() => setJoinedChallenges(p => ({ ...p, [c.id]: !p[c.id] }))}
                      >
                        <Text style={[sh.roundBtnText, { color: joined ? c.color : '#fff' }]}>{joined ? '✓' : '+'}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 8. KOMORA INTENCJI ── */}
        <Animated.View entering={FadeInDown.delay(240).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('intentions')}>
          <SectionLabel icon={Target} title={tr('social.section.intentionsTitle', 'Komora Intencji', 'Intention Chamber')} sub={tr('social.section.intentionsSub', 'Wspólna tablica manifestacji', 'Shared manifestation board')} color="#10B981" textColor={textColor} subColor={subColor} action={tr('common.add', 'Dodaj', 'Add')} />
          {/* Compose new intention */}
          {!myIntentionSent ? (
            <View style={[sh.card, { borderColor: '#10B98128', marginBottom: 8, padding: 14 }]}>
              <LinearGradient colors={['#10B98110', 'transparent']} style={StyleSheet.absoluteFill} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#10B981', marginBottom: 6, letterSpacing: 0.8 }}>{tr('social.intentions.yours', 'TWOJA INTENCJA', 'YOUR INTENTION')}</Text>
              <TextInput
                value={myIntention}
                onChangeText={setMyIntention}
                placeholder={tr('social.intentions.placeholder', 'Napisz intencję, którą chcesz posłać światu...', 'Write the intention you want to send into the world...')}
                placeholderTextColor={subColor}
                style={{ color: textColor, fontSize: 13, lineHeight: 20, minHeight: 52 }}
                multiline
                onSubmitEditing={() => { if (myIntention.trim().length >= 2) { setMyIntentionSent(true); setMyIntention(''); } }}
              />
              {myIntention.trim().length >= 2 && (
                <Pressable
                  style={[sh.joinBtn, { backgroundColor: '#10B981', borderColor: 'transparent', marginTop: 10 }]}
                  onPress={() => { setMyIntentionSent(true); setMyIntention(''); }}
                >
                  <Target color="#fff" size={14} />
                  <Text style={[sh.joinBtnText, { color: '#fff' }]}>{tr('social.intentions.send', 'Wyślij intencję', 'Send intention')}</Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={[sh.card, { borderColor: '#10B98140', marginBottom: 8, padding: 12 }]}>
              <LinearGradient colors={['#10B98115', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Check color="#10B981" size={16} />
                <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 13 }}>{tr('social.intentions.sent', 'Intencja wysłana — wspólnota jest świadkiem ✓', 'Intention sent — the community is bearing witness ✓')}</Text>
              </View>
            </View>
          )}
          <View style={{ gap: 8 }}>
            {INTENTIONS.map((item, i) => {
              const isWit = witnessed[item.id];
              return (
                <Animated.View key={item.id} entering={FadeInUp.delay(250 + i * 40).duration(360)}>
                  <View style={[sh.card, sh.rowCard, { borderColor: '#10B98128' }]}>
                    <LinearGradient colors={['#10B98110', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={[sh.intentionNum, { backgroundColor: '#10B9811A' }]}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#10B981' }}>{item.energy}</Text>
                      <Text style={{ fontSize: 9, fontWeight: '600', color: '#10B981', marginTop: -2 }}>%</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.rowTitle, { color: textColor, fontSize: 13 }]} numberOfLines={2}>{tr(`social.intentions.${item.id}.text`, item.text, ({
                        1: 'I attract abundance and peace into my life.',
                        2: 'We release everything that limits us tonight.',
                        3: 'My relationships are full of love and mutual respect.',
                      } as any)[item.id] || item.text)}</Text>
                      <Text style={[sh.rowSub, { color: subColor }]}>{item.witnesses + (isWit ? 1 : 0)} {tr('social.intentions.witnesses', 'świadków', 'witnesses')} · {tr(`social.intentions.${item.id}.time`, item.time, ({1:'2h ago',2:'5h ago',3:'7h ago'} as any)[item.id] || item.time)}</Text>
                    </View>
                    <Pressable
                      style={[sh.roundBtn, { backgroundColor: isWit ? '#10B9811A' : '#10B981', borderColor: '#10B981' }]}
                      onPress={() => setWitnessed(p => ({ ...p, [item.id]: !p[item.id] }))}
                    >
                      <Eye color={isWit ? '#10B981' : '#fff'} size={15} strokeWidth={2} />
                    </Pressable>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 9. PASMO ŚWIADOMOŚCI ── */}
        <Animated.View entering={FadeInDown.delay(260).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('feed')}>
          <SectionLabel icon={Feather} title={tr('social.section.feedTitle', 'Pasmo Świadomości', 'Field of Awareness')} sub={tr('social.section.feedSub', 'Refleksje i przełomy wspólnoty', 'Reflections and community breakthroughs')} color="#8B5CF6" textColor={textColor} subColor={subColor} />
          <View style={[sh.feedInputWrap, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <TextInput
              value={feedInput}
              onChangeText={setFeedInput}
              placeholder={tr('social.feed.placeholder', 'Podziel się swoją refleksją ze wspólnotą...', 'Share your reflection with the community...')}
              placeholderTextColor={subColor}
              style={[sh.feedInputText, { color: textColor }]}
              multiline
              onSubmitEditing={() => { if (feedInput.trim().length >= 2) setFeedInput(''); }}
            />
            {feedInput.trim().length >= 2 && (
              <Pressable style={[sh.postBtn, { backgroundColor: '#8B5CF6' }]} onPress={() => setFeedInput('')}>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>{tr('social.feed.publish', 'Opublikuj', 'Publish')}</Text>
              </Pressable>
            )}
          </View>
          <View style={{ gap: 8 }}>
            {feedPosts.length === 0 ? (
              <Pressable onPress={() => navigation.navigate('Consciousness')} style={[sh.card, { borderColor: '#8B5CF628', justifyContent: 'center', alignItems: 'center', paddingVertical: 28 }]}>
                <LinearGradient colors={['#8B5CF610', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={{ fontSize: 32, marginBottom: 8 }}>🪶</Text>
                <Text style={[sh.cardTitle, { color: textColor, textAlign: 'center' }]}>{tr('social.feed.empty', 'Bądź pierwszą osobą która się podzieli', 'Be the first to share')}</Text>
                <Text style={[sh.cardSub, { color: subColor, textAlign: 'center', marginTop: 4 }]}>{tr('social.feed.emptySub', 'Podziel się refleksją z całą wspólnotą', 'Share a reflection with the whole community')}</Text>
              </Pressable>
            ) : feedPosts.map((f, i) => {
              const fColor = f.color || '#8B5CF6';
              const timeLabel = (() => {
                if (!f.createdAt) return '';
                const d = f.createdAt.toDate ? f.createdAt.toDate() : new Date(f.createdAt);
                const diff = Math.floor((Date.now() - d.getTime()) / 1000);
                if (diff < 60) return 'przed chwilą';
                if (diff < 3600) return `${Math.floor(diff / 60)} min temu`;
                if (diff < 86400) return `${Math.floor(diff / 3600)} godz. temu`;
                return `${Math.floor(diff / 86400)} dni temu`;
              })();
              return (
                <Animated.View key={f.id} entering={FadeInDown.delay(270 + i * 40).duration(360)}>
                  <View style={[sh.card, sh.feedCard, { borderColor: fColor + '28' }]}>
                    <LinearGradient colors={[fColor + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={sh.feedHeader}>
                      <View style={[sh.feedAvatar, { backgroundColor: fColor + '20' }]}>
                        <Text style={{ fontSize: 18 }}>✦</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[sh.feedAuthor, { color: textColor }]}>{f.authorName || tr('social.feed.anonSoul', 'Anonimowa Dusza', 'Anonymous Soul')}</Text>
                        <Text style={{ fontSize: 11, color: subColor }}>{timeLabel}</Text>
                      </View>
                      {f.tag && (
                        <View style={[sh.feedTag, { backgroundColor: fColor + '1C', borderColor: fColor + '40' }]}>
                          <Text style={[sh.feedTagText, { color: fColor }]}>{f.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[sh.feedContent, { color: textColor }]}>{f.content || f.text}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                      <Pressable
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        onPress={() => setLiked(p => ({ ...p, [f.id]: !p[f.id] }))}
                      >
                        <Heart color={liked[f.id] ? '#EC4899' : subColor} size={15} fill={liked[f.id] ? '#EC4899' : 'none'} />
                        <Text style={{ fontSize: 12, color: liked[f.id] ? '#EC4899' : subColor, fontWeight: '500' }}>
                          {(f.likes || f.reactions?.total || 0) + (liked[f.id] ? 1 : 0)}
                        </Text>
                      </Pressable>
                      <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }} onPress={() => navigation.navigate('Consciousness')}>
                        <MessageCircle color={subColor} size={15} />
                        <Text style={{ fontSize: 12, color: subColor, fontWeight: '500' }}>{tr('social.feed.reply', 'Odpowiedz', 'Reply')}</Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 10. MENTORZY DUSZY ── */}
        <Animated.View entering={FadeInDown.delay(280).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('mentors')}>
          <SectionLabel icon={Crown} title={tr('social.section.mentorsTitle', 'Mentorzy Duszy', 'Soul Mentors')} sub={tr('social.section.mentorsSub', 'Sesje z duchowymi przewodnikami', 'Sessions with spiritual guides')} color="#CEAE72" textColor={textColor} subColor={subColor} action={tr('common.all', 'Wszyscy', 'All')} />
          <View style={{ gap: 8 }}>
            {mentors.length === 0 ? (
              <Pressable onPress={() => navigation.navigate('SoulMentors')} style={[sh.card, { borderColor: '#CEAE7228', alignItems: 'center', paddingVertical: 24 }]}>
                <LinearGradient colors={['#CEAE7210', 'transparent']} style={StyleSheet.absoluteFill} />
                <Crown color="#CEAE72" size={32} strokeWidth={1.4} />
                <Text style={[sh.cardTitle, { color: textColor, textAlign: 'center', marginTop: 10 }]}>{tr('social.mentors.discover', 'Odkryj Mentorów Duszy', 'Discover Soul Mentors')}</Text>
                <Text style={[sh.cardSub, { color: subColor, textAlign: 'center', marginTop: 4 }]}>{tr('social.mentors.discoverSub', 'Prywatne sesje z duchowymi przewodnikami', 'Private sessions with spiritual guides')}</Text>
              </Pressable>
            ) : mentors.map((m, i) => {
              const mColor = m.color || '#CEAE72';
              return (
                <Animated.View key={m.id} entering={FadeInUp.delay(290 + i * 40).duration(360)}>
                  <Pressable onPress={() => navigation.navigate('SoulMentors')} style={[sh.card, { borderColor: mColor + '30', padding: 14 }]}>
                    <LinearGradient colors={[mColor + '10', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={[sh.mentorAvatar, { backgroundColor: mColor + '1C', borderColor: mColor + '44' }]}>
                        <Crown color={mColor} size={18} strokeWidth={1.8} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                          <Text style={[sh.rowTitle, { color: textColor }]}>{m.name || m.displayName || tr('social.mentors.mentor', 'Mentor', 'Mentor')}</Text>
                          {m.online && <OnlinePulse color="#10B981" size={8} />}
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: mColor }}>{m.specialty || m.specialization || ''}</Text>
                        <Text style={{ fontSize: 11, color: subColor, marginTop: 1 }}>★ {m.rating || '5.0'} · {m.sessions || 0} {tr('social.mentors.sessions', 'sesji', 'sessions')}</Text>
                        {m.bio && <Text style={{ fontSize: 11, color: subColor, lineHeight: 17, marginTop: 4 }}>{m.bio}</Text>}
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <Pressable style={[sh.bookBtn, { backgroundColor: mColor, borderColor: mColor, flex: 1, justifyContent: 'center' }]} onPress={() => navigation.navigate('SoulMentors')}>
                        <Text style={[sh.bookBtnText, { color: '#fff' }]}>{tr('social.mentors.book', 'Zarezerwuj sesję', 'Book a session')}</Text>
                      </Pressable>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── 11. PORTALE KOSMICZNE ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('events')}>
          <SectionLabel icon={Calendar} title={tr('social.section.portalsTitle', 'Portale Kosmiczne', 'Cosmic Portals')} sub={tr('social.section.portalsSub', 'Zbiorowe świętowania energii', 'Shared celebrations of energy')} color="#60A5FA" textColor={textColor} subColor={subColor} />
          <View style={{ gap: 10 }}>
            {COSMIC_EVENTS.map((e, i) => (
              <Animated.View key={e.id} entering={FadeInUp.delay(310 + i * 35).duration(360)}>
                <Pressable style={[sh.card, { borderColor: e.color + '44', padding: 14 }]}>
                  <LinearGradient colors={[e.color + '20', e.color + '08', 'transparent']} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={['transparent', e.color + 'AA', 'transparent']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5 }} pointerEvents="none" />
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    <View style={[sh.eventIcon, { backgroundColor: e.color + '1E', margin: 0 }]}>
                      <e.Icon color={e.color} size={22} strokeWidth={1.5} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: e.color, letterSpacing: 1, marginBottom: 3 }}>{e.date.toUpperCase()} · {e.daysLeft} {tr('social.daysUpper', 'DNI', 'DAYS')}</Text>
                      <Text style={[sh.rowTitle, { color: textColor }]}>{tr(`social.events.${e.id}.title`, e.title, ({1:'Full Moon in Libra',2:'Mercury Direct',3:'Lion Gate 8:8'} as any)[e.id] || e.title)}</Text>
                      <Text style={{ fontSize: 12, color: subColor, lineHeight: 17, marginTop: 3 }}>{tr(`social.events.${e.id}.desc`, e.desc, ({
                        1: 'A time of balance, relationships, and beauty. An ideal night for harmony rituals.',
                        2: 'The retrograde ends — return to projects and communication.',
                        3: 'The most powerful portal of the year. Manifestation and DNA activation.',
                      } as any)[e.id] || e.desc)}</Text>
                      <Text style={{ fontSize: 11, color: subColor, marginTop: 5 }}>{formatLocaleNumber(e.participants)} {tr('social.participants', 'uczestników', 'participants')}</Text>
                    </View>
                    <View style={[sh.roundBtn, { backgroundColor: e.color + '18', borderColor: e.color + '50' }]}>
                      <Star color={e.color} size={14} />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── 12. KRONIKA WSPÓLNOTY ── */}
        <Animated.View entering={FadeInDown.delay(320).duration(440)} style={{ marginBottom: 18 }}
          onLayout={registerSection('chronicle')}>
          <SectionLabel icon={BookOpen} title={tr('social.section.chronicleTitle', 'Kronika Wspólnoty', 'Community Chronicle')} sub={tr('social.section.chronicleSub', 'Eseje i archiwum duchowej wiedzy', 'Essays and archive of spiritual wisdom')} color="#A78BFA" textColor={textColor} subColor={subColor} action={tr('common.all', 'Wszystkie', 'All')} />
          <View style={{ gap: 8 }}>
            {chronicles.length === 0 ? (
              <Pressable onPress={() => navigation.navigate('CommunityChronicle')} style={[sh.card, { borderColor: '#A78BFA28', alignItems: 'center', paddingVertical: 24 }]}>
                <LinearGradient colors={['#A78BFA10', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={{ fontSize: 32, marginBottom: 8 }}>📖</Text>
                <Text style={[sh.cardTitle, { color: textColor, textAlign: 'center' }]}>{tr('social.chronicle.empty', 'Napisz pierwszą kronikę', 'Write the first chronicle')}</Text>
                <Text style={[sh.cardSub, { color: subColor, textAlign: 'center', marginTop: 4 }]}>{tr('social.chronicle.emptySub', 'Podziel się wiedzą i doświadczeniem', 'Share your knowledge and experience')}</Text>
              </Pressable>
            ) : chronicles.map((c, i) => {
              const cColor = c.color || '#A78BFA';
              return (
                <Animated.View key={c.id} entering={FadeInUp.delay(330 + i * 40).duration(360)}>
                  <Pressable onPress={() => navigation.navigate('CommunityChronicle')} style={[sh.card, { borderColor: cColor + '28', padding: 14 }]}>
                    <LinearGradient colors={[cColor + '0C', 'transparent']} style={StyleSheet.absoluteFill} />
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        {c.tag && (
                          <View style={[sh.chronicleTag, { backgroundColor: cColor + '18', borderColor: cColor + '40' }]}>
                            <Text style={[sh.chronicleTagText, { color: cColor }]}>{c.tag}</Text>
                          </View>
                        )}
                        <Text style={[sh.rowTitle, { color: textColor, lineHeight: 21 }]}>{c.title || c.content?.slice(0, 60)}</Text>
                        {c.preview && <Text style={{ fontSize: 12, color: subColor, lineHeight: 18, marginTop: 4 }} numberOfLines={2}>{c.preview}</Text>}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                          <Text style={{ fontSize: 11, color: subColor }}>{tr('social.chronicle.by', 'przez', 'by')} {c.authorName || c.author || tr('social.feed.anonSoul', 'Anonimowa Dusza', 'Anonymous Soul')}</Text>
                          <Text style={{ color: subColor }}>·</Text>
                          <Heart color={subColor} size={10} />
                          <Text style={{ fontSize: 11, color: subColor }}>{c.likes || 0}</Text>
                        </View>
                      </View>
                      <View style={[sh.roundBtn, { backgroundColor: cColor + '14', borderColor: cColor + '38' }]}>
                        <ChevronRight color={cColor} size={14} />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        <EndOfContentSpacer size="compact" />
      </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
  // Hero
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 12, paddingBottom: 18 },
  heroEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
  heroTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 30 },
  heroSub: { fontSize: 12, fontWeight: '500' },
  heroBadge: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center', gap: 4 },
  heroBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },

  // Live strip
  liveStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  liveStripText: { fontSize: 12, fontWeight: '600', maxWidth: 130 },
  liveStripBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  liveStripBadgeText: { fontSize: 10, fontWeight: '700' },

  // Hub
  hubHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  hubTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.8 },
  hubSub: { fontSize: 11, fontWeight: '600' },

  // WOW horizontal feature tiles
  hTile: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 26, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 18,
    overflow: 'hidden', minHeight: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 6,
  },
  hTileArt: {
    width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, overflow: 'visible', flexShrink: 0,
  },
  hTileEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  hTileTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3, lineHeight: 22 },
  hTileDesc: { fontSize: 12, lineHeight: 17, opacity: 0.75 },
  hTileStat: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1, flex: 1 },
  hTileArrow: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0, marginLeft: 10, overflow: 'hidden' },

  // Section label
  secLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10, marginTop: 4 },
  secLabelIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secLabelTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.1 },
  secLabelSub: { fontSize: 11, marginTop: 1 },
  secLabelAction: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  secLabelActionText: { fontSize: 11, fontWeight: '600' },

  // Cards
  card: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden', ...shadows.soft },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  feedCard: { padding: 14 },

  // Meditation
  bigTime: { fontSize: 38, fontWeight: '800', letterSpacing: -1.5 },
  bigTimeLabel: { fontSize: 11, fontWeight: '500', marginTop: -4 },
  circleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statChipText: { fontSize: 11, fontWeight: '600' },
  circleTopic: { fontSize: 15, fontWeight: '600', lineHeight: 22, marginBottom: 10 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 28, borderWidth: 1 },
  joinBtnText: { fontSize: 14, fontWeight: '700' },

  // Tarot
  tarotMini: { width: 76, height: 116, borderRadius: 14, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', lineHeight: 22, marginBottom: 3 },
  cardSub: { fontSize: 12, fontWeight: '500' },
  commentBubble: { borderRadius: 12, borderWidth: 1, padding: 10, marginTop: 6 },
  commentText: { fontSize: 11, lineHeight: 18 },
  miniChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  miniChipText: { fontSize: 11, fontWeight: '600' },

  // Affirmation
  affText: { fontSize: 17, fontWeight: '500', lineHeight: 27, fontStyle: 'italic', letterSpacing: -0.1 },
  reactionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, borderWidth: 1 },
  reactionCount: { fontSize: 11, fontWeight: '600' },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 26, borderWidth: 1 },
  voteBtnText: { fontSize: 13, fontWeight: '700' },
  voteCount: { fontSize: 12 },

  // Challenges
  challengeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  progressBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  roundBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  roundBtnText: { fontSize: 17, fontWeight: '800' },
  rowTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  rowSub: { fontSize: 11, fontWeight: '400' },

  // Intentions
  intentionNum: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  // Match cards
  matchCard: { width: 144, borderRadius: 20, borderWidth: 1, padding: 16, alignItems: 'center', gap: 4, overflow: 'hidden' },
  matchCardMore: { justifyContent: 'center' },
  matchAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  matchName: { fontSize: 14, fontWeight: '700' },
  matchSign: { fontSize: 11 },
  matchArch: { fontSize: 11, fontWeight: '700' },
  matchEnergy: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Dream chips
  dreamChip: { borderRadius: 14, borderWidth: 1, padding: 10, alignItems: 'center', minWidth: 82 },
  dreamName: { fontSize: 11, fontWeight: '600' },

  // Feed
  feedInputWrap: { borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 10, minHeight: 64 },
  feedInputText: { fontSize: 14, lineHeight: 22 },
  postBtn: { alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 8 },
  feedHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  feedAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  feedAuthor: { fontSize: 13, fontWeight: '700' },
  feedTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  feedTagText: { fontSize: 10, fontWeight: '700' },
  feedContent: { fontSize: 14, lineHeight: 22 },

  // Mentors
  mentorAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0 },
  bookBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  bookBtnText: { fontSize: 12, fontWeight: '700' },

  // Events
  eventIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6, flexShrink: 0 },

  // Chronicle
  chronicleTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, marginBottom: 5 },
  chronicleTagText: { fontSize: 10, fontWeight: '700' },
});
