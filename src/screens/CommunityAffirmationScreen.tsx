// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Dimensions, TextInput, KeyboardAvoidingView, Platform, Animated as RNAnimated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeInDown, FadeIn, withSpring } from 'react-native-reanimated';
import { ChevronLeft, Heart, Copy, Flame, Sparkles, Shuffle, Check, ArrowRight, Users, TrendingUp } from 'lucide-react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { AffirmationsService, Affirmation } from '../core/services/community/affirmations.service';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#FBBF24';

const HERO_AFFIRMATION = 'Jestem gotow(a) przyjąć miłość, której szukam w sobie od dawna.';

const WEEKLY_AFFIRMATIONS = [
  { date: 'Pon', text: 'Jestem wystarczająca(y).', votes: 2341 },
  { date: 'Wt', text: 'Moje granice są święte.', votes: 1892 },
  { date: 'Śr', text: 'Ufam rytmowi życia.', votes: 2105 },
  { date: 'Czw', text: 'Zasługuję na spokój.', votes: 1678 },
  { date: 'Pt', text: 'Moje serce jest otwarte.', votes: 1934 },
  { date: 'Sob', text: 'Jestem zakorzeniona(y).', votes: 2220 },
  { date: 'Nd', text: 'Wybieram siebie każdego dnia.', votes: 2891 },
];

const ARCHIVE_AFFIRMATIONS = [
  { text: 'Moje ciało jest moim domem i zasługuje na miłość.', votes: 3120, week: '3 tyg. temu' },
  { text: 'Jestem spokojna(y) nawet pośród burzy.', votes: 2876, week: '4 tyg. temu' },
  { text: 'Każdy dzień przynosi nowe możliwości.', votes: 2654, week: '5 tyg. temu' },
  { text: 'Moje marzenia są warte realizacji.', votes: 2401, week: '6 tyg. temu' },
];

const RANDOM_AFFIRMATIONS = [
  'Jestem wystarczająca(y) dokładnie taka(i), jaka(i) jestem.',
  'Moja wrażliwość jest moją siłą.',
  'Ufam, że wszystko układa się w doskonały sposób.',
  'Jestem godna(y) miłości bez warunków.',
  'Każdy oddech przybliża mnie do spokoju.',
  'Moje granice chronią moją energię.',
  'Zasługuję na radość i obfitość.',
  'Jestem połączona(y) z mądrością wszechświata.',
];

export const CommunityAffirmationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { currentTheme, isLight } = useTheme();
      const currentUser = useAuthStore(s => s.currentUser);
  const tc = isLight ? '#1A1008' : '#F0ECE4';
  const sc = isLight ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.55)';
  const cb = isLight ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.05)';
  const cbr = isLight ? 'rgba(122,95,54,0.18)' : 'rgba(255,255,255,0.10)';

  const affirmationIdRef = useRef<string | null>(null);
  const [heroText, setHeroText] = useState(HERO_AFFIRMATION);
  const [votes, setVotes] = useState(2341);
  const [voted, setVoted] = useState(false);
  const [reactions, setReactions] = useState({ '💛': 891, '✨': 654, '🌸': 796 });
  const [weeklyReactions, setWeeklyReactions] = useState<Record<number, Record<string, number>>>(
    Object.fromEntries(WEEKLY_AFFIRMATIONS.map((_, i) => [i, { '💛': 0, '✨': 0, '🌸': 0 }]))
  );
  const [copied, setCopied] = useState(false);
  const copyFlash = useRef(new RNAnimated.Value(0)).current;
  const [proposalText, setProposalText] = useState('');
  const [proposalSent, setProposalSent] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const proposalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Load hero affirmation from Firebase
    AffirmationsService.getOrSeedHeroAffirmation().then(async (aff: Affirmation) => {
      affirmationIdRef.current = aff.id;
      setHeroText(aff.text);
      setVotes(aff.votes);
      setReactions({ '💛': aff.reactions.heart, '✨': aff.reactions.star, '🌸': aff.reactions.flower });
      if (currentUser) {
        const hasVoted = await AffirmationsService.hasVoted(aff.id, currentUser.uid);
        setVoted(hasVoted);
      }
    }).catch(() => {});
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      if (proposalTimerRef.current) clearTimeout(proposalTimerRef.current);
    };
  }, []);
  const [streak] = useState(5);
  const [shuffledAffirmation, setShuffledAffirmation] = useState<string | null>(null);
  const [myProposals, setMyProposals] = useState<Array<{ text: string; status: string; votes: number }>>([]);

  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));

  const handleVote = async () => {
    if (voted || !currentUser || !affirmationIdRef.current) return;
    HapticsService.impact('medium');
    setVoted(true);
    setVotes(v => v + 1);
    heartScale.value = withSequence(withSpring(1.4), withSpring(1));
    AffirmationsService.vote(affirmationIdRef.current, currentUser.uid).catch(() => {});
  };

  const handleReaction = (emoji: string) => {
    HapticsService.impact('light');
    setReactions(r => ({ ...r, [emoji]: r[emoji] + 1 }));
    const emojiToKey: Record<string, 'heart'|'star'|'flower'> = { '💛': 'heart', '✨': 'star', '🌸': 'flower' };
    if (currentUser && affirmationIdRef.current && emojiToKey[emoji]) {
      AffirmationsService.react(affirmationIdRef.current, currentUser.uid, emojiToKey[emoji]).catch(() => {});
    }
  };

  const handleWeeklyReaction = (index: number, emoji: string) => {
    HapticsService.impact('light');
    setWeeklyReactions(prev => ({
      ...prev,
      [index]: { ...prev[index], [emoji]: (prev[index]?.[emoji] ?? 0) + 1 },
    }));
  };

  const handleCopy = () => {
    HapticsService.impact('light');
    setCopied(true);
    RNAnimated.sequence([
      RNAnimated.timing(copyFlash, { toValue: 1, duration: 150, useNativeDriver: true }),
      RNAnimated.timing(copyFlash, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2500);
  };

  const handleProposal = () => {
    if (proposalText.trim().length < 2) return;
    HapticsService.impact('medium');
    const text = proposalText.trim();
    setMyProposals(prev => [{ text, status: t('communityAffirmation.w_glosowaniu', 'W głosowaniu'), votes: 0 }, ...prev]);
    setProposalSent(true);
    setProposalText('');
    if (proposalTimerRef.current) clearTimeout(proposalTimerRef.current);
    proposalTimerRef.current = setTimeout(() => setProposalSent(false), 3000);
    if (currentUser) {
      AffirmationsService.propose({ uid: currentUser.uid, displayName: currentUser.displayName }, text).catch(() => {});
    }
  };

  const handleShuffle = () => {
    HapticsService.impact('light');
    const idx = Math.floor(Math.random() * RANDOM_AFFIRMATIONS.length);
    setShuffledAffirmation(RANDOM_AFFIRMATIONS[idx]);
  };

  const copyBgStyle = {
    opacity: copyFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }),
  };

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={{ flex: 1}} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FFFBEB', '#FEF3C7', currentTheme.background] : ['#0E0902', '#1A1005', currentTheme.background]}
        style={StyleSheet.absoluteFill} pointerEvents="none"
      />
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Worlds')} style={styles.backBtn}>
          <ChevronLeft size={22} color={tc} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: tc }]}>{t('communityAffirmation.afirmacja_wspolnoty', 'Afirmacja Wspólnoty')}</Text>
          <Text style={[styles.headerSub, { color: ACCENT }]}>{t('communityAffirmation.co_24h', 'CO 24H')}</Text>
        </View>
        <Sparkles size={20} color={ACCENT} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 20 }}
        >

          {/* Hero */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 8 }}>
            <LinearGradient colors={['#92400E', '#B45309', '#D97706']} style={styles.heroCard}>
              <Text style={[styles.heroLabel, isLight && { color: 'rgba(37,29,22,0.70)' }]}>{t('communityAffirmation.afirmacja_dnia', 'AFIRMACJA DNIA')}</Text>
              <Text style={styles.heroText}>{heroText}</Text>
              <Text style={[styles.heroVotes, isLight && { color: 'rgba(37,29,22,0.70)' }]}>{votes.toLocaleString()} {t('communityAffirmation.glosow', 'głosów')}</Text>
            </LinearGradient>

            {/* Vote Button */}
            <Animated.View style={[{ alignSelf: 'center', marginTop: 16 }, heartStyle]}>
              <Pressable onPress={handleVote} style={[styles.voteBtn, { backgroundColor: voted ? '#EC4899' : cb, borderColor: voted ? '#EC4899' : cbr }]}>
                <Heart size={28} color={voted ? '#fff' : '#EC4899'} fill={voted ? '#fff' : 'none'} />
                <Text style={[styles.voteBtnText, { color: voted ? '#fff' : tc }]}>{voted ? t('communityAffirmation.glosowales_as', 'Głosowałeś(aś)!') : t('communityAffirmation.potwierdz_te_afirmacje', 'Potwierdź tę afirmację')}</Text>
              </Pressable>
            </Animated.View>

            {/* Reactions */}
            <View style={styles.reactionRow}>
              {Object.entries(reactions).map(([emoji, count]) => (
                <Pressable key={emoji} onPress={() => handleReaction(emoji)} style={[styles.reactionBtn, { backgroundColor: cb, borderColor: cbr }]}>
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                  <Text style={[styles.reactionCount, { color: tc }]}>{count}</Text>
                </Pressable>
              ))}
            </View>

            {/* Copy with flash animation */}
            <View style={{ position: 'relative' }}>
              <Pressable onPress={handleCopy} style={[styles.copyBtn, { backgroundColor: cb, borderColor: cbr }]}>
                <RNAnimated.View style={[StyleSheet.absoluteFill, { backgroundColor: ACCENT, borderRadius: 12 }, copyBgStyle]} />
                {copied ? <Check size={16} color={ACCENT} /> : <Copy size={16} color={tc} />}
                <Text style={[styles.copyText, { color: copied ? ACCENT : tc }]}>{copied ? 'Skopiowano! ✦' : 'Kopiuj afirmację'}</Text>
              </Pressable>
            </View>

            {/* Shuffle button */}
            <Pressable onPress={handleShuffle} style={[styles.shuffleBtn, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
              <Shuffle size={18} color={ACCENT} />
              <Text style={[styles.shuffleText, { color: ACCENT }]}>{t('communityAffirmation.losuj_afirmacje', 'Losuj afirmację')}</Text>
            </Pressable>
            {!!shuffledAffirmation && (
              <Animated.View entering={FadeInDown} style={[styles.shuffledCard, { backgroundColor: ACCENT + '12', borderColor: ACCENT + '40' }]}>
                <Text style={[{ fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 24, color: tc }]}>{shuffledAffirmation}</Text>
              </Animated.View>
            )}

            {/* Streak */}
            <View style={[styles.streakCard, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '44' }]}>
              <Flame size={20} color={ACCENT} />
              <Text style={[styles.streakText, { color: tc }]}>{t('communityAffirmation.glosujesz', 'Głosujesz')} {streak} {t('communityAffirmation.dni_z_rzedu', 'dni z rzędu')}</Text>
            </View>
          </View>

          {/* Weekly Affirmations with per-card reactions */}
          <View style={{ marginTop: 24 }}>
            <Text style={[styles.sectionTitle, { color: sc, paddingHorizontal: layout.padding.screen }]}>{t('communityAffirmation.ostatnie_7_dni', 'OSTATNIE 7 DNI')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: layout.padding.screen, gap: 10 }}>
              {WEEKLY_AFFIRMATIONS.map((a, i) => (
                <Animated.View key={a.date} entering={FadeInDown.delay(i * 50)} style={[styles.weekCard, { backgroundColor: cb, borderColor: cbr }]}>
                  <Text style={[styles.weekDate, { color: ACCENT }]}>{a.date}</Text>
                  <Text style={[styles.weekText, { color: tc }]} numberOfLines={3}>{a.text}</Text>
                  <Text style={[styles.weekVotes, { color: sc }]}>{a.votes.toLocaleString()} ♡</Text>
                  {/* Per-card reactions */}
                  <View style={{ flexDirection: 'row', gap: 4, marginTop: 6 }}>
                    {['💛', '✨', '🌸'].map(emoji => (
                      <Pressable key={emoji} onPress={() => handleWeeklyReaction(i, emoji)} style={styles.weekReactionBtn}>
                        <Text style={{ fontSize: 11 }}>{emoji}</Text>
                        <Text style={[{ fontSize: 10, color: sc }]}>{weeklyReactions[i]?.[emoji] ?? 0}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Affirmacja Tygodnia */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.afirmacja_tygodnia', 'AFIRMACJA TYGODNIA')}</Text>
            <LinearGradient colors={['#78350F', '#92400E', '#B45309']} style={styles.weekHeroCard}>
              <Text style={[styles.weekHeroLabel, isLight && { color: 'rgba(37,29,22,0.60)' }]}>{t('communityAffirmation.najwyzej_oceniana', 'NAJWYŻEJ OCENIANA')}</Text>
              <Text style={styles.weekHeroText}>{t('communityAffirmation.wybieram_siebie_kazdego_dnia', 'Wybieram siebie każdego dnia.')}</Text>
              <Text style={[styles.weekHeroVotes, isLight && { color: 'rgba(37,29,22,0.60)' }]}>{t('communityAffirmation.2_891_glosow', '2 891 głosów')}</Text>
            </LinearGradient>
          </View>

          {/* Archiwum afirmacji */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.archiwum_afirmacji', 'ARCHIWUM AFIRMACJI')}</Text>
            <View style={{ gap: 8 }}>
              {ARCHIVE_AFFIRMATIONS.map((a, i) => (
                <Animated.View key={i} entering={FadeInDown.delay(i * 60)} style={[styles.archiveCard, { backgroundColor: cb, borderColor: cbr }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 13, lineHeight: 20, color: tc }]}>{a.text}</Text>
                    <Text style={[{ fontSize: 11, color: sc, marginTop: 4 }]}>{a.week} · {a.votes.toLocaleString()} głosów</Text>
                  </View>
                  <View style={[styles.archiveVoteBadge, { backgroundColor: ACCENT + '20' }]}>
                    <Heart size={12} color={ACCENT} />
                    <Text style={[{ fontSize: 11, color: ACCENT, fontWeight: '700' }]}>{a.votes.toLocaleString()}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </View>

          {/* Proposal */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.zaproponuj_afirmacje', 'ZAPROPONUJ AFIRMACJĘ')}</Text>
            <View style={[styles.proposalCard, { backgroundColor: cb, borderColor: cbr }]}>
              <TextInput
                value={proposalText} onChangeText={setProposalText}
                placeholder={t('communityAffirmation.napisz_afirmacje_dla_wspolnoty', 'Napisz afirmację dla wspólnoty...')} placeholderTextColor={sc}
                multiline
                returnKeyType="send"
                onSubmitEditing={() => { if (proposalText.trim().length >= 2) handleProposal(); }}
                style={[styles.proposalInput, { color: tc }]}
              />
              <Pressable onPress={handleProposal} style={[styles.proposalBtn, { backgroundColor: proposalText.trim().length >= 2 ? ACCENT : ACCENT + '66' }]}>
                <Text style={styles.proposalBtnText}>{proposalSent ? 'Propozycja wysłana do głosowania ✦' : 'Wyślij propozycję'}</Text>
              </Pressable>
            </View>
          </View>

          {/* How it works */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.jak_to_dziala', 'JAK TO DZIAŁA')}</Text>
            <View style={[styles.howCard, { backgroundColor: cb, borderColor: cbr }]}>
              {[
                { num: '1', text: t('communityAffirmation.jak_1', 'Codziennie wspólnota wybiera najsilniejszą afirmację.') },
                { num: '2', text: t('communityAffirmation.jak_2', 'Głosuj i potwierdzaj afirmację swoją energią.') },
                { num: '3', text: t('communityAffirmation.jak_3', 'Twórz własne i wyślij do globalnego głosowania.') },
              ].map(s => (
                <View key={s.num} style={styles.howRow}>
                  <View style={[styles.howNum, { backgroundColor: ACCENT + '22' }]}>
                    <Text style={[styles.howNumText, { color: ACCENT }]}>{s.num}</Text>
                  </View>
                  <Text style={[styles.howText, { color: tc }]}>{s.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Community Total + live stats strip */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { icon: Users, label: t('communityAffirmation.dzis_glosuje', 'Dziś głosuje'), value: (votes + 8341).toLocaleString() },
                { icon: TrendingUp, label: t('communityAffirmation.lacznie', 'Łącznie'), value: '47 892' },
                { icon: Flame, label: 'Twoja seria', value: `${streak} dni` },
              ].map(({ icon: Icon, label, value }) => (
                <View key={label} style={{ flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', backgroundColor: cb, borderColor: cbr }}>
                  <Icon color={ACCENT} size={16} strokeWidth={1.5} />
                  <Text style={{ color: ACCENT, fontSize: 14, fontWeight: '800', marginTop: 4 }}>{value}</Text>
                  <Text style={{ color: sc, fontSize: 9, marginTop: 2, textAlign: 'center' }}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* My proposals */}
          {myProposals.length > 0 && (
            <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.moje_propozycje', 'MOJE PROPOZYCJE')}</Text>
              <View style={{ gap: 8 }}>
                {myProposals.map((p, i) => (
                  <Animated.View key={i} entering={FadeInDown} style={[styles.archiveCard, { backgroundColor: ACCENT + '10', borderColor: ACCENT + '33' }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 13, lineHeight: 20, color: tc }]}>{p.text}</Text>
                      <Text style={[{ fontSize: 11, color: ACCENT, marginTop: 4, fontWeight: '600' }]}>{p.status} · {p.votes} głosów</Text>
                    </View>
                    <Sparkles color={ACCENT} size={16} />
                  </Animated.View>
                ))}
              </View>
            </View>
          )}

          {/* CO DALEJ */}
          <View style={{ paddingHorizontal: layout.padding.screen, marginTop: 20 }}>
            <Text style={[styles.sectionTitle, { color: sc }]}>{t('communityAffirmation.co_dalej', '✦ CO DALEJ?')}</Text>
            {[
              { label: t('communityAffirmation.afirmacje_ai', 'Afirmacje AI'), sub: t('communityAffirmation.wygeneruj_swoja_unikalna', 'Wygeneruj swoją unikalną'), color: '#818CF8', route: 'AIDailyAffirmations' },
              { label: t('communityAffirmation.czat_wspolnoty', 'Czat wspólnoty'), sub: t('communityAffirmation.podziel_sie_refleksja', 'Podziel się refleksją'), color: '#EC4899', route: 'CommunityChatScreen' },
              { label: t('communityAffirmation.dziennik_duszy', 'Dziennik duszy'), sub: t('communityAffirmation.zapisz_co_czujesz', 'Zapisz co czujesz'), color: ACCENT, route: 'Journal' },
            ].map(item => (
              <Pressable key={item.label} onPress={() => { try { navigation.navigate(item.route); } catch (_) {} HapticsService.impact('light'); }}
                style={[styles.archiveCard, { borderColor: item.color + '33', backgroundColor: cb, marginBottom: 8 }]}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: item.color + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles color={item.color} size={16} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: tc, fontSize: 14, fontWeight: '700' }}>{item.label}</Text>
                  <Text style={{ color: sc, fontSize: 11 }}>{item.sub}</Text>
                </View>
                <ArrowRight color={sc} size={16} />
              </Pressable>
            ))}
          </View>

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingVertical: 12 },
  backBtn: { width: 38, height: 38, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginTop: 1 },
  heroCard: { borderRadius: 20, padding: 24, alignItems: 'center' },
  heroLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 12 },
  heroText: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 30 },
  heroVotes: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 12 },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5 },
  voteBtnText: { fontSize: 16, fontWeight: '700' },
  reactionRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginTop: 16 },
  reactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  reactionCount: { fontSize: 14, fontWeight: '600' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
  copyText: { fontSize: 14, fontWeight: '600' },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  shuffleText: { fontSize: 14, fontWeight: '600' },
  shuffledCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 10, alignItems: 'center' },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, marginTop: 12 },
  streakText: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  weekCard: { width: 120, padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  weekDate: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  weekText: { fontSize: 12, lineHeight: 18 },
  weekVotes: { fontSize: 11 },
  weekReactionBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 8 },
  weekHeroCard: { borderRadius: 16, padding: 20, alignItems: 'center' },
  weekHeroLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  weekHeroText: { color: '#fff', fontSize: 17, fontWeight: '700', textAlign: 'center' },
  weekHeroVotes: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 8 },
  archiveCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  archiveVoteBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10 },
  proposalCard: { padding: 14, borderRadius: 14, borderWidth: 1 },
  proposalInput: { fontSize: 14, lineHeight: 22, minHeight: 64, textAlignVertical: 'top' },
  proposalBtn: { marginTop: 10, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  proposalBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  howCard: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  howRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howNum: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  howNumText: { fontSize: 13, fontWeight: '800' },
  howText: { flex: 1, fontSize: 13, lineHeight: 20 },
  totalText: { fontSize: 13, textAlign: 'center' },
});
