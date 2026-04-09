// @ts-nocheck
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';

const isLight = false;
  const { t } = useTranslation();

const BG = '#07080E';
const ACCENT = '#A78BFA';
const CARD_BG = 'rgba(255,255,255,0.04)';
const SECTION_TITLE_COLOR = ACCENT;
const BODY_COLOR = 'rgba(255,255,255,0.75)';

const SECTIONS = [
  {
    title: '1. Administrator danych',
    body: `Administratorem Twoich danych osobowych jest [Firma] z siedzibą na terytorium Rzeczypospolitej Polskiej.

Kontakt z Administratorem: contact@aethera.pl

Administrator zobowiązuje się do przetwarzania Twoich danych osobowych zgodnie z obowiązującymi przepisami prawa, w szczególności z Rozporządzeniem Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. (RODO).`,
  },
  {
    title: '2. Zbierane dane',
    body: `W trakcie korzystania z Aplikacji możemy zbierać i przetwarzać następujące kategorie danych:

• Dane identyfikacyjne: adres e-mail (wymagany), imię lub pseudonim (opcjonalne)
• Dane profilu duchowego: data urodzenia, znak zodiaku, preferencje duchowe, wybrane treści
• Historia aktywności: sesje Oracle, wpisy dziennika, ukończone rytuały, medytacje, postępy
• Dane techniczne: informacje o urządzeniu, system operacyjny, wersja Aplikacji, logi błędów

Dane zbierane są wyłącznie w zakresie niezbędnym do świadczenia usług Aplikacji.`,
  },
  {
    title: '3. Cel przetwarzania',
    body: `Twoje dane osobowe przetwarzamy w następujących celach:

• Świadczenie usług: umożliwienie korzystania z funkcji Aplikacji, tworzenie i zarządzanie kontem
• Personalizacja: dostosowanie treści, horoskopów i rekomendacji do Twojego profilu
• Powiadomienia push: wysyłanie przypomnień i aktualności (wyłącznie po wyrażeniu zgody)
• Bezpieczeństwo: ochrona kont użytkowników, wykrywanie nadużyć i nieautoryzowanego dostępu
• Doskonalenie usługi: analiza anonimowych wzorców użytkowania w celu poprawy jakości Aplikacji`,
  },
  {
    title: '4. Podstawa prawna',
    body: `Przetwarzanie Twoich danych opiera się na następujących podstawach prawnych zgodnie z RODO:

• Art. 6 ust. 1 lit. b RODO — wykonanie umowy (świadczenie usług Aplikacji, obsługa konta)
• Art. 6 ust. 1 lit. f RODO — uzasadniony interes Administratora (bezpieczeństwo, wykrywanie nadużyć, doskonalenie usług)
• Art. 6 ust. 1 lit. a RODO — zgoda użytkownika (powiadomienia push, marketing — w przypadku wyrażenia zgody)`,
  },
  {
    title: '5. Procesory danych',
    body: `W celu świadczenia usług korzystamy z usług następujących podmiotów przetwarzających dane w naszym imieniu:

• Google Firebase (Auth, Firestore, Storage) — uwierzytelnianie użytkowników, przechowywanie danych profilu i historii aktywności
• OpenAI — generowanie treści przez funkcje Oracle/AI; dane przesyłane są w formie zanonimizowanej, bez danych identyfikujących użytkownika
• Expo (Expo Push Notifications) — obsługa powiadomień push na urządzeniach mobilnych

Wszystkie podmioty przetwarzające działają na podstawie stosownych umów powierzenia przetwarzania danych i zapewniają odpowiedni poziom ochrony danych.`,
  },
  {
    title: '6. Przekazywanie danych',
    body: `Twoje dane osobowe nie są sprzedawane, wynajmowane ani udostępniane podmiotom trzecim w celach marketingowych.

Dane mogą być przekazywane do państw trzecich (poza Europejski Obszar Gospodarczy) wyłącznie w związku z korzystaniem z usług Google Firebase, których serwery mogą być zlokalizowane w USA lub innych krajach. Przekazywanie odbywa się na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską oraz innych mechanizmów zapewniających odpowiedni poziom ochrony danych (Privacy Shield / Data Privacy Framework).`,
  },
  {
    title: '7. Prawa użytkownika',
    body: `Jako osoba, której dane dotyczą, przysługują Ci następujące prawa:

• Prawo dostępu — możesz zażądać informacji o tym, jakie Twoje dane przetwarzamy
• Prawo do sprostowania — możesz żądać poprawienia nieprawidłowych lub uzupełnienia niekompletnych danych
• Prawo do usunięcia — możesz zażądać trwałego usunięcia swoich danych (prawo do bycia zapomnianym)
• Prawo do przenoszenia — możesz otrzymać swoje dane w ustrukturyzowanym, powszechnie używanym formacie
• Prawo do sprzeciwu — możesz sprzeciwić się przetwarzaniu na podstawie uzasadnionego interesu
• Prawo do ograniczenia przetwarzania — możesz żądać ograniczenia przetwarzania Twoich danych

Aby skorzystać z powyższych praw, skontaktuj się z nami: contact@aethera.pl`,
  },
  {
    title: '8. Usunięcie konta',
    body: `Możesz usunąć swoje konto i wszystkie powiązane dane w dowolnym momencie:

• W Aplikacji: Profil → Konto → Usuń konto
• Przez e-mail: wyślij prośbę na contact@aethera.pl

Usunięcie danych zostanie przeprowadzone w ciągu 30 dni od zgłoszenia. Po tym czasie wszystkie dane identyfikujące użytkownika zostaną trwale usunięte z naszych systemów, z wyjątkiem danych, których przechowywanie nakazują przepisy prawa (np. dane transakcyjne przez okres wymagany przepisami podatkowymi).`,
  },
  {
    title: '9. Cookies i tracking',
    body: `Aplikacja mobilna Aethera nie korzysta z tradycyjnych plików cookies. Stosujemy jednak następujące narzędzia analityczne:

• Firebase Analytics — zbiera anonimowe dane o korzystaniu z Aplikacji (np. ekrany, funkcje, czas sesji) w celu doskonalenia usługi. Dane są zanonimizowane i nie pozwalają na identyfikację konkretnego użytkownika.

Możesz wyłączyć zbieranie danych analitycznych w ustawieniach Aplikacji: Profil → Ustawienia → Prywatność.`,
  },
  {
    title: '10. Kontakt',
    body: `W razie pytań, wątpliwości lub chęci skorzystania ze swoich praw związanych z ochroną danych osobowych, skontaktuj się z nami:

E-mail: contact@aethera.pl

Zobowiązujemy się do odpowiedzi na każde zapytanie w ciągu 72 godzin w dni robocze.

Masz również prawo do wniesienia skargi do organu nadzorczego — Prezesa Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa, jeśli uważasz, że przetwarzamy Twoje dane niezgodnie z przepisami.`,
  },
];

export const PrivacyPolicyScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
            <ChevronLeft color={ACCENT} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('privacyPolicy.polityka_prywatnosc', 'POLITYKA PRYWATNOŚCI')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <Text style={styles.intro}>
            {t('privacyPolicy.twoja_prywatnosc_jest_dla_nas', 'Twoja prywatność jest dla nas priorytetem. Poniżej znajdziesz pełne informacje o tym, jak zbieramy i chronimy Twoje dane.')}
          </Text>

          {/* Sections */}
          {SECTIONS.map((section, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionBody}>{section.body}</Text>
            </View>
          ))}

          {/* Version */}
          <Text style={styles.version}>
            {t('privacyPolicy.wersja_10_obowiazuje_od_1', 'Wersja 1.0 — Obowiązuje od 1 maja 2026')}
          </Text>

          <EndOfContentSpacer size="standard" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(167,139,250,0.15)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(167,139,250,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    color: ACCENT,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 20,
  },
  intro: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.50)',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.12)',
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: SECTION_TITLE_COLOR,
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  sectionBody: {
    fontSize: 14,
    color: BODY_COLOR,
    lineHeight: 24,
  },
  version: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.30)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
});
