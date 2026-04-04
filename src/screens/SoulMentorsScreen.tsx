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
  withSequence, FadeInDown, FadeIn,
} from 'react-native-reanimated';
import {
  ChevronLeft, Crown, Star, Video, Search, X, Check,
  MessageCircle, Clock, Users, Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const { width: SW } = Dimensions.get('window');
const ACCENT = '#60A5FA';
const textColor = '#E8E0FF';
const subColor = 'rgba(232,224,255,0.55)';
const cardBg = 'rgba(255,255,255,0.05)';
const cardBorder = 'rgba(255,255,255,0.10)';

const SPECIALIZATIONS = ['Wszystko', 'Tarot', 'Numerologia', 'Astrologia', 'Medytacja', 'Reiki', 'Jungowski'];

const MENTORS = [
  { id: 1, name: 'Mira Voss', specialty: 'Tarot & Numerologia', rating: 4.97, sessions: 430, price: 120,
    online: true, color: '#7C3AED', tags: ['Tarot', 'Numerologia'],
    bio: 'Mistrzyni kart i liczb z 12-letnim doświadczeniem. Specjalizuje się w interpretacji ścieżki życiowej i misji duszy. Łączy Tarot z numerologią pytajforsky dla holistycznego wglądu.',
    times: ['Pon 18:00', 'Śr 19:00', 'Pt 17:00', 'Sob 10:00'] },
  { id: 2, name: 'Lev Kiran', specialty: 'Astrologia Wedyjska', rating: 4.95, sessions: 312, price: 150,
    online: false, color: '#0EA5E9', tags: ['Astrologia'],
    bio: 'Astro-terapeuta z Bombaju. Specjalista osi karmy i dharmy w systemie Jyotish. Jego sesje łączą medytację z analizą wykresu urodzenia.',
    times: ['Wt 16:00', 'Czw 18:00', 'Sob 12:00'] },
  { id: 3, name: 'Sera Moth', specialty: 'Praca z Cieniem', rating: 4.98, sessions: 198, price: 180,
    online: true, color: '#EC4899', tags: ['Jungowski'],
    bio: 'Jungowska terapeutka cienia i głębokiej transformacji. Autorka metody "Cień jako Dar". Prowadzi intensywne sesje integracji i uwalniania.',
    times: ['Pon 20:00', 'Śr 18:00', 'Nd 11:00'] },
  { id: 4, name: 'Aria Chen', specialty: 'Reiki & Energia', rating: 4.93, sessions: 567, price: 90,
    online: true, color: '#34D399', tags: ['Reiki', 'Medytacja'],
    bio: 'Mistrzyni Reiki stopnia 3. Specjalizuje się w uzdrawianiu poprzez kanały energetyczne i balansowanie czakr. Prowadzi grupowe kręgi uzdrawiania.',
    times: ['Codziennie 9:00-17:00'] },
  { id: 5, name: 'Orion Black', specialty: 'Numerologia Kabalistyczna', rating: 4.91, sessions: 244, price: 130,
    online: false, color: '#FBBF24', tags: ['Numerologia'],
    bio: 'Ekspert numerologii kabalistycznej i gematryi. Odkrywa ukryte kody w imionach, datach i wydarzeniach życiowych.',
    times: ['Wt 17:00', 'Czw 19:00', 'Sob 14:00'] },
  { id: 6, name: 'Luna Sylvie', specialty: 'Medytacja & Mindfulness', rating: 4.96, sessions: 891, price: 80,
    online: true, color: '#A78BFA', tags: ['Medytacja'],
    bio: 'Certyfikowana instruktorka medytacji z 15 lat praktyki. Prowadzi regularne grupy medytacyjne i indywidualne sesje dla osób w kryzysie.',
    times: ['Pon-Pt 7:00', 'Sob-Nd 8:00'] },
  { id: 7, name: 'Sol Martinez', specialty: 'Czytanie Aury', rating: 4.89, sessions: 156, price: 110,
    online: true, color: '#F97316', tags: ['Reiki', 'Medytacja'],
    bio: 'Widzące i terapeuta energetyczny. Odczytuje pola aury i identyfikuje blokady energetyczne przez wgląd intuicyjny i pracę z kryształami.',
    times: ['Śr 18:00', 'Pt 19:00', 'Sob 13:00'] },
  { id: 8, name: 'Vera Kali', specialty: 'Astrologia Ewolucyjna', rating: 4.94, sessions: 378, price: 160,
    online: false, color: '#818CF8', tags: ['Astrologia'],
    bio: 'Specjalistka astrologii ewolucyjnej i reinkarnacyjnej. Analizuje węzły Księżyca jako mapę karmy i potencjału duszy.',
    times: ['Wt 19:00', 'Czw 17:00', 'Nd 15:00'] },
];

const REVIEWS = [
  { author: 'Anna K.', mentor: 'Mira Voss', text: 'Sesja z Mirą zmieniła moje rozumienie siebie. Karty powiedziały mi to, czego sama się bałam usłyszeć — ale potrzebowałam.' },
  { author: 'Marek P.', mentor: 'Lev Kiran', text: 'Lev zobaczył we mnie coś, czego nie widziałem sam. Jego mapowanie karmy otworzyło zupełnie nową perspektywę.' },
  { author: 'Zofia R.', mentor: 'Sera Moth', text: 'Praca z cieniem z Serą to nie terapia — to inicjacja. Trudna, ale głęboko uwalniająca.' },
];

export const SoulMentorsScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeSpec, setActiveSpec] = useState('Wszystko');
  const [search, setSearch] = useState('');
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [bookedTime, setBookedTime] = useState(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const glowAnim = useSharedValue(0.6);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowAnim.value }));
  useEffect(() => {
    glowAnim.value = withRepeat(withSequence(withTiming(1, { duration: 1800 }), withTiming(0.6, { duration: 1800 })), -1, false);
  }, []);

  const filteredMentors = MENTORS.filter(m => {
    const matchSpec = activeSpec === 'Wszystko' || m.tags.includes(activeSpec);
    const matchSearch = search === '' || m.name.toLowerCase().includes(search.toLowerCase()) || m.specialty.toLowerCase().includes(search.toLowerCase());
    return matchSpec && matchSearch;
  });

  const featuredMentor = MENTORS.find(m => m.id === 3);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MENTORZY DUSZY</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

          {/* Featured mentor */}
          <Animated.View entering={FadeInDown.duration(600)} style={{ paddingHorizontal: 22, marginBottom: 20 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>MENTOR TYGODNIA</Text>
            <TouchableOpacity onPress={() => setSelectedMentor(featuredMentor)}>
              <LinearGradient
                colors={[featuredMentor.color + '30', featuredMentor.color + '10', 'transparent']}
                style={{ borderRadius: 20, padding: 20, borderWidth: 1, borderColor: featuredMentor.color + '50', overflow: 'hidden' }}
              >
                <Animated.View style={[{ position: 'absolute', top: -20, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: featuredMentor.color + '15' }, glowStyle]} />
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: featuredMentor.color + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: featuredMentor.color + '60' }}>
                    <Text style={{ color: featuredMentor.color, fontSize: 20, fontWeight: '800' }}>{featuredMentor.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: textColor, fontSize: 17, fontWeight: '700' }}>{featuredMentor.name}</Text>
                    <Text style={{ color: featuredMentor.color, fontSize: 12, marginTop: 2 }}>{featuredMentor.specialty}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Star size={12} color="#FBBF24" fill="#FBBF24" />
                      <Text style={{ color: '#FBBF24', fontSize: 12, fontWeight: '700' }}>{featuredMentor.rating}</Text>
                      <Text style={{ color: subColor, fontSize: 12 }}> · {featuredMentor.sessions} sesji</Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: '#10B981' + '20', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>● ONLINE</Text>
                    </View>
                    <Text style={{ color: textColor, fontSize: 16, fontWeight: '800', marginTop: 8 }}>{featuredMentor.price} zł</Text>
                    <Text style={{ color: subColor, fontSize: 10 }}>/sesję</Text>
                  </View>
                </View>
                <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginTop: 12 }} numberOfLines={2}>{featuredMentor.bio}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <View style={{ flex: 1, backgroundColor: featuredMentor.color + '20', borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                    <Video size={16} color={featuredMentor.color} />
                    <Text style={{ color: featuredMentor.color, fontSize: 11, fontWeight: '600', marginTop: 4 }}>Sesja video</Text>
                  </View>
                  <View style={{ flex: 1, backgroundColor: cardBg, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: cardBorder }}>
                    <MessageCircle size={16} color={ACCENT} />
                    <Text style={{ color: ACCENT, fontSize: 11, fontWeight: '600', marginTop: 4 }}>Wiadomość</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Search */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ paddingHorizontal: 22, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: cardBg, borderRadius: 14, borderWidth: 1, borderColor: cardBorder, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Search size={16} color={subColor} />
              <TextInput value={search} onChangeText={setSearch} placeholder="Szukaj mentora..."
                placeholderTextColor={subColor} style={{ flex: 1, color: textColor, fontSize: 14 }} />
            </View>
          </Animated.View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 22, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8, paddingRight: 22 }}>
              {SPECIALIZATIONS.map(s => (
                <TouchableOpacity key={s} onPress={() => setActiveSpec(s)}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: activeSpec === s ? ACCENT + '25' : cardBg, borderWidth: 1, borderColor: activeSpec === s ? ACCENT + '70' : cardBorder }}>
                  <Text style={{ color: activeSpec === s ? ACCENT : subColor, fontSize: 12, fontWeight: '600' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Mentor list */}
          <View style={{ paddingHorizontal: 22, gap: 10 }}>
            {filteredMentors.map((mentor, i) => (
              <Animated.View key={mentor.id} entering={FadeInDown.delay(i * 60).duration(500)}>
                <TouchableOpacity onPress={() => setSelectedMentor(mentor)}>
                  <LinearGradient colors={[mentor.color + '15', 'transparent']}
                    style={{ borderRadius: 16, padding: 14, borderWidth: 1, borderColor: mentor.color + '30', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: mentor.color + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: mentor.color + '50' }}>
                      <Text style={{ color: mentor.color, fontSize: 16, fontWeight: '800' }}>{mentor.name[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: textColor, fontSize: 14, fontWeight: '700' }}>{mentor.name}</Text>
                        {mentor.online && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981' }} />}
                      </View>
                      <Text style={{ color: subColor, fontSize: 12 }}>{mentor.specialty}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Star size={11} color="#FBBF24" fill="#FBBF24" />
                        <Text style={{ color: '#FBBF24', fontSize: 11, fontWeight: '700' }}>{mentor.rating}</Text>
                        <Text style={{ color: subColor, fontSize: 11 }}>· {mentor.sessions} sesji</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: textColor, fontSize: 15, fontWeight: '800' }}>{mentor.price} zł</Text>
                      <Text style={{ color: subColor, fontSize: 10 }}>/sesję</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Reviews */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={{ paddingHorizontal: 22, marginTop: 28 }}>
            <Text style={{ color: ACCENT, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 12 }}>OPINIE UCZESTNIKÓW</Text>
            <View style={{ gap: 10 }}>
              {REVIEWS.map((r, i) => (
                <View key={i} style={{ backgroundColor: cardBg, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: cardBorder }}>
                  <Text style={{ color: textColor, fontSize: 13, lineHeight: 20, marginBottom: 8 }}>"{r.text}"</Text>
                  <Text style={{ color: subColor, fontSize: 11 }}>{r.author} · sesja z {r.mentor}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Become mentor */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ paddingHorizontal: 22, marginTop: 24 }}>
            <TouchableOpacity onPress={() => setShowApplyModal(true)}>
              <LinearGradient colors={['rgba(96,165,250,0.15)', 'rgba(96,165,250,0.05)']}
                style={{ borderRadius: 16, padding: 18, borderWidth: 1, borderColor: ACCENT + '40', alignItems: 'center' }}>
                <Crown size={24} color={ACCENT} style={{ marginBottom: 8 }} />
                <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>Zostań Mentorem Duszy</Text>
                <Text style={{ color: subColor, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                  Dziel się swoją wiedzą i prowadź innych na ich ścieżce. Aplikuj i dołącz do naszej społeczności mistrzów.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Mentor Detail Modal */}
      <Modal visible={!!selectedMentor} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <ScrollView style={{ maxHeight: '85%', backgroundColor: '#12101E', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <View style={{ padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
                <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>{selectedMentor?.name}</Text>
                <TouchableOpacity onPress={() => { setSelectedMentor(null); setBookedTime(null); setBookingConfirmed(false); }}>
                  <X size={20} color={subColor} />
                </TouchableOpacity>
              </View>
              {selectedMentor && (
                <>
                  <Text style={{ color: selectedMentor.color, fontSize: 13, marginBottom: 8 }}>{selectedMentor.specialty}</Text>
                  <Text style={{ color: subColor, fontSize: 13, lineHeight: 21, marginBottom: 16 }}>{selectedMentor.bio}</Text>
                  <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 10 }}>DOSTĘPNE TERMINY</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {selectedMentor.times.map(t => (
                      <TouchableOpacity key={t} onPress={() => setBookedTime(t)}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, backgroundColor: bookedTime === t ? ACCENT + '30' : cardBg, borderWidth: 1, borderColor: bookedTime === t ? ACCENT + '70' : cardBorder }}>
                        <Text style={{ color: bookedTime === t ? ACCENT : subColor, fontSize: 12 }}>{t}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {bookingConfirmed ? (
                    <View style={{ backgroundColor: '#10B981' + '20', borderRadius: 14, padding: 16, alignItems: 'center' }}>
                      <Check size={24} color="#10B981" />
                      <Text style={{ color: '#10B981', fontWeight: '700', fontSize: 15, marginTop: 8 }}>Sesja zarezerwowana!</Text>
                      <Text style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{bookedTime}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => bookedTime && setBookingConfirmed(true)}
                      style={{ backgroundColor: bookedTime ? selectedMentor.color : 'rgba(255,255,255,0.1)', borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
                      <Text style={{ color: bookedTime ? '#fff' : subColor, fontWeight: '700', fontSize: 15 }}>
                        {bookedTime ? `Umów sesję · ${selectedMentor.price} zł` : 'Wybierz termin'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Apply Modal */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#12101E', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>Aplikuj jako Mentor</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <X size={20} color={subColor} />
              </TouchableOpacity>
            </View>
            <Text style={{ color: subColor, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
              Twoja aplikacja zostanie rozpatrzona przez zespół Aethery. Poszukujemy doświadczonych praktykantów z potwierdzonym doświadczeniem.
            </Text>
            <TouchableOpacity
              onPress={() => setShowApplyModal(false)}
              style={{ backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Wyślij zgłoszenie</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07050F' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingVertical: 14 },
  headerTitle: { color: textColor, fontSize: 13, fontWeight: '800', letterSpacing: 2 },
});
