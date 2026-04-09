// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Dimensions, Modal, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming,
  withSequence, FadeInDown,
} from 'react-native-reanimated';
import {
  ChevronLeft, Moon, Star, Calendar, Users, Zap,
  X, Check, Clock, Globe2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../core/i18n';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { MusicToggleButton } from '../components/MusicToggleButton';
import { useTheme } from '../core/hooks/useTheme';
const { width: SW } = Dimensions.get('window');
const ACCENT = '#F59E0B';

const PORTALS = [
  { id: 1, name: 'Pełnia Księżyca w Wadze', date: '13 Kwi 2026', daysLeft: 13, participants: 3420, color: '#818CF8',
    type: 'KSIĘŻYCOWY', Icon: Moon, active: false,
    desc: 'Portal harmonii, relacji i piękna. Czas uwalniania emocjonalnych blokad i otwierania się na miłość.',
    amplifies: ['Miłość', 'Równowaga', 'Piękno', 'Relacje', 'Kreatywność'] },
  { id: 2, name: 'Portal Numeryczny 4:4:4', date: '4 Kwi 2026', daysLeft: 4, participants: 8901, color: '#FBBF24',
    type: 'NUMERYCZNY', Icon: Star, active: true,
    desc: 'Aktywna brama amplifikacji. Liczba 4 rezonuje z fundamentami, ziemią i budowaniem trwałych struktur.',
    amplifies: ['Manifestacja', 'Stabilność', 'Fundament', 'Praca', 'Cierpliwość'] },
  { id: 3, name: 'Portal Lwa 8:8', date: '8 Sie 2026', daysLeft: 130, participants: 15234, color: '#DC2626',
    type: 'SOLARNY', Icon: Zap, active: false,
    desc: 'Najpotężniejszy portal roku. Aktywacja DNA i linii Syriusza. Czas manifestacji, mocy i duchowej integracji.',
    amplifies: ['Moc', 'Manifestacja', 'Aktywacja DNA', 'Obfitość', 'Przeznaczenie'] },
  { id: 4, name: 'Przesilenie Letnie', date: '21 Cze 2026', daysLeft: 82, participants: 6789, color: '#F97316',
    type: 'SOLARNY', Icon: Star, active: false,
    desc: 'Najdłuższy dzień roku. Kulminacja energii słonecznej i punkt szczytu manifestacji.',
    amplifies: ['Energia', 'Radość', 'Dobrostan', 'Cel', 'Siła woli'] },
  { id: 5, name: 'Nów Księżyca w Bliźniętach', date: '27 Maj 2026', daysLeft: 57, participants: 2341, color: '#10B981',
    type: 'KSIĘŻYCOWY', Icon: Moon, active: false,
    desc: 'Portal nowych początków i komunikacji. Idealna chwila na sadzenie nowych intencji.',
    amplifies: ['Nowe początki', 'Komunikacja', 'Intencje', 'Nauka', 'Zmiana'] },
];

const CEREMONY_SCHEDULE = [
  { time: '19:00', name: 'Medytacja Otwarcia', host: 'Luna Sylvie', joined: 234 },
  { time: '20:00', name: 'Krąg Intencji', host: 'Mira Voss', joined: 189 },
  { time: '21:00', name: 'Zbiorowa Wizualizacja', host: 'Orion Black', joined: 312 },
  { time: '22:00', name: 'Rytuał Zamknięcia', host: 'Seria Moth', joined: 156 },
];

const MY_PORTALS = [
  { name: 'Nów Księżyca w Byku', date: '30 Sty 2026', energy: '+32%' },
  { name: 'Portal 11:11', date: '11 Lis 2025', energy: '+67%' },
];

export const CosmicPortalsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

    const themeName = useAppStore(s => s.themeName);
  const userData = useAppStore(s => s.userData);
  const { currentTheme, isLight } = useTheme();
  const textColor = isLight ? '#1C1008' : '#E8E0FF';
  const subColor = isLight ? 'rgba(28,16,8,0.55)' : 'rgba(232,224,255,0.55)';
  const cardBg = isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(139,100,42,0.35)' : 'rgba(255,255,255,0.10)';
  const [joined, setJoined] = useState({ 2: true });
  const [accessCode, setAccessCode] = useState('');
  const [codeSubmitted, setCodeSubmitted] = useState(false);
  const [selectedPortal, setSelectedPortal] = useState(null);

  const pulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0.4);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseAnim.value }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowAnim.value }));

  useEffect(() => {
    pulseAnim.value = withRepeat(withSequence(withTiming(1.08, { duration: 1500 }), withTiming(0.96, { duration: 1500 })), -1, false);
    glowAnim.value = withRepeat(withSequence(withTiming(0.9, { duration: 2000 }), withTiming(0.4, { duration: 2000 })), -1, false);
  }, []);

  const activePortal = PORTALS.find(p => p.active);

  return (
<View style={{ flex: 1, backgroundColor: currentTheme.background }}>
  <SafeAreaView style={[styles.container, {}]} edges={['top']}>

      <LinearGradient
        colors={isLight ? ['#FAF5FF', '#EDE9FE', '#F5F0FF'] : ['#07050F', '#0F0828', '#150A30']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBackOrToMainTab(navigation, 'Portal')}>
          <ChevronLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>{t('cosmicPortals.portale_kosmiczne', 'PORTALE KOSMICZNE')}</Text>
        <MusicToggleButton color={ACCENT} size={19} />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Active portal hero */}
          {activePortal && (
            <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 22, marginBottom: 24 }}>
              <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>● {t('cosmicPortals.aktywny_teraz', 'AKTYWNY TERAZ')}</Text>
              <TouchableOpacity onPress={() => setSelectedPortal(activePortal)}>
                <LinearGradient colors={[activePortal.color + '35', activePortal.color + '15', 'rgba(255,255,255,0.02)']}
                  style={{ borderRadius: 22, padding: 22, borderWidth: 2, borderColor: activePortal.color + '60', overflow: 'hidden' }}>
                  <Animated.View style={[{ position: 'absolute', top: 20, right: 20, width: 100, height: 100, borderRadius: 50, backgroundColor: activePortal.color + '20' }, glowStyle]} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <Animated.View style={[{
                      width: 54, height: 54, borderRadius: 27,
                      backgroundColor: activePortal.color + '30',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 2, borderColor: activePortal.color,
                    }, pulseStyle]}>
                      <activePortal.Icon size={24} color={activePortal.color} />
                    </Animated.View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: activePortal.color, fontSize: 9, fontWeight: '700', letterSpacing: 2 }}>{activePortal.type}</Text>
                      <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginTop: 2 }}>{activePortal.name}</Text>
                    </View>
                  </View>
                  <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 14 }}>{activePortal.desc}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    {[
                      { width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981' },
                      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FBBF24', marginLeft: -6 },
                      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#818CF8', marginLeft: -6 },
                      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F472B6', marginLeft: -6 },
                      { width: 12, height: 12, borderRadius: 6, backgroundColor: '#60A5FA', marginLeft: -6 },
                    ].map((s, i) => <View key={i} style={s} />)}
                    <Text style={{ color: subColor, fontSize: 12, marginLeft: 4 }}>
                      {t('cosmicPortals.i_conj', 'i')} {(activePortal.participants - 5).toLocaleString()} {t('cosmicPortals.innych_w_portalu', 'innych w portalu')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setJoined(j => ({ ...j, [activePortal.id]: !j[activePortal.id] }))}
                    style={{ backgroundColor: joined[activePortal.id] ? activePortal.color + '30' : activePortal.color, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ color: joined[activePortal.id] ? activePortal.color : '#fff', fontWeight: '700', fontSize: 14 }}>
                      {joined[activePortal.id] ? t('cosmicPortals.dolaczyles_as', '✓ Dołączyłeś/aś do portalu') : t('cosmicPortals.wejdz_do_portalu', 'Wejdź do portalu')}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Ceremony schedule */}
          <Animated.View entering={FadeInDown.delay(150).duration(600)} style={{ paddingHorizontal: 22, marginBottom: 24 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>{t('cosmicPortals.ceremonie_dzis', 'CEREMONIE DZIŚ')}</Text>
            <View style={{ gap: 8 }}>
              {CEREMONY_SCHEDULE.map((c, i) => (
                <LinearGradient key={i} colors={['rgba(245,158,11,0.08)', 'transparent']}
                  style={{ borderRadius: 14, padding: 14, borderWidth: 1, borderColor: ACCENT + '25', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ backgroundColor: ACCENT + '20', borderRadius: 10, padding: 8 }}>
                    <Clock size={14} color={ACCENT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{c.name}</Text>
                    <Text style={{ color: subColor, fontSize: 11 }}>{c.time} · {t('cosmicPortals.prowadzi', 'prowadzi')} {c.host}</Text>
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: ACCENT, fontSize: 13, fontWeight: '700' }}>{c.joined}</Text>
                    <Text style={{ color: subColor, fontSize: 9 }}>{t('cosmicPortals.osob', 'osób')}</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          </Animated.View>

          {/* All portals */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={{ paddingHorizontal: 22, marginBottom: 24 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>{t('cosmicPortals.wszystkie_portale', 'WSZYSTKIE PORTALE')}</Text>
            <View style={{ gap: 10 }}>
              {PORTALS.map((portal, i) => (
                <TouchableOpacity key={portal.id} onPress={() => setSelectedPortal(portal)}>
                  <LinearGradient colors={[portal.color + '15', 'transparent']}
                    style={{ borderRadius: 16, padding: 14, borderWidth: 1, borderColor: portal.color + '30', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: portal.color + '25', alignItems: 'center', justifyContent: 'center' }}>
                      <portal.Icon size={20} color={portal.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{portal.name}</Text>
                      <Text style={{ color: subColor, fontSize: 11 }}>{portal.date} · {portal.participants.toLocaleString()} {t('cosmicPortals.uczestnikow', 'uczestników')}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: portal.color, fontSize: 12, fontWeight: '700' }}>{portal.daysLeft}d</Text>
                      {portal.active && (
                        <View style={{ backgroundColor: '#10B981' + '20', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
                          <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '700' }}>{t('cosmicPortals.aktywny', 'AKTYWNY')}</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Sacred access code */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ paddingHorizontal: 22, marginBottom: 24 }}>
            <LinearGradient colors={['rgba(245,158,11,0.12)', 'transparent']}
              style={{ borderRadius: 16, padding: 18, borderWidth: 1, borderColor: ACCENT + '35' }}>
              <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>{t('cosmicPortals.kod_aktywacyjny', 'KOD AKTYWACYJNY')}</Text>
              <Text style={{ color: subColor, fontSize: 12, lineHeight: 18, marginBottom: 14 }}>
                {t('cosmicPortals.posiadasz_specjalny_kod', 'Posiadasz specjalny kod od mentora? Wprowadź go, aby odblokować portal o wyższej energii.')}
              </Text>
              {codeSubmitted ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Check size={18} color="#10B981" />
                  <Text style={{ color: '#10B981', fontWeight: '600' }}>{t('cosmicPortals.kod_aktywowany', 'Kod aktywowany — portal odblokowany')}</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput value={accessCode} onChangeText={setAccessCode}
                    placeholder={t('cosmicPortals.aethera_xxxx', 'AETHERA-XXXX')} placeholderTextColor={subColor}
                    style={{ flex: 1, color: textColor, backgroundColor: cardBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: cardBorder, letterSpacing: 1 }} />
                  <TouchableOpacity onPress={() => accessCode.length > 3 && setCodeSubmitted(true)}
                    style={{ backgroundColor: ACCENT, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* My portals */}
          <Animated.View entering={FadeInDown.delay(350).duration(600)} style={{ paddingHorizontal: 22 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>{t('cosmicPortals.moje_portale', 'MOJE PORTALE')}</Text>
            <View style={{ gap: 8 }}>
              {MY_PORTALS.map((p, i) => (
                <View key={i} style={{ backgroundColor: cardBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: cardBorder, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>{p.name}</Text>
                    <Text style={{ color: subColor, fontSize: 11 }}>{p.date}</Text>
                  </View>
                  <View style={{ backgroundColor: '#10B981' + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>↑ {p.energy}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Portal Detail Modal */}
      <Modal visible={!!selectedPortal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ maxHeight: '80%', backgroundColor: isLight ? '#FFFFFF' : '#12101E', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            {selectedPortal && (
              <View style={{ padding: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <Text style={{ color: selectedPortal.color, fontSize: 10, fontWeight: '700', letterSpacing: 2 }}>{selectedPortal.type}</Text>
                  <TouchableOpacity onPress={() => setSelectedPortal(null)}>
                    <X size={20} color={subColor} />
                  </TouchableOpacity>
                </View>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>{selectedPortal.name}</Text>
                <Text style={{ color: subColor, fontSize: 13, lineHeight: 21, marginBottom: 16 }}>{selectedPortal.desc}</Text>
                <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>{t('cosmicPortals.co_wzmacnia_ten_portal', 'CO WZMACNIA TEN PORTAL')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {selectedPortal.amplifies.map(a => (
                    <View key={a} style={{ backgroundColor: selectedPortal.color + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: selectedPortal.color + '40' }}>
                      <Text style={{ color: selectedPortal.color, fontSize: 12, fontWeight: '600' }}>{a}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={() => { setJoined(j => ({ ...j, [selectedPortal.id]: !j[selectedPortal.id] })); setSelectedPortal(null); }}
                  style={{ backgroundColor: selectedPortal.color, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>
                    {joined[selectedPortal.id] ? t('cosmicPortals.opusc_portal', 'Opuść portal') : `${t('cosmicPortals.wejdz_do_portalu', 'Wejdź do portalu')} · ${selectedPortal.participants.toLocaleString()} ${t('cosmicPortals.uczestnikow', 'uczestników')}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
        </SafeAreaView>
</View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  headerTitle: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
