// @ts-nocheck
import React, { useState, useCallback, useRef } from 'react';
import { getLocaleCode } from '../core/utils/localeFormat';
import {
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { ChevronLeft, Star, Sparkles, Moon, Sun, Telescope, Save, Trash2, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { getResolvedTheme } from '../core/theme/tokens';
import { layout } from '../core/theme/designSystem';
import { useAppStore } from '../store/useAppStore';
import { EndOfContentSpacer } from '../components/EndOfContentSpacer';
import { goBackOrToMainTab } from '../navigation/navigationFallbacks';
import { HapticsService } from '../core/services/haptics.service';
import { AiService } from '../core/services/ai.service';
import { MusicToggleButton } from '../components/MusicToggleButton';

const ACCENT = '#818CF8';
const ACCENT2 = '#C084FC';

const NOTE_TEMPLATES = [
  { id: 'transit',    icon: '🪐', label: 'Tranzyt',     placeholder: 'Jaki tranzyt dziś obserwuję? Co czuję w swoim ciele i emocjach?' },
  { id: 'eclipse',    icon: '🌑', label: 'Zaćmienie',   placeholder: 'Co zaćmienie aktywuje w moim natalu? Jakie tematy się pojawiają?' },
  { id: 'retrograde', icon: '↩️', label: 'Retrograde',  placeholder: 'Który planet w retrogradzie? Co przeglądam i rewiduję w życiu?' },
  { id: 'new-moon',   icon: '🌒', label: 'Nów Księżyca', placeholder: 'W którym znaku Nów? Jaka intencja na ten cykl?' },
  { id: 'full-moon',  icon: '🌕', label: 'Pełnia',       placeholder: 'Co dojrzewa i kończy się w tym miejscu mojego życia?' },
  { id: 'free',       icon: '✦',  label: 'Wolna notatka', placeholder: 'Twoje obserwacje astrologiczne, wzorce, intuicje...' },
];

const ASTRO_PROMPTS = [
  'Jaki planeta tranzytuje mój Ascendent w tym tygodniu?',
  'Co aktualna faza Księżyca aktywuje w moim natalu?',
  'Jakie wzorce widzę w ostatnich 30 dniach?',
  'Które domy są teraz szczególnie aktywne?',
  'Jaki aspekt natalny rezonuje z tym co przeżywam?',
];

export const AstroNoteScreen = ({ navigation }: any) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { themeName, userData, astroNotes, addAstroNote, deleteAstroNote, addFavoriteItem, isFavoriteItem, removeFavoriteItem } = useAppStore();
  const currentTheme = getResolvedTheme(themeName, userData?.preferences?.colorScheme);
  const isDark = !currentTheme.background.startsWith('#F');
  const isLight = !isDark;
  const textColor = isLight ? '#1A0A2E' : '#EDE9FE';
  const subColor = isLight ? 'rgba(26,10,46,0.5)' : 'rgba(237,233,254,0.5)';
  const cardBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)';
  const cardBorder = isLight ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)';

  const [selectedTemplate, setSelectedTemplate] = useState('free');
  const [noteText, setNoteText] = useState('');
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  // savedNotes moved to store as astroNotes
  const [activeTab, setActiveTab] = useState<'write' | 'notes'>('write');
  const scrollRef = useRef<ScrollView>(null);

  const template = NOTE_TEMPLATES.find(t => t.id === selectedTemplate) || NOTE_TEMPLATES[5];
  const zodiac = (userData?.zodiacSign || 'aries');

  const saveNote = useCallback(() => {
    if (!noteText.trim()) return;
    HapticsService.notify();
    const newNote = {
      id: Date.now().toString(),
      template: template.label,
      text: noteText.trim(),
      date: new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    addAstroNote({ id: `note_${Date.now()}`, template: template.label, text: noteText.trim(), date: new Date().toLocaleDateString(getLocaleCode(), { day: 'numeric', month: 'short', year: 'numeric' }) });
    setNoteText('');
    setAiInsight('');
    setActiveTab('notes');
  }, [noteText, template, addAstroNote]);

  const deleteNote = useCallback((id: string) => {
    HapticsService.impact('light');
    deleteAstroNote(id);
  }, []);

  const getAiInsight = useCallback(async () => {
    if (!noteText.trim()) return;
    setAiLoading(true);
    setAiInsight('');
    try {
      const prompt = `Jesteś astrologiem z głęboką wiedzą o astrologii psychologicznej i ewolucyjnej.

Znak zodiaku użytkownika: ${zodiac}.
Typ notatki: ${template.label}.
Notatka: "${noteText}"

Daj krótką, głęboką interpretację astrologiczną (3-4 zdania). Pisz bezpośrednio do osoby, w języku użytkownika. Unikaj ogólników — bądź konkretny i celny. Zakończ jednym pytaniem do refleksji.`;

      const result = await AiService.chatWithOracle([{ role: 'user', content: prompt }]);
      setAiInsight(result);
    } catch {
      setAiInsight('Gwiazdy milczą tej nocy. Twoja intuicja zna odpowiedź.');
    }
    setAiLoading(false);
  }, [noteText, template, zodiac]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: currentTheme.background }} edges={['top']}>
      <LinearGradient
        colors={isDark ? ['#0B0818', '#10082A', '#160A35'] : ['#F5F3FF', '#EDE9FE', '#F9F7FF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => goBackOrToMainTab(navigation, 'Stars')} style={styles.backBtn}>
          <ChevronLeft size={22} color={textColor} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: subColor, fontSize: 10, letterSpacing: 2 }}>NOTATKI ASTRO</Text>
          <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>Dziennik Nieba</Text>
        </View>
        <MusicToggleButton color={ACCENT} size={19} />
        <Pressable style={[styles.starBtn, { borderColor: ACCENT + '40', backgroundColor: ACCENT + '10' }]} hitSlop={12} onPress={() => { HapticsService.impact('light'); if (isFavoriteItem('astro-note')) { removeFavoriteItem('astro-note'); } else { addFavoriteItem({ id: 'astro-note', label: 'Dziennik Nieba', route: 'AstroNote', params: {}, icon: 'Telescope', color: ACCENT, addedAt: new Date().toISOString() }); } }}>
          <Star size={17} color={isFavoriteItem('astro-note') ? ACCENT : subColor} strokeWidth={1.8} fill={isFavoriteItem('astro-note') ? ACCENT : 'none'} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['write', 'notes'] as const).map(tab => {
          const active = activeTab === tab;
          return (
            <Pressable key={tab} onPress={() => { HapticsService.impactLight(); setActiveTab(tab); }}
              style={[styles.tabChip, active && { backgroundColor: ACCENT, borderColor: ACCENT }]}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : subColor }}>
                {tab === 'write' ? '✦ Pisz' : `📚 Notatki (${astroNotes.length})`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: layout.padding.screen, paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'write' && (
            <>
              {/* Template selector */}
              <Animated.View entering={FadeInDown.duration(400)}>
                <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 10, marginTop: 4 }}>TYP NOTATKI</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {NOTE_TEMPLATES.map(t => {
                      const active = selectedTemplate === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => { HapticsService.impactLight(); setSelectedTemplate(t.id); }}
                          style={[styles.templateChip, { borderColor: active ? ACCENT : cardBorder, backgroundColor: active ? ACCENT + '18' : cardBg }]}
                        >
                          <Text style={{ fontSize: 16 }}>{t.icon}</Text>
                          <Text style={{ color: active ? ACCENT : subColor, fontSize: 11, fontWeight: '600', marginTop: 3 }}>{t.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </Animated.View>

              {/* Write area */}
              <Animated.View entering={FadeInDown.delay(100).duration(400)}>
                <View style={[styles.writeCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <Text style={{ fontSize: 20 }}>{template.icon}</Text>
                    <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }}>{template.label.toUpperCase()}</Text>
                  </View>
                  <TextInput
                    value={noteText}
                    onChangeText={setNoteText}
                    placeholder={template.placeholder}
                    placeholderTextColor={subColor + '88'}
                    multiline
                    style={{ color: textColor, fontSize: 15, lineHeight: 24, minHeight: 120 }}
                    textAlignVertical="top"
                  />
                </View>
              </Animated.View>

              {/* Quick prompts */}
              <Animated.View entering={FadeInDown.delay(150).duration(400)}>
                <Text style={{ color: subColor, fontSize: 11, letterSpacing: 1.5, marginBottom: 8, marginTop: 16 }}>PYTANIA DO REFLEKSJI</Text>
                {ASTRO_PROMPTS.map((prompt, i) => (
                  <Pressable
                    key={i}
                    onPress={() => { setNoteText(prev => prev ? prev + '\n\n' + prompt : prompt); HapticsService.impactLight(); }}
                    style={[styles.promptRow, { backgroundColor: cardBg, borderColor: ACCENT + '20' }]}
                  >
                    <Text style={{ color: ACCENT, fontSize: 14, marginRight: 8 }}>✦</Text>
                    <Text style={{ flex: 1, color: subColor, fontSize: 13, lineHeight: 20 }}>{prompt}</Text>
                    <Plus size={14} color={ACCENT} opacity={0.6} />
                  </Pressable>
                ))}
              </Animated.View>

              {/* AI Insight */}
              <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 16 }}>
                <Pressable
                  onPress={getAiInsight}
                  disabled={aiLoading || !noteText.trim()}
                  style={[styles.aiBtn, { backgroundColor: aiLoading ? ACCENT + '40' : ACCENT, opacity: !noteText.trim() ? 0.4 : 1 }]}
                >
                  <Telescope size={16} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
                    {aiLoading ? 'Interpretuję...' : 'Interpretacja AI'}
                  </Text>
                </Pressable>

                {!!aiInsight && (
                  <Animated.View entering={FadeIn.duration(400)}>
                    <View style={[styles.insightCard, { backgroundColor: ACCENT + '0C', borderColor: ACCENT + '30' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Sparkles size={14} color={ACCENT} />
                        <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>INTERPRETACJA</Text>
                      </View>
                      <Text style={{ color: textColor, fontSize: 14, lineHeight: 22, fontStyle: 'italic' }}>{aiInsight}</Text>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>

              {/* Save button */}
              <Animated.View entering={FadeInDown.delay(250).duration(400)} style={{ marginTop: 16 }}>
                <Pressable
                  onPress={saveNote}
                  disabled={!noteText.trim()}
                  style={[styles.saveBtn, { borderColor: ACCENT2 + '50', backgroundColor: ACCENT2 + '12', opacity: !noteText.trim() ? 0.4 : 1 }]}
                >
                  <Save size={16} color={ACCENT2} />
                  <Text style={{ color: ACCENT2, fontSize: 14, fontWeight: '700' }}>Zapisz notatkę</Text>
                </Pressable>
              </Animated.View>
            </>
          )}

          {activeTab === 'notes' && (
            <>
              {astroNotes.length === 0 ? (
                <Animated.View entering={FadeInDown.duration(400)} style={[styles.emptyCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={{ fontSize: 40, marginBottom: 12 }}>🔭</Text>
                  <Text style={{ color: textColor, fontSize: 16, fontWeight: '700', marginBottom: 6 }}>Brak notatek</Text>
                  <Text style={{ color: subColor, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                    Twoje obserwacje nieba pojawią się tutaj.{'\n'}Zacznij pisać na karcie "Pisz".
                  </Text>
                </Animated.View>
              ) : (
                astroNotes.map((note, i) => (
                  <Animated.View key={note.id} entering={FadeInDown.delay(i * 60).duration(400)}>
                    <View style={[styles.noteCard, { backgroundColor: cardBg, borderColor: ACCENT + '28' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <View style={[styles.noteTypeBadge, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '30' }]}>
                            <Text style={{ color: ACCENT, fontSize: 10, fontWeight: '700' }}>{note.template}</Text>
                          </View>
                          <Text style={{ color: subColor, fontSize: 11 }}>{note.date}</Text>
                        </View>
                        <Pressable onPress={() => deleteNote(note.id)} hitSlop={10}>
                          <Trash2 size={14} color="#EF4444" opacity={0.7} />
                        </Pressable>
                      </View>
                      <Text style={{ color: textColor, fontSize: 14, lineHeight: 22 }} numberOfLines={4}>{note.text}</Text>
                    </View>
                  </Animated.View>
                ))
              )}
            </>
          )}

          <EndOfContentSpacer />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: layout.padding.screen, paddingBottom: 12, gap: 10, paddingTop: 4 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  starBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.padding.screen, marginBottom: 4 },
  tabChip: { flex: 1, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(129,140,248,0.25)', backgroundColor: 'rgba(129,140,248,0.06)', alignItems: 'center' },
  templateChip: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', minWidth: 72 },
  writeCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 4 },
  promptRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  aiBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 14, marginBottom: 12 },
  insightCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  emptyCard: { borderRadius: 20, borderWidth: 1, padding: 32, alignItems: 'center', marginTop: 40 },
  noteCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  noteTypeBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
});