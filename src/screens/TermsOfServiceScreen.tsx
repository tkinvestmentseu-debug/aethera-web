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
    title: '§1 Postanowienia ogólne',
    body: `Niniejszy Regulamin określa zasady korzystania z aplikacji mobilnej Aethera (dalej: „Aplikacja"), dostępnej na platformach iOS i Android.

Operatorem Aplikacji jest [Firma] z siedzibą na terytorium Rzeczypospolitej Polskiej (dalej: „Operator").

Kontakt z Operatorem możliwy jest pod adresem e-mail: contact@aethera.pl.

Korzystanie z Aplikacji oznacza akceptację niniejszego Regulaminu w całości. Jeśli nie zgadzasz się z jego treścią, prosimy o zaprzestanie korzystania z Aplikacji.`,
  },
  {
    title: '§2 Rejestracja i konto',
    body: `Korzystanie z pełnej funkcjonalności Aplikacji wymaga założenia konta. Rejestracja odbywa się za pomocą adresu e-mail oraz hasła.

Użytkownik musi mieć ukończone 18 lat. Osoby niepełnoletnie mogą korzystać z Aplikacji wyłącznie za zgodą rodzica lub opiekuna prawnego.

Użytkownik jest odpowiedzialny za bezpieczeństwo swojego hasła i zobowiązuje się do nieudostępniania danych logowania osobom trzecim. O wszelkich naruszeniach bezpieczeństwa konta należy niezwłocznie powiadomić Operatora.

Operator zastrzega sobie prawo do zablokowania konta w przypadku naruszenia Regulaminu.`,
  },
  {
    title: '§3 Subskrypcja Premium',
    body: `Aplikacja oferuje płatną subskrypcję Premium w następujących planach:
• Miesięczny — odnawia się automatycznie co miesiąc
• Roczny — odnawia się automatycznie co rok
• Dożywotni — jednorazowa płatność, dostęp bezterminowy

Płatności są obsługiwane przez platformę dystrybucji (App Store firmy Apple lub Google Play firmy Google) zgodnie z ich regulaminami. Operator nie przetwarza bezpośrednio danych płatniczych.

Po aktywacji subskrypcji lub zakupie dostępu dożywotniego nie przysługuje zwrot środków, chyba że stanowi tak obowiązujące prawo lub regulamin właściwego sklepu.

Anulowanie subskrypcji należy przeprowadzić za pomocą ustawień konta w App Store lub Google Play przed końcem bieżącego okresu rozliczeniowego.`,
  },
  {
    title: '§4 Prawa autorskie',
    body: `Wszelkie treści zawarte w Aplikacji, w tym między innymi teksty, grafiki, animacje, dźwięki, kod źródłowy, logotypy oraz inne materiały, są chronione prawem autorskim i stanowią własność intelektualną Operatora lub są wykorzystywane na podstawie stosownych licencji.

Użytkownik nie ma prawa do reprodukowania, kopiowania, modyfikowania, dystrybucji ani dalszego udostępniania treści Aplikacji bez uprzedniej pisemnej zgody Operatora.

Użytkownik może korzystać z Aplikacji wyłącznie na własny, niekomercyjny użytek.`,
  },
  {
    title: '§5 Odpowiedzialność',
    body: `Aplikacja Aethera jest narzędziem wspierającym osobisty rozwój duchowy i dobrostan psychiczny. Treści generowane przez Aplikację mają charakter wyłącznie informacyjny i inspiracyjny.

Aplikacja nie zastępuje i nie może być traktowana jako substytut profesjonalnych porad medycznych, psychologicznych, prawnych ani finansowych. W przypadku problemów zdrowotnych lub innych poważnych kwestii życiowych należy skonsultować się z odpowiednim specjalistą.

Operator nie ponosi odpowiedzialności za decyzje podjęte przez użytkownika na podstawie treści Aplikacji. Korzystasz z niej na własną odpowiedzialność.`,
  },
  {
    title: '§6 Prywatność',
    body: `Dane osobowe użytkowników są przetwarzane zgodnie z Polityką Prywatności dostępną w Aplikacji oraz z przepisami Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 (RODO).

W zakresie infrastruktury technicznej Operator korzysta z usług podmiotów przetwarzających dane w jego imieniu:
• Google Firebase — uwierzytelnianie i przechowywanie danych (procesor danych)
• Google LLC — usługi chmurowe

Szczegółowe informacje dotyczące zbieranych danych, celów przetwarzania i praw użytkowników znajdziesz w Polityce Prywatności.`,
  },
  {
    title: '§7 Zmiany regulaminu',
    body: `Operator zastrzega sobie prawo do wprowadzania zmian w niniejszym Regulaminie.

O każdej istotnej zmianie użytkownicy zostaną powiadomieni z wyprzedzeniem co najmniej 14 dni, za pośrednictwem wiadomości e-mail wysłanej na adres podany podczas rejestracji oraz poprzez stosowne powiadomienie w Aplikacji.

Dalsze korzystanie z Aplikacji po upływie wskazanego terminu oznacza akceptację nowej wersji Regulaminu. Jeśli nie akceptujesz zmian, masz prawo do usunięcia konta przed wejściem zmian w życie.`,
  },
  {
    title: '§8 Postanowienia końcowe',
    body: `Niniejszy Regulamin podlega prawu polskiemu.

Wszelkie spory wynikające z korzystania z Aplikacji lub związane z niniejszym Regulaminem będą rozstrzygane przez sąd właściwy miejscowo dla siedziby Operatora, tj. sąd w Warszawie, chyba że przepisy bezwzględnie obowiązujące stanowią inaczej (w szczególności w odniesieniu do konsumentów).

W sprawach nieuregulowanych niniejszym Regulaminem stosuje się przepisy powszechnie obowiązującego prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.

Jeśli masz pytania dotyczące niniejszego Regulaminu, skontaktuj się z nami: contact@aethera.pl`,
  },
];

export const TermsOfServiceScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrToMainTab(navigation, 'Portal')} style={styles.backBtn}>
            <ChevronLeft color={ACCENT} size={22} strokeWidth={2} />
          </Pressable>
          <Text style={styles.headerTitle}>{t('termsOfService.regulamin', 'REGULAMIN')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <Text style={styles.intro}>
            {t('termsOfService.aplikacja_mobilna_aethera_warunki_korzystani', 'Aplikacja mobilna Aethera — warunki korzystania z usługi.')}
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
            {t('termsOfService.wersja_10_obowiazuje_od_1', 'Wersja 1.0 — Obowiązuje od 1 maja 2026')}
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
