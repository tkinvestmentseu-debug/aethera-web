$ErrorActionPreference = "Stop"
function Replace-OrFail {
  param([string]$Path,[string]$Old,[string]$New)
  $content = Get-Content -Raw -LiteralPath $Path
  if (-not $content.Contains($Old)) { throw "Pattern not found in $Path" }
  $updated = $content.Replace($Old,$New)
  Set-Content -LiteralPath $Path -Value $updated -Encoding utf8
}

Replace-OrFail 'D:\Soulverse\src\screens\TarotScreen.tsx' @"
          <Pressable style={ts.inlineGuide} onPress={() => aiAvailable
            ? navigation.navigate('OracleChat', { context: `Przygotowuje sie do interpretacji spreadu ${selectedSpreadMeta?.name}.`, source: 'tarot_reading', forceNewSession: true, sessionKind: 'integration', initialMode: 'mystical' })
            : navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'tarot' })}>
            <Typography variant="microLabel" color={ACCENT}>{aiAvailable ? 'Zapytaj przewodnika tarota AI' : 'Zapisz intencję przed odczytem'}</Typography>
          </Pressable>
"@ @"
          <Pressable
            style={ts.inlineGuide}
            onPress={() =>
              navigation.navigate('JournalEntry', {
                prompt: `Rozkład ${selectedSpreadMeta?.name} jest już odsłonięty. Która karta najmocniej domaga się interpretacji i jakie pytanie naprawdę otwiera ten odczyt?`,
                type: 'tarot',
              })
            }
          >
            <Typography variant="microLabel" color={ACCENT}>Zapisz intencję przed odczytem</Typography>
          </Pressable>
"@

Replace-OrFail 'D:\Soulverse\src\screens\PartnerTarotScreen.tsx' @"
          <GlassCard highlight style={styles.aiCard} onPress={() => aiAvailable ? navigation.navigate('OracleChat', {
            source: 'partner_tarot',
            sessionKind: 'integration',
            initialMode: 'mystical',
            context: `Chcę przygotować tarot relacyjny dla mnie i ${partnerName.trim() || 'drugiej osoby'}. Interesuje mnie ${selectedMode.title.toLowerCase()}. Pytanie: ${question || 'Pokaż, co najważniejsze w tej więzi.'}`,
            forceNewSession: true,
          }) : navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'reflection' })}>
            <Sparkles color={currentTheme.primary} size={18} />
            <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginLeft: 10 }}>
              Specjalista tarota relacyjnego AI
            </Typography>
          </GlassCard>
"@ @"
          <GlassCard
            highlight
            style={styles.aiCard}
            onPress={() =>
              navigation.navigate('JournalEntry', {
                prompt: `Tarot relacyjny dla mnie i ${partnerName.trim() || 'drugiej osoby'}. Tryb: ${selectedMode.title}. Pytanie przewodnie: ${question || 'Pokaż, co najważniejsze w tej więzi.'}\n\nCo w tej relacji najbardziej domaga się rozmowy, granicy albo czułości?`,
                type: 'reflection',
              })
            }
          >
            <Sparkles color={currentTheme.primary} size={18} />
            <Typography variant="premiumLabel" color={currentTheme.primary} style={{ marginLeft: 10 }}>
              Dziennik po tarocie relacyjnym
            </Typography>
          </GlassCard>
"@

Replace-OrFail 'D:\Soulverse\src\screens\ReportsScreen.tsx' @"
      action: aiAvailable ? 'Zapytaj Oracle o wzór' : 'Zapisz wzór w dzienniku',
      onPress: () => aiAvailable ? navigation.navigate('OracleChat', {
        source: 'reports', sessionKind: 'integration', initialMode: 'direct', context: `Pomóż mi zrozumieć wzór, który wraca w moich wpisach i nastrojach. Dominująca energia: ${weeklyInsight.dominantMood}.`, forceNewSession: true,
      }) : navigation.navigate('JournalEntry', { type: 'reflection', prompt: `Dominująca energia to ${weeklyInsight.dominantMood}. Co naprawdę wraca w moich wpisach i nastrojach?` }),
"@ @"
      action: 'Zapisz wzór w dzienniku',
      onPress: () => navigation.navigate('JournalEntry', {
        type: 'reflection',
        prompt: `Dominująca energia to ${weeklyInsight.dominantMood}. Co naprawdę wraca w moich wpisach, nastrojach i decyzjach z ostatnich dni?`,
      }),
"@
Replace-OrFail 'D:\Soulverse\src\screens\ReportsScreen.tsx' @"
  }, [aiAvailable, navigation, stats.reflectionCount, stats.tarotCount, stats.total, weeklyInsight.averageEnergy, weeklyInsight.dominantMood]);
"@ @"
  }, [navigation, stats.reflectionCount, stats.tarotCount, stats.total, weeklyInsight.averageEnergy, weeklyInsight.dominantMood]);
"@

Replace-OrFail 'D:\Soulverse\src\screens\JourneysScreen.tsx' @"
    'deep-integration':   { screen: 'OracleChat', params: { sessionKind: 'integration', source: 'journey', forceNewSession: true, initialMode: 'therapeutic' } },
"@ @"
    'deep-integration':   { screen: 'JournalEntry', params: { type: 'reflection', prompt: 'Który etap tej podróży naprawdę domaga się dziś integracji i co ma zostać nazwane bez ucieczki w ogólniki?' } },
"@
Replace-OrFail 'D:\Soulverse\src\screens\JourneysScreen.tsx' @"
    'oracle-path':        { screen: 'OracleChat', params: { sessionKind: 'general', source: 'journey', forceNewSession: true } },
"@ @"
    'oracle-path':        { screen: 'JournalEntry', params: { type: 'reflection', prompt: 'Jakiej odpowiedzi naprawdę szukam w tej podróży i co już teraz wiem, ale jeszcze tego nie nazywam?' } },
"@
Replace-OrFail 'D:\Soulverse\src\screens\JourneysScreen.tsx' @"
      // Fallback do najbardziej sensownego ekranu
      navigation.navigate('OracleChat', {
        sessionKind: 'integration',
        source: 'journey',
        forceNewSession: true,
        context: journey.title + ': ' + (journey.description || ''),
        initialMode: 'ceremonial',
      });
"@ @"
      navigation.navigate('JournalEntry', {
        type: 'reflection',
        prompt: `${journey.title}: ${journey.description || ''}\n\nJaki jest następny prawdziwy krok w tej podróży i co chcę z niej wynieść do codzienności?`,
      });
"@

Replace-OrFail 'D:\Soulverse\src\screens\JournalScreen.tsx' @"
                      <Pressable style={[styles.quickActionPill, { borderColor: currentTheme.primary + '22', backgroundColor: currentTheme.primary + '08' }]} onPress={() => aiAvailable ? navigation.navigate('OracleChat', { context: personalizedPrompt, source: 'journal', forceNewSession: true, sessionKind: 'integration', initialMode: 'therapeutic' }) : navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'reflection' })}>
                        <Search color={currentTheme.primary} size={14} />
                        <Typography variant="microLabel" color={currentTheme.primary} style={{ marginLeft: 8 }}>{aiAvailable ? 'AI refleksji' : 'Fallback'}</Typography>
                      </Pressable>
"@ @"
                      <Pressable
                        style={[styles.quickActionPill, { borderColor: currentTheme.primary + '22', backgroundColor: currentTheme.primary + '08' }]}
                        onPress={() => navigation.navigate('JournalEntry', { prompt: personalizedPrompt, type: 'reflection' })}
                      >
                        <Search color={currentTheme.primary} size={14} />
                        <Typography variant="microLabel" color={currentTheme.primary} style={{ marginLeft: 8 }}>Otwórz w dzienniku</Typography>
                      </Pressable>
"@

Replace-OrFail 'D:\Soulverse\src\screens\CompatibilityScreen.tsx' @"
                          onPress={() => aiAvailable
                            ? navigation.navigate('OracleChat', {
                                source: 'compatibility',
                                sessionKind: 'integration',
                                initialMode: 'gentle',
                                context: `Analizuję zgodność z osobą o imieniu ${sessionPartner?.name}. Wspólne centrum relacji daje ${compatibility.center}, oś relacji ${compatibility.right}, energia działania ${compatibility.top}, lekcja ${compatibility.bottom}. Odpowiedz na pytanie: ${question}`,
                                forceNewSession: true,
                              })
                            : navigation.navigate('JournalEntry', { prompt: `${question}\n\n${aiState.fallbackPrompt}`, type: 'reflection' })}
"@ @"
                          onPress={() =>
                            navigation.navigate('JournalEntry', {
                              prompt: `Analizuję zgodność z osobą o imieniu ${sessionPartner?.name}. Wspólne centrum relacji daje ${compatibility.center}, oś relacji ${compatibility.right}, energia działania ${compatibility.top}, lekcja ${compatibility.bottom}.\n\n${question}`,
                              type: 'reflection',
                            })
                          }
"@

Replace-OrFail 'D:\Soulverse\src\screens\ChineseHoroscopeScreen.tsx' @"
                      title: aiAvailable ? 'Przewodnik chińskiego znaku AI' : 'Zapisz trop z żywiołu',
                      copy: aiAvailable ? 'Zapytaj przewodnika, jak Twój żywioł i znak przekładają się dziś na decyzje, relacje i rytm działania.' : 'Warstwa Oracle jest chwilowo poza zasięgiem. Zachowaj najważniejszą wskazówkę z tego żywiołu i wróć do niej później.',
                      onPress: () => aiAvailable ? navigation.navigate('OracleChat', {
                        source: 'chinese_astrology',
                        sessionKind: 'integration',
                        initialMode: 'mystical',
                        context: `${activeName} ma chiński znak ${SIGN_LABELS[sign.id]}, a żywioł to ${ELEMENT_LABELS[sign.element]}. Pomóż zrozumieć, jak wykorzystać tę energię dzisiaj.`,
                        forceNewSession: true,
                      }) : navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'reflection' }),
"@ @"
                      title: 'Zapisz trop z żywiołu',
                      copy: 'Zachowaj najważniejszą wskazówkę ze znaku i żywiołu, a potem wróć do niej przy kolejnej decyzji albo rozmowie.',
                      onPress: () => navigation.navigate('JournalEntry', {
                        prompt: `${activeName} ma chiński znak ${SIGN_LABELS[sign.id]}, a żywioł to ${ELEMENT_LABELS[sign.element]}. Jak najlepiej wykorzystać tę energię dzisiaj w decyzjach, relacjach i rytmie działania?`,
                        type: 'reflection',
                      }),
"@

Replace-OrFail 'D:\Soulverse\src\screens\CleansingScreen.tsx' @"
          <Pressable
            style={[cs.aiCta, { position: 'absolute', bottom: keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + 16, left: 16, right: 16, zIndex: 20, elevation: 20, backgroundColor: isLight ? 'rgba(240,255,250,0.97)' : 'rgba(10,30,20,0.95)' }]}
            onPress={() => aiAvailable
              ? navigation.navigate('OracleChat', { source: 'cleansing', sessionKind: 'crisis', initialMode: 'therapeutic', context: `Chcę puścić: ${activeBurden.label}. ${story || 'Potrzebuję prowadzenia do oczyszczenia i przywrócenia jasności.'}`, forceNewSession: true })
              : navigation.navigate('JournalEntry', { prompt: aiState.fallbackPrompt, type: 'reflection' })}
          >
"@ @"
          <Pressable
            style={[cs.aiCta, { position: 'absolute', bottom: keyboardHeight > 0 ? keyboardHeight + 8 : insets.bottom + 16, left: 16, right: 16, zIndex: 20, elevation: 20, backgroundColor: isLight ? 'rgba(240,255,250,0.97)' : 'rgba(10,30,20,0.95)' }]}
            onPress={() =>
              navigation.navigate('JournalEntry', {
                prompt: `Chcę puścić: ${activeBurden.label}. ${story || 'Potrzebuję prowadzenia do oczyszczenia i przywrócenia jasności.'}\n\nJaki rytuał uwolnienia naprawdę pomoże mi domknąć ten ciężar i wrócić do klarowności?`,
                type: 'reflection',
              })
            }
          >
"@
Replace-OrFail 'D:\Soulverse\src\screens\CleansingScreen.tsx' @"
              <Typography variant="premiumLabel" color={ACCENT}>AI Przewodnik Oczyszczania</Typography>
              <Typography variant="bodySmall" style={cs.aiCtaCopy}>Zapytaj o rytuał uwolnienia, pracę z ciężarem karmicznym, ochronę lub domknięcie przywiązania.</Typography>
"@ @"
              <Typography variant="premiumLabel" color={ACCENT}>Zapisz rytuał uwolnienia</Typography>
              <Typography variant="bodySmall" style={cs.aiCtaCopy}>Domknij oczyszczanie w dzienniku: ciężar, intencja, ochrona i ostatni ruch przywracający jasność.</Typography>
"@

Write-Host 'done'
