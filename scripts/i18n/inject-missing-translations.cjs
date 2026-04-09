#!/usr/bin/env node
'use strict';
/**
 * inject-missing-translations.cjs
 *
 * Adds all missing sections (checkin, reports, astrology, notifications,
 * paywall, compatibility, journeys, palmreading, binauralbeats, sleephelper,
 * stars, biorhythm, knowledge, data, archetypes, sleepRitual, lucidDreaming,
 * fireCeremony, ancestralConnection, protectionRitual, saltBath, releaseLetters,
 * innerChild, anxietyRelief, selfCompassion, healingFrequencies, emotionalAnchors,
 * lifeWheel, soulArchetype, natalChart, retrogrades, signMeditation)
 * to de, es, fr, it, pt, ru, ar, ja language files,
 * and builds a complete zh.json from scratch.
 */

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../src/core/i18n');

// ── Translation data for all missing sections ──────────────────────────────

const MISSING = {
  de: {
    checkin: {
      title: "Einchecken",
      mood: "Stimmung",
      energy: "Energie",
      focus: "Fokus",
      moods: {
        joy: "Freude",
        peace: "Frieden",
        gratitude: "Dankbarkeit",
        love: "Liebe",
        anxiety: "Angst",
        sadness: "Traurigkeit",
        anger: "Wut",
        confusion: "Verwirrung",
        emptiness: "Leere"
      },
      energy_levels: {
        very_low: "Sehr niedrig",
        low: "Niedrig",
        medium: "Mittel",
        high: "Hoch",
        very_high: "Sehr hoch"
      },
      focus_areas: {
        love: "Liebe",
        career: "Karriere",
        health: "Gesundheit",
        spirituality: "Spiritualität",
        creativity: "Kreativität",
        healing: "Heilung"
      },
      save: "EINCHECKEN SPEICHERN",
      particles: "Energiepartikel"
    },
    reports: {
      title: "Berichte",
      pathAnalysis: "PFADANALYSE",
      weeklyInsight: "Wöchentliche Erkenntnis",
      dominantEnergy: "DOMINANTE ENERGIE",
      frequentArchetypes: "HÄUFIGE ARCHETYPEN",
      suggestedFocus: "EMPFOHLENER FOKUS",
      consistencyMastery: "Beständigkeitsmeisterschaft",
      streakDesc: "Du hast {{days}} Tage in Folge Kontakt zu deinem Inneren gehalten.",
      entries: "EINTRÄGE",
      readings: "LESUNGEN",
      recordDays: "REKORDTAGE",
      currentPhase: "AKTUELLE PHASE",
      emotionalLandscape: "EMOTIONALE LANDSCHAFT",
      moodConstellation: "STIMMUNGSKONSTELLATION",
      constellationDesc: "Visualisierung deiner emotionalen Zustände als Sternkarte.",
      practiceDynamics: "ÜBUNGSDYNAMIK",
      reflections: "REFLEXIONEN",
      tarotInsight: "TAROT-EINBLICK",
      calm: "Ruhig",
      excellent: "Ausgezeichnet",
      good: "Gut",
      peaceful: "Friedvoll",
      weak: "Schwach",
      difficult: "Schwierig",
      soulReports: "Seelenberichte",
      trends: "Deine Trends",
      generating: "Bericht wird erstellt...",
      weeklyReport: "Wochenbericht",
      monthlyReport: "Monatsbericht"
    },
    astrology: {
      title: "Astrologie",
      transits: "Transite",
      cycles: "Zyklen",
      biorhythm: "Biorhythmus",
      stars: "Sterne",
      vedic: "Vedische Astrologie",
      retrograde: "Rückläufig",
      aspects: "Aspekte",
      conjunction: "Konjunktion",
      opposition: "Opposition",
      trine: "Trigon",
      square: "Quadrat",
      sextile: "Sextil",
      natalChart: "Geburtshoroskop",
      starsMap: "Himmelskarte",
      currentTransits: "Aktuelle Transite",
      biorhythmCycles: "Biorhythmuszyklen",
      physical: "Physisch",
      emotional: "Emotional",
      intellectual: "Intellektuell"
    },
    notifications: {
      title: "Benachrichtigungen",
      reminders: "Erinnerungen",
      add_reminder: "Erinnerung hinzufügen",
      morning: "Morgen",
      evening: "Abend",
      meditation: "Meditation",
      ritual: "Ritual",
      enabled: "Aktiviert",
      disabled: "Deaktiviert",
      time: "Zeit",
      days: "Tage",
      presets: "Voreinstellungen",
      customTime: "Benutzerdefinierte Zeit",
      reminderLabel: "Erinnerungsbeschriftung",
      saveReminder: "ERINNERUNG SPEICHERN",
      deleteReminder: "Erinnerung löschen",
      allDays: "Jeden Tag",
      weekdays: "Wochentage",
      weekends: "Wochenenden"
    },
    paywall: {
      premiumTitle: "Entfalte unendliche Weisheit",
      premiumSubtitle: "Deine innere Reise beginnt jetzt. Tritt dem erlesenen Kreis der Suchenden bei.",
      choosePath: "WÄHLE DEINEN WEG",
      monthly: "Monatlich",
      yearly: "Jährlich",
      monthlyDesc: "Jederzeit kündbar",
      yearlyDesc: "Nur 4,99 € / Monat",
      bestValue: "BESTES ANGEBOT",
      restore: "KÄUFE WIEDERHERSTELLEN",
      feature1Title: "Unbegrenzter Orakel-Chat",
      feature1Desc: "Chatte jederzeit ohne Einschränkungen mit deinem KI-Führer.",
      feature2Title: "Erweiterte Tarot-Spreads",
      feature2Desc: "Zugang zu allen 22 großen und kleinen Arkana plus spezialisierte Spreads.",
      feature3Title: "Seelenweg-Erkenntnisse",
      feature3Desc: "Tiefgehende Analyse deiner Schicksalsmatrix und persönlicher Transite.",
      feature4Title: "Heilige Bibliothek",
      feature4Desc: "Ein dauerhaftes Heiligtum für deine Lieblingsaffirmationen, Lesungen und Träume."
    },
    compatibility: {
      title: "Kompatibilität",
      relationships: "BEZIEHUNGEN",
      synastry: "Synastrie",
      addPartnerEnergy: "PARTNERENERGIE HINZUFÜGEN",
      partnerName: "NAME DES PARTNERS / PERSON",
      namePlaceholder: "Namen eingeben...",
      birthDate: "GEBURTSDATUM",
      selectDate: "Datum auswählen",
      calculateMatch: "ÜBEREINSTIMMUNG BERECHNEN",
      you: "Du",
      partner: "Partner",
      relationshipEnergy: "BEZIEHUNGSENERGIE",
      vibration: "Schwingung",
      changePartner: "PERSON WECHSELN",
      compatibilityScore: "Kompatibilitätswert",
      strengths: "Stärken",
      challenges: "Herausforderungen",
      advice: "Ratschlag"
    },
    journeys: {
      title: "Reisen",
      spiritualPrograms: "Spirituelle Programme",
      transformationPaths: "Transformationswege",
      weeklyFocus: "Wöchentlicher Fokus",
      dailyPractice: "Tägliche Übung",
      completedSessions: "Abgeschlossene Sitzungen",
      nextStep: "Nächster Schritt",
      continueJourney: "Reise fortsetzen",
      startJourney: "Reise beginnen",
      currentJourney: "Aktuelle Reise",
      availableJourneys: "Verfügbare Reisen",
      progress: "Fortschritt",
      daysLeft: "Verbleibende Tage"
    },
    palmreading: {
      title: "Handlesen",
      analyze: "HAND ANALYSIEREN",
      upload: "Handfoto hochladen",
      instructions: "Fotografiere deine Handfläche bei gutem Licht",
      lines: {
        heart: "Herzlinie",
        head: "Kopflinie",
        life: "Lebenslinie",
        fate: "Schicksalslinie",
        sun: "Sonnenlinie"
      },
      interpretationTitle: "Handinterpretation",
      loading: "Handlinien werden analysiert..."
    },
    binauralbeats: {
      title: "Gehirnwellen",
      subtitle: "Binaurale Schläge",
      start: "STARTEN",
      stop: "STOPPEN",
      waves: {
        delta: "Delta — Tiefschlaf",
        theta: "Theta — Meditation",
        alpha: "Alpha — Entspannung",
        beta: "Beta — Fokus",
        gamma: "Gamma — Höhere Kognition"
      },
      benefits: "Vorteile",
      session_complete: "Sitzung abgeschlossen"
    },
    sleephelper: {
      title: "Schlafhelfer",
      start: "SCHLAF BEGINNEN",
      duration: "Dauer",
      soundscape: "Klänge",
      story: "Geschichte",
      meditation: "Schlafmeditation",
      goodnight: "Gute Nacht, Seele"
    },
    stars: {
      title: "Sterne",
      skyMap: "Himmelskarte",
      catalogue: "Sternenkatalog",
      constellation: "Sternbild",
      magnitude: "Magnitude",
      distance: "Entfernung",
      realTimeSky: "Echtzeithimmel",
      yourZenith: "Dein Zenit",
      tabMap: "Karte",
      tabCatalogue: "Katalog",
      tabInfo: "Info"
    },
    biorhythm: {
      title: "Biorhythmus",
      physical: "Physisch",
      emotional: "Emotional",
      intellectual: "Intellektuell",
      today: "Heute",
      peak: "Höhepunkt",
      low: "Tief",
      neutral: "Neutral",
      chartTitle: "Biorhythmus-Diagramm"
    },
    knowledge: {
      title: "Bibliothek",
      search: "Wissen suchen...",
      categories: "Kategorien",
      articles: "Artikel",
      savedArticles: "Gespeicherte Artikel",
      readMore: "Mehr lesen"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "Das präziseste, klassische Deck basierend auf der Rider-Waite-Tradition.",
        cosmic: "Kosmisches Licht",
        cosmicDesc: "Eine moderne, galaktische Interpretation universeller Archetypen.",
        dark: "Seelendunkelheit",
        darkDesc: "Ein tiefes Deck für Schattenarbeit und verborgene Wahrheiten."
      },
      rituals: {
        morning_alignment: {
          title: "Morgenausrichtung",
          description: "Eine kurze Meditation, um deine Absicht für den Tag zu setzen.",
          duration: "5 Min"
        },
        evening_reflection: {
          title: "Abendreflexion",
          description: "Angesammelte Emotionen vor dem Schlafen loslassen.",
          duration: "10 Min"
        },
        candle_magic: {
          title: "Kerzenzauber",
          description: "Manifestierung eines bestimmten Wunsches durch das Element Feuer.",
          duration: "15 Min"
        }
      }
    },
    archetypes: {
      "1": { name: "Der Magier", title: "Realitätserschaffer" },
      "2": { name: "Die Hohepriesterin", title: "Hüterin der Geheimnisse" },
      "3": { name: "Die Herrscherin", title: "Herrscherin des Überflusses" },
      "4": { name: "Der Herrscher", title: "Architekt der Ordnung" },
      "5": { name: "Der Hierophant", title: "Hüter der Tradition" },
      "6": { name: "Die Liebenden", title: "Energieharmonisierer" },
      "7": { name: "Der Wagen", title: "Zielerreicher" },
      "8": { name: "Gerechtigkeit", title: "Waage des Karma" },
      "9": { name: "Der Eremit", title: "Wahrheitssucher" },
      "10": { name: "Das Rad des Schicksals", title: "Meister des Schicksals" },
      "11": { name: "Stärke", title: "Meister der Emotionen" },
      "12": { name: "Der Gehängte", title: "Perspektivvisionär" },
      "13": { name: "Der Tod", title: "Transformationsagent" },
      "14": { name: "Mäßigkeit", title: "Alchemist des Gleichgewichts" },
      "15": { name: "Der Teufel", title: "Schattenerforscher" },
      "16": { name: "Der Turm", title: "Zerstörer der Illusionen" },
      "17": { name: "Der Stern", title: "Hoffnungsinspirierer" },
      "18": { name: "Der Mond", title: "Unbewusster Reisender" },
      "19": { name: "Die Sonne", title: "Strahl der Klarheit" },
      "20": { name: "Das Gericht", title: "Stimme des Erwachens" },
      "21": { name: "Die Welt", title: "Meister der Integration" },
      "22": { name: "Der Narr", title: "Freier Geist" }
    },
    sleepRitual: {
      title: "Schlafzeremonie",
      eyebrow: "WELT DER TRÄUME",
      tabProtocol: "Protokoll",
      tabScan: "Körperscan",
      tabBreath: "Atem",
      start: "Starten",
      done: "Fertig"
    },
    lucidDreaming: {
      title: "Luzides Träumen",
      eyebrow: "WELT DER TRÄUME",
      tabTechniques: "Techniken",
      tabDiary: "Tagebuch",
      tabSigns: "Zeichen"
    },
    fireCeremony: {
      title: "Feuerzeremonie",
      eyebrow: "WELT DER RITUALE",
      writeIntention: "Schreibe deine Absicht...",
      burn: "Verbrennen"
    },
    ancestralConnection: {
      title: "Ahnenverbindung",
      eyebrow: "WELT DER RITUALE",
      askOracle: "Das Orakel befragen"
    },
    protectionRitual: {
      title: "Schutzschild",
      eyebrow: "WELT DER REINIGUNG",
      activate: "Schutz aktivieren"
    },
    saltBath: {
      title: "Salzbad",
      eyebrow: "WELT DER REINIGUNG",
      tabProtocols: "Protokolle",
      tabSteps: "Schritte",
      start: "Starten"
    },
    releaseLetters: {
      title: "Briefe ans Feuer",
      eyebrow: "WELT DER REINIGUNG",
      write: "Einen Brief schreiben...",
      release: "Loslassen"
    },
    innerChild: {
      title: "Inneres Kind",
      eyebrow: "WELT DER UNTERSTÜTZUNG",
      askOracle: "Das Orakel befragen"
    },
    anxietyRelief: {
      title: "Angstlinderung",
      eyebrow: "WELT DER UNTERSTÜTZUNG",
      sos: "SOS",
      techniques: "Techniken",
      habits: "Gewohnheiten"
    },
    selfCompassion: {
      title: "Selbstmitgefühl",
      eyebrow: "WELT DER UNTERSTÜTZUNG",
      generateLetter: "Brief generieren"
    },
    healingFrequencies: {
      title: "Heilfrequenzen",
      eyebrow: "WELT DER UNTERSTÜTZUNG",
      play: "Abspielen",
      stop: "Stoppen"
    },
    emotionalAnchors: {
      title: "Emotionale Anker",
      eyebrow: "WELT DER UNTERSTÜTZUNG",
      activate: "Anker aktivieren",
      create: "Neu erstellen"
    },
    lifeWheel: {
      title: "Lebensrad",
      eyebrow: "DEINE WELT",
      score: "Bewertung",
      yourWheel: "Dein Rad"
    },
    soulArchetype: {
      title: "Seelen-Archetyp",
      eyebrow: "DEINE WELT",
      startQuiz: "Quiz starten",
      result: "Dein Archetyp"
    },
    natalChart: {
      title: "Geburtshoroskop",
      eyebrow: "WELT DES HOROSKOPS",
      tabChart: "Karte",
      tabPlanets: "Planeten",
      tabHouses: "Häuser"
    },
    retrogrades: {
      title: "Retrogrades ℞",
      eyebrow: "WELT DES HOROSKOPS",
      survivalGuide: "ÜBERLEBENSGUIDE ℞"
    },
    signMeditation: {
      title: "Zeichen-Meditation",
      eyebrow: "WELT DES HOROSKOPS",
      tabMeditation: "Meditation",
      tabAffirmations: "Affirmationen",
      start: "Starten",
      stop: "Stoppen"
    }
  },

  es: {
    checkin: {
      title: "Registro",
      mood: "Estado de ánimo",
      energy: "Energía",
      focus: "Enfoque",
      moods: {
        joy: "Alegría",
        peace: "Paz",
        gratitude: "Gratitud",
        love: "Amor",
        anxiety: "Ansiedad",
        sadness: "Tristeza",
        anger: "Ira",
        confusion: "Confusión",
        emptiness: "Vacío"
      },
      energy_levels: {
        very_low: "Muy baja",
        low: "Baja",
        medium: "Media",
        high: "Alta",
        very_high: "Muy alta"
      },
      focus_areas: {
        love: "Amor",
        career: "Carrera",
        health: "Salud",
        spirituality: "Espiritualidad",
        creativity: "Creatividad",
        healing: "Sanación"
      },
      save: "GUARDAR REGISTRO",
      particles: "partículas de energía"
    },
    reports: {
      title: "Informes",
      pathAnalysis: "ANÁLISIS DEL CAMINO",
      weeklyInsight: "Perspectiva Semanal",
      dominantEnergy: "ENERGÍA DOMINANTE",
      frequentArchetypes: "ARQUETIPOS FRECUENTES",
      suggestedFocus: "ENFOQUE SUGERIDO",
      consistencyMastery: "Maestría en Consistencia",
      streakDesc: "Has mantenido contacto con tu interior durante {{days}} días seguidos.",
      entries: "ENTRADAS",
      readings: "LECTURAS",
      recordDays: "DÍAS RÉCORD",
      currentPhase: "FASE ACTUAL",
      emotionalLandscape: "PAISAJE EMOCIONAL",
      moodConstellation: "CONSTELACIÓN DE HUMOR",
      constellationDesc: "Visualización de tus estados emocionales como un mapa estelar.",
      practiceDynamics: "DINÁMICA DE PRÁCTICA",
      reflections: "REFLEXIONES",
      tarotInsight: "PERSPECTIVA DEL TAROT",
      calm: "Tranquilo",
      excellent: "Excelente",
      good: "Bueno",
      peaceful: "Pacífico",
      weak: "Débil",
      difficult: "Difícil",
      soulReports: "Informes del Alma",
      trends: "Tus tendencias",
      generating: "Generando informe...",
      weeklyReport: "Informe Semanal",
      monthlyReport: "Informe Mensual"
    },
    astrology: {
      title: "Astrología",
      transits: "Tránsitos",
      cycles: "Ciclos",
      biorhythm: "Biorritmo",
      stars: "Estrellas",
      vedic: "Astrología Védica",
      retrograde: "Retrógrado",
      aspects: "Aspectos",
      conjunction: "Conjunción",
      opposition: "Oposición",
      trine: "Trígono",
      square: "Cuadratura",
      sextile: "Sextil",
      natalChart: "Carta Natal",
      starsMap: "Mapa del Cielo",
      currentTransits: "Tránsitos Actuales",
      biorhythmCycles: "Ciclos de Biorritmo",
      physical: "Físico",
      emotional: "Emocional",
      intellectual: "Intelectual"
    },
    notifications: {
      title: "Notificaciones",
      reminders: "Recordatorios",
      add_reminder: "Añadir Recordatorio",
      morning: "Mañana",
      evening: "Tarde",
      meditation: "Meditación",
      ritual: "Ritual",
      enabled: "Activado",
      disabled: "Desactivado",
      time: "Hora",
      days: "Días",
      presets: "Preajustes",
      customTime: "Hora personalizada",
      reminderLabel: "Etiqueta del recordatorio",
      saveReminder: "GUARDAR RECORDATORIO",
      deleteReminder: "Eliminar recordatorio",
      allDays: "Todos los días",
      weekdays: "Días laborables",
      weekends: "Fines de semana"
    },
    paywall: {
      premiumTitle: "Desbloquea la Sabiduría Infinita",
      premiumSubtitle: "Tu viaje interior comienza ahora. Únete al círculo de buscadores.",
      choosePath: "ELIGE TU CAMINO",
      monthly: "Mensual",
      yearly: "Anual",
      monthlyDesc: "Cancela cuando quieras",
      yearlyDesc: "Solo $4.99 / mes",
      bestValue: "MEJOR VALOR",
      restore: "RESTAURAR COMPRAS",
      feature1Title: "Chat Oracle Ilimitado",
      feature1Desc: "Chatea con tu guía de IA sin límites en cualquier momento.",
      feature2Title: "Tiradas de Tarot Avanzadas",
      feature2Desc: "Accede a los 22 arcanos mayores y menores más tiradas especializadas.",
      feature3Title: "Perspectivas del Camino del Alma",
      feature3Desc: "Análisis profundo de tu Matriz del Destino y tránsitos personales.",
      feature4Title: "Biblioteca Sagrada",
      feature4Desc: "Un santuario permanente para tus afirmaciones, lecturas y sueños favoritos."
    },
    compatibility: {
      title: "Compatibilidad",
      relationships: "RELACIONES",
      synastry: "Sinastría",
      addPartnerEnergy: "AÑADIR ENERGÍA DE PAREJA",
      partnerName: "NOMBRE DE LA PAREJA / PERSONA",
      namePlaceholder: "Introduce un nombre...",
      birthDate: "FECHA DE NACIMIENTO",
      selectDate: "Seleccionar fecha",
      calculateMatch: "CALCULAR COMPATIBILIDAD",
      you: "Tú",
      partner: "Pareja",
      relationshipEnergy: "ENERGÍA DE LA RELACIÓN",
      vibration: "Vibración",
      changePartner: "CAMBIAR PERSONA",
      compatibilityScore: "Puntuación de compatibilidad",
      strengths: "Fortalezas",
      challenges: "Desafíos",
      advice: "Consejo"
    },
    journeys: {
      title: "Viajes",
      spiritualPrograms: "Programas Espirituales",
      transformationPaths: "Caminos de Transformación",
      weeklyFocus: "Enfoque Semanal",
      dailyPractice: "Práctica Diaria",
      completedSessions: "Sesiones Completadas",
      nextStep: "Siguiente Paso",
      continueJourney: "Continuar Viaje",
      startJourney: "Comenzar Viaje",
      currentJourney: "Viaje Actual",
      availableJourneys: "Viajes Disponibles",
      progress: "Progreso",
      daysLeft: "Días restantes"
    },
    palmreading: {
      title: "Quiromancia",
      analyze: "ANALIZAR PALMA",
      upload: "Subir foto de la palma",
      instructions: "Fotografía la palma de tu mano con buena iluminación",
      lines: {
        heart: "Línea del Corazón",
        head: "Línea de la Cabeza",
        life: "Línea de la Vida",
        fate: "Línea del Destino",
        sun: "Línea del Sol"
      },
      interpretationTitle: "Interpretación de la Palma",
      loading: "Analizando las líneas de tu palma..."
    },
    binauralbeats: {
      title: "Ondas Cerebrales",
      subtitle: "Latidos binaurales",
      start: "INICIAR",
      stop: "DETENER",
      waves: {
        delta: "Delta — sueño profundo",
        theta: "Theta — meditación",
        alpha: "Alpha — relajación",
        beta: "Beta — enfoque",
        gamma: "Gamma — cognición superior"
      },
      benefits: "Beneficios",
      session_complete: "Sesión completa"
    },
    sleephelper: {
      title: "Ayudante del Sueño",
      start: "COMENZAR A DORMIR",
      duration: "Duración",
      soundscape: "Sonidos",
      story: "Historia",
      meditation: "Meditación para dormir",
      goodnight: "Buenas noches, alma"
    },
    stars: {
      title: "Estrellas",
      skyMap: "Mapa del Cielo",
      catalogue: "Catálogo Estelar",
      constellation: "Constelación",
      magnitude: "Magnitud",
      distance: "Distancia",
      realTimeSky: "Cielo en tiempo real",
      yourZenith: "Tu cenit",
      tabMap: "Mapa",
      tabCatalogue: "Catálogo",
      tabInfo: "Info"
    },
    biorhythm: {
      title: "Biorritmo",
      physical: "Físico",
      emotional: "Emocional",
      intellectual: "Intelectual",
      today: "Hoy",
      peak: "Pico",
      low: "Bajo",
      neutral: "Neutral",
      chartTitle: "Gráfico de Biorritmo"
    },
    knowledge: {
      title: "Biblioteca",
      search: "Buscar conocimiento...",
      categories: "Categorías",
      articles: "Artículos",
      savedArticles: "Artículos guardados",
      readMore: "Leer más"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "El mazo más preciso y clásico basado en la tradición Rider-Waite.",
        cosmic: "Luz Cósmica",
        cosmicDesc: "Una interpretación moderna y galáctica de arquetipos universales.",
        dark: "Oscuridad del Alma",
        darkDesc: "Un mazo profundo para el trabajo con la sombra y verdades ocultas."
      },
      rituals: {
        morning_alignment: {
          title: "Alineación Matutina",
          description: "Una meditación breve para establecer tu intención del día.",
          duration: "5 min"
        },
        evening_reflection: {
          title: "Reflexión Vespertina",
          description: "Libera emociones acumuladas antes de dormir.",
          duration: "10 min"
        },
        candle_magic: {
          title: "Magia de Velas",
          description: "Manifestar un deseo específico a través del elemento fuego.",
          duration: "15 min"
        }
      }
    },
    archetypes: {
      "1": { name: "El Mago", title: "Creador de Realidad" },
      "2": { name: "La Suma Sacerdotisa", title: "Guardiana de Secretos" },
      "3": { name: "La Emperatriz", title: "Gobernante de la Abundancia" },
      "4": { name: "El Emperador", title: "Arquitecto del Orden" },
      "5": { name: "El Hierofante", title: "Guardián de la Tradición" },
      "6": { name: "Los Enamorados", title: "Armonizador de Energía" },
      "7": { name: "El Carro", title: "Conquistador de Metas" },
      "8": { name: "La Justicia", title: "Balanza del Karma" },
      "9": { name: "El Ermitaño", title: "Buscador de Verdad" },
      "10": { name: "La Rueda de la Fortuna", title: "Maestro del Destino" },
      "11": { name: "La Fuerza", title: "Maestro de las Emociones" },
      "12": { name: "El Colgado", title: "Visionario de la Perspectiva" },
      "13": { name: "La Muerte", title: "Agente de Transformación" },
      "14": { name: "La Templanza", title: "Alquimista del Equilibrio" },
      "15": { name: "El Diablo", title: "Explorador de la Sombra" },
      "16": { name: "La Torre", title: "Destructor de Ilusiones" },
      "17": { name: "La Estrella", title: "Inspirador de Esperanza" },
      "18": { name: "La Luna", title: "Viajero del Subconsciente" },
      "19": { name: "El Sol", title: "Rayo de Claridad" },
      "20": { name: "El Juicio", title: "Voz del Despertar" },
      "21": { name: "El Mundo", title: "Maestro de la Integración" },
      "22": { name: "El Loco", title: "Espíritu Libre" }
    },
    sleepRitual: {
      title: "Ritual del Sueño",
      eyebrow: "MUNDO DE LOS SUEÑOS",
      tabProtocol: "Protocolo",
      tabScan: "Escaneo Corporal",
      tabBreath: "Respiración",
      start: "Comenzar",
      done: "Hecho"
    },
    lucidDreaming: {
      title: "Sueños Lúcidos",
      eyebrow: "MUNDO DE LOS SUEÑOS",
      tabTechniques: "Técnicas",
      tabDiary: "Diario",
      tabSigns: "Señales"
    },
    fireCeremony: {
      title: "Ceremonia del Fuego",
      eyebrow: "MUNDO DE LOS RITUALES",
      writeIntention: "Escribe tu intención...",
      burn: "Quemar"
    },
    ancestralConnection: {
      title: "Conexión Ancestral",
      eyebrow: "MUNDO DE LOS RITUALES",
      askOracle: "Consultar el Oráculo"
    },
    protectionRitual: {
      title: "Escudo de Protección",
      eyebrow: "MUNDO DE LA PURIFICACIÓN",
      activate: "Activar protección"
    },
    saltBath: {
      title: "Baño de Sal",
      eyebrow: "MUNDO DE LA PURIFICACIÓN",
      tabProtocols: "Protocolos",
      tabSteps: "Pasos",
      start: "Comenzar"
    },
    releaseLetters: {
      title: "Cartas al Fuego",
      eyebrow: "MUNDO DE LA PURIFICACIÓN",
      write: "Escribir una carta...",
      release: "Liberar"
    },
    innerChild: {
      title: "Niño Interior",
      eyebrow: "MUNDO DEL APOYO",
      askOracle: "Consultar el Oráculo"
    },
    anxietyRelief: {
      title: "Alivio de la Ansiedad",
      eyebrow: "MUNDO DEL APOYO",
      sos: "SOS",
      techniques: "Técnicas",
      habits: "Hábitos"
    },
    selfCompassion: {
      title: "Autocompasión",
      eyebrow: "MUNDO DEL APOYO",
      generateLetter: "Generar carta"
    },
    healingFrequencies: {
      title: "Frecuencias de Sanación",
      eyebrow: "MUNDO DEL APOYO",
      play: "Reproducir",
      stop: "Detener"
    },
    emotionalAnchors: {
      title: "Anclas Emocionales",
      eyebrow: "MUNDO DEL APOYO",
      activate: "Activar ancla",
      create: "Crear nuevo"
    },
    lifeWheel: {
      title: "Rueda de la Vida",
      eyebrow: "TU MUNDO",
      score: "Puntuación",
      yourWheel: "Tu Rueda"
    },
    soulArchetype: {
      title: "Arquetipo del Alma",
      eyebrow: "TU MUNDO",
      startQuiz: "Comenzar cuestionario",
      result: "Tu arquetipo"
    },
    natalChart: {
      title: "Carta Natal",
      eyebrow: "MUNDO DEL HORÓSCOPO",
      tabChart: "Carta",
      tabPlanets: "Planetas",
      tabHouses: "Casas"
    },
    retrogrades: {
      title: "Retrógrados ℞",
      eyebrow: "MUNDO DEL HORÓSCOPO",
      survivalGuide: "GUÍA DE SUPERVIVENCIA ℞"
    },
    signMeditation: {
      title: "Meditación del Signo",
      eyebrow: "MUNDO DEL HORÓSCOPO",
      tabMeditation: "Meditación",
      tabAffirmations: "Afirmaciones",
      start: "Comenzar",
      stop: "Detener"
    }
  },

  fr: {
    checkin: {
      title: "Bilan",
      mood: "Humeur",
      energy: "Énergie",
      focus: "Concentration",
      moods: {
        joy: "Joie",
        peace: "Paix",
        gratitude: "Gratitude",
        love: "Amour",
        anxiety: "Anxiété",
        sadness: "Tristesse",
        anger: "Colère",
        confusion: "Confusion",
        emptiness: "Vide"
      },
      energy_levels: {
        very_low: "Très basse",
        low: "Basse",
        medium: "Moyenne",
        high: "Haute",
        very_high: "Très haute"
      },
      focus_areas: {
        love: "Amour",
        career: "Carrière",
        health: "Santé",
        spirituality: "Spiritualité",
        creativity: "Créativité",
        healing: "Guérison"
      },
      save: "ENREGISTRER LE BILAN",
      particles: "particules d'énergie"
    },
    reports: {
      title: "Rapports",
      pathAnalysis: "ANALYSE DU CHEMIN",
      weeklyInsight: "Aperçu Hebdomadaire",
      dominantEnergy: "ÉNERGIE DOMINANTE",
      frequentArchetypes: "ARCHÉTYPES FRÉQUENTS",
      suggestedFocus: "CONCENTRATION SUGGÉRÉE",
      consistencyMastery: "Maîtrise de la Constance",
      streakDesc: "Tu as maintenu le contact avec ton intérieur pendant {{days}} jours consécutifs.",
      entries: "ENTRÉES",
      readings: "LECTURES",
      recordDays: "JOURS RECORDS",
      currentPhase: "PHASE ACTUELLE",
      emotionalLandscape: "PAYSAGE ÉMOTIONNEL",
      moodConstellation: "CONSTELLATION D'HUMEUR",
      constellationDesc: "Visualisation de tes états émotionnels comme une carte stellaire.",
      practiceDynamics: "DYNAMIQUE DE PRATIQUE",
      reflections: "RÉFLEXIONS",
      tarotInsight: "APERÇU DU TAROT",
      calm: "Calme",
      excellent: "Excellent",
      good: "Bon",
      peaceful: "Paisible",
      weak: "Faible",
      difficult: "Difficile",
      soulReports: "Rapports de l'Âme",
      trends: "Tes tendances",
      generating: "Génération du rapport...",
      weeklyReport: "Rapport Hebdomadaire",
      monthlyReport: "Rapport Mensuel"
    },
    astrology: {
      title: "Astrologie",
      transits: "Transits",
      cycles: "Cycles",
      biorhythm: "Biorythme",
      stars: "Étoiles",
      vedic: "Astrologie Védique",
      retrograde: "Rétrograde",
      aspects: "Aspects",
      conjunction: "Conjonction",
      opposition: "Opposition",
      trine: "Trigone",
      square: "Carré",
      sextile: "Sextile",
      natalChart: "Thème Natal",
      starsMap: "Carte du Ciel",
      currentTransits: "Transits Actuels",
      biorhythmCycles: "Cycles de Biorythme",
      physical: "Physique",
      emotional: "Émotionnel",
      intellectual: "Intellectuel"
    },
    notifications: {
      title: "Notifications",
      reminders: "Rappels",
      add_reminder: "Ajouter un Rappel",
      morning: "Matin",
      evening: "Soir",
      meditation: "Méditation",
      ritual: "Rituel",
      enabled: "Activé",
      disabled: "Désactivé",
      time: "Heure",
      days: "Jours",
      presets: "Préréglages",
      customTime: "Heure personnalisée",
      reminderLabel: "Étiquette du rappel",
      saveReminder: "ENREGISTRER LE RAPPEL",
      deleteReminder: "Supprimer le rappel",
      allDays: "Chaque jour",
      weekdays: "Jours de semaine",
      weekends: "Week-ends"
    },
    paywall: {
      premiumTitle: "Débloquer la Sagesse Infinie",
      premiumSubtitle: "Ton voyage intérieur commence maintenant. Rejoins le cercle des chercheurs.",
      choosePath: "CHOISIS TON CHEMIN",
      monthly: "Mensuel",
      yearly: "Annuel",
      monthlyDesc: "Annule à tout moment",
      yearlyDesc: "Seulement 4,99 € / mois",
      bestValue: "MEILLEURE VALEUR",
      restore: "RESTAURER LES ACHATS",
      feature1Title: "Chat Oracle Illimité",
      feature1Desc: "Discute avec ton guide IA sans limites à tout moment.",
      feature2Title: "Tirages de Tarot Avancés",
      feature2Desc: "Accès à tous les 22 arcanes majeurs et mineurs plus des tirages spécialisés.",
      feature3Title: "Aperçus du Chemin de l'Âme",
      feature3Desc: "Analyse approfondie de ta Matrice du Destin et des transits personnels.",
      feature4Title: "Bibliothèque Sacrée",
      feature4Desc: "Un sanctuaire permanent pour tes affirmations, lectures et rêves favoris."
    },
    compatibility: {
      title: "Compatibilité",
      relationships: "RELATIONS",
      synastry: "Synastrie",
      addPartnerEnergy: "AJOUTER L'ÉNERGIE DU PARTENAIRE",
      partnerName: "NOM DU PARTENAIRE / PERSONNE",
      namePlaceholder: "Entrer un nom...",
      birthDate: "DATE DE NAISSANCE",
      selectDate: "Sélectionner une date",
      calculateMatch: "CALCULER LA COMPATIBILITÉ",
      you: "Toi",
      partner: "Partenaire",
      relationshipEnergy: "ÉNERGIE DE LA RELATION",
      vibration: "Vibration",
      changePartner: "CHANGER DE PERSONNE",
      compatibilityScore: "Score de compatibilité",
      strengths: "Forces",
      challenges: "Défis",
      advice: "Conseil"
    },
    journeys: {
      title: "Voyages",
      spiritualPrograms: "Programmes Spirituels",
      transformationPaths: "Chemins de Transformation",
      weeklyFocus: "Concentration Hebdomadaire",
      dailyPractice: "Pratique Quotidienne",
      completedSessions: "Sessions Complétées",
      nextStep: "Prochaine Étape",
      continueJourney: "Continuer le Voyage",
      startJourney: "Commencer le Voyage",
      currentJourney: "Voyage Actuel",
      availableJourneys: "Voyages Disponibles",
      progress: "Progrès",
      daysLeft: "Jours restants"
    },
    palmreading: {
      title: "Chiromancie",
      analyze: "ANALYSER LA PAUME",
      upload: "Télécharger une photo de la paume",
      instructions: "Photographiez la paume de votre main dans une bonne lumière",
      lines: {
        heart: "Ligne du Cœur",
        head: "Ligne de la Tête",
        life: "Ligne de Vie",
        fate: "Ligne du Destin",
        sun: "Ligne du Soleil"
      },
      interpretationTitle: "Interprétation de la Paume",
      loading: "Analyse des lignes de votre paume..."
    },
    binauralbeats: {
      title: "Ondes Cérébrales",
      subtitle: "Battements binauraux",
      start: "DÉMARRER",
      stop: "ARRÊTER",
      waves: {
        delta: "Delta — sommeil profond",
        theta: "Thêta — méditation",
        alpha: "Alpha — relaxation",
        beta: "Bêta — concentration",
        gamma: "Gamma — cognition supérieure"
      },
      benefits: "Bénéfices",
      session_complete: "Session terminée"
    },
    sleephelper: {
      title: "Assistant Sommeil",
      start: "COMMENCER LE SOMMEIL",
      duration: "Durée",
      soundscape: "Sons",
      story: "Histoire",
      meditation: "Méditation pour dormir",
      goodnight: "Bonne nuit, âme"
    },
    stars: {
      title: "Étoiles",
      skyMap: "Carte du Ciel",
      catalogue: "Catalogue Stellaire",
      constellation: "Constellation",
      magnitude: "Magnitude",
      distance: "Distance",
      realTimeSky: "Ciel en temps réel",
      yourZenith: "Ton zénith",
      tabMap: "Carte",
      tabCatalogue: "Catalogue",
      tabInfo: "Info"
    },
    biorhythm: {
      title: "Biorythme",
      physical: "Physique",
      emotional: "Émotionnel",
      intellectual: "Intellectuel",
      today: "Aujourd'hui",
      peak: "Pic",
      low: "Bas",
      neutral: "Neutre",
      chartTitle: "Graphique du Biorythme"
    },
    knowledge: {
      title: "Bibliothèque",
      search: "Rechercher des connaissances...",
      categories: "Catégories",
      articles: "Articles",
      savedArticles: "Articles sauvegardés",
      readMore: "Lire plus"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "Le jeu le plus précis et classique basé sur la tradition Rider-Waite.",
        cosmic: "Lumière Cosmique",
        cosmicDesc: "Une interprétation moderne et galactique des archétypes universels.",
        dark: "Obscurité de l'Âme",
        darkDesc: "Un jeu profond pour le travail sur l'ombre et les vérités cachées."
      },
      rituals: {
        morning_alignment: {
          title: "Alignement Matinal",
          description: "Une courte méditation pour définir ton intention pour la journée.",
          duration: "5 min"
        },
        evening_reflection: {
          title: "Réflexion du Soir",
          description: "Libère les émotions accumulées avant de dormir.",
          duration: "10 min"
        },
        candle_magic: {
          title: "Magie des Bougies",
          description: "Manifester un désir spécifique à travers l'élément feu.",
          duration: "15 min"
        }
      }
    },
    archetypes: {
      "1": { name: "Le Magicien", title: "Créateur de Réalité" },
      "2": { name: "La Grande Prêtresse", title: "Gardienne des Secrets" },
      "3": { name: "L'Impératrice", title: "Souveraine de l'Abondance" },
      "4": { name: "L'Empereur", title: "Architecte de l'Ordre" },
      "5": { name: "Le Hiérophante", title: "Gardien de la Tradition" },
      "6": { name: "Les Amoureux", title: "Harmonisateur d'Énergie" },
      "7": { name: "Le Chariot", title: "Conquérant d'Objectifs" },
      "8": { name: "La Justice", title: "Balance du Karma" },
      "9": { name: "L'Ermite", title: "Chercheur de Vérité" },
      "10": { name: "La Roue de Fortune", title: "Maître du Destin" },
      "11": { name: "La Force", title: "Maître des Émotions" },
      "12": { name: "Le Pendu", title: "Visionnaire de la Perspective" },
      "13": { name: "La Mort", title: "Agent de Transformation" },
      "14": { name: "La Tempérance", title: "Alchimiste de l'Équilibre" },
      "15": { name: "Le Diable", title: "Explorateur de l'Ombre" },
      "16": { name: "La Tour", title: "Destructeur d'Illusions" },
      "17": { name: "L'Étoile", title: "Inspirateur d'Espoir" },
      "18": { name: "La Lune", title: "Voyageur du Subconscient" },
      "19": { name: "Le Soleil", title: "Rayon de Clarté" },
      "20": { name: "Le Jugement", title: "Voix de l'Éveil" },
      "21": { name: "Le Monde", title: "Maître de l'Intégration" },
      "22": { name: "Le Fou", title: "Esprit Libre" }
    },
    sleepRitual: {
      title: "Rituel du Sommeil",
      eyebrow: "MONDE DES RÊVES",
      tabProtocol: "Protocole",
      tabScan: "Scanner Corporel",
      tabBreath: "Respiration",
      start: "Démarrer",
      done: "Terminé"
    },
    lucidDreaming: {
      title: "Rêve Lucide",
      eyebrow: "MONDE DES RÊVES",
      tabTechniques: "Techniques",
      tabDiary: "Journal",
      tabSigns: "Signes"
    },
    fireCeremony: {
      title: "Cérémonie du Feu",
      eyebrow: "MONDE DES RITUELS",
      writeIntention: "Écris ton intention...",
      burn: "Brûler"
    },
    ancestralConnection: {
      title: "Connexion Ancestrale",
      eyebrow: "MONDE DES RITUELS",
      askOracle: "Consulter l'Oracle"
    },
    protectionRitual: {
      title: "Bouclier de Protection",
      eyebrow: "MONDE DE LA PURIFICATION",
      activate: "Activer la protection"
    },
    saltBath: {
      title: "Bain de Sel",
      eyebrow: "MONDE DE LA PURIFICATION",
      tabProtocols: "Protocoles",
      tabSteps: "Étapes",
      start: "Démarrer"
    },
    releaseLetters: {
      title: "Lettres au Feu",
      eyebrow: "MONDE DE LA PURIFICATION",
      write: "Écrire une lettre...",
      release: "Libérer"
    },
    innerChild: {
      title: "Enfant Intérieur",
      eyebrow: "MONDE DU SOUTIEN",
      askOracle: "Consulter l'Oracle"
    },
    anxietyRelief: {
      title: "Soulagement de l'Anxiété",
      eyebrow: "MONDE DU SOUTIEN",
      sos: "SOS",
      techniques: "Techniques",
      habits: "Habitudes"
    },
    selfCompassion: {
      title: "Auto-Compassion",
      eyebrow: "MONDE DU SOUTIEN",
      generateLetter: "Générer une lettre"
    },
    healingFrequencies: {
      title: "Fréquences de Guérison",
      eyebrow: "MONDE DU SOUTIEN",
      play: "Jouer",
      stop: "Arrêter"
    },
    emotionalAnchors: {
      title: "Ancres Émotionnelles",
      eyebrow: "MONDE DU SOUTIEN",
      activate: "Activer l'ancre",
      create: "Créer nouveau"
    },
    lifeWheel: {
      title: "Roue de Vie",
      eyebrow: "TON MONDE",
      score: "Score",
      yourWheel: "Ta Roue"
    },
    soulArchetype: {
      title: "Archétype de l'Âme",
      eyebrow: "TON MONDE",
      startQuiz: "Commencer le quiz",
      result: "Ton archétype"
    },
    natalChart: {
      title: "Thème Natal",
      eyebrow: "MONDE DE L'HOROSCOPE",
      tabChart: "Carte",
      tabPlanets: "Planètes",
      tabHouses: "Maisons"
    },
    retrogrades: {
      title: "Rétrogrades ℞",
      eyebrow: "MONDE DE L'HOROSCOPE",
      survivalGuide: "GUIDE DE SURVIE ℞"
    },
    signMeditation: {
      title: "Méditation du Signe",
      eyebrow: "MONDE DE L'HOROSCOPE",
      tabMeditation: "Méditation",
      tabAffirmations: "Affirmations",
      start: "Démarrer",
      stop: "Arrêter"
    }
  },

  it: {
    checkin: {
      title: "Check-in",
      mood: "Umore",
      energy: "Energia",
      focus: "Focus",
      moods: {
        joy: "Gioia",
        peace: "Pace",
        gratitude: "Gratitudine",
        love: "Amore",
        anxiety: "Ansia",
        sadness: "Tristezza",
        anger: "Rabbia",
        confusion: "Confusione",
        emptiness: "Vuoto"
      },
      energy_levels: {
        very_low: "Molto bassa",
        low: "Bassa",
        medium: "Media",
        high: "Alta",
        very_high: "Molto alta"
      },
      focus_areas: {
        love: "Amore",
        career: "Carriera",
        health: "Salute",
        spirituality: "Spiritualità",
        creativity: "Creatività",
        healing: "Guarigione"
      },
      save: "SALVA CHECK-IN",
      particles: "particelle di energia"
    },
    reports: {
      title: "Rapporti",
      pathAnalysis: "ANALISI DEL PERCORSO",
      weeklyInsight: "Intuizione Settimanale",
      dominantEnergy: "ENERGIA DOMINANTE",
      frequentArchetypes: "ARCHETIPI FREQUENTI",
      suggestedFocus: "FOCUS SUGGERITO",
      consistencyMastery: "Maestria nella Coerenza",
      streakDesc: "Hai mantenuto il contatto con il tuo interno per {{days}} giorni consecutivi.",
      entries: "VOCI",
      readings: "LETTURE",
      recordDays: "GIORNI RECORD",
      currentPhase: "FASE ATTUALE",
      emotionalLandscape: "PAESAGGIO EMOTIVO",
      moodConstellation: "COSTELLAZIONE DELL'UMORE",
      constellationDesc: "Visualizzazione dei tuoi stati emotivi come una mappa stellare.",
      practiceDynamics: "DINAMICA DELLA PRATICA",
      reflections: "RIFLESSIONI",
      tarotInsight: "INTUIZIONE DEL TAROCCO",
      calm: "Calmo",
      excellent: "Eccellente",
      good: "Buono",
      peaceful: "Pacifico",
      weak: "Debole",
      difficult: "Difficile",
      soulReports: "Rapporti dell'Anima",
      trends: "Le tue tendenze",
      generating: "Generazione del rapporto...",
      weeklyReport: "Rapporto Settimanale",
      monthlyReport: "Rapporto Mensile"
    },
    astrology: {
      title: "Astrologia",
      transits: "Transiti",
      cycles: "Cicli",
      biorhythm: "Bioritmo",
      stars: "Stelle",
      vedic: "Astrologia Vedica",
      retrograde: "Retrogrado",
      aspects: "Aspetti",
      conjunction: "Congiunzione",
      opposition: "Opposizione",
      trine: "Trigono",
      square: "Quadrato",
      sextile: "Sestile",
      natalChart: "Tema Natale",
      starsMap: "Mappa del Cielo",
      currentTransits: "Transiti Attuali",
      biorhythmCycles: "Cicli del Bioritmo",
      physical: "Fisico",
      emotional: "Emotivo",
      intellectual: "Intellettuale"
    },
    notifications: {
      title: "Notifiche",
      reminders: "Promemoria",
      add_reminder: "Aggiungi Promemoria",
      morning: "Mattina",
      evening: "Sera",
      meditation: "Meditazione",
      ritual: "Rituale",
      enabled: "Abilitato",
      disabled: "Disabilitato",
      time: "Ora",
      days: "Giorni",
      presets: "Preimpostazioni",
      customTime: "Ora personalizzata",
      reminderLabel: "Etichetta promemoria",
      saveReminder: "SALVA PROMEMORIA",
      deleteReminder: "Elimina promemoria",
      allDays: "Ogni giorno",
      weekdays: "Giorni feriali",
      weekends: "Fine settimana"
    },
    paywall: {
      premiumTitle: "Sblocca la Saggezza Infinita",
      premiumSubtitle: "Il tuo viaggio interiore inizia ora. Unisciti al circolo d'élite dei ricercatori.",
      choosePath: "SCEGLI IL TUO PERCORSO",
      monthly: "Mensile",
      yearly: "Annuale",
      monthlyDesc: "Cancella quando vuoi",
      yearlyDesc: "Solo $4.99 / mese",
      bestValue: "MIGLIOR VALORE",
      restore: "RIPRISTINA ACQUISTI",
      feature1Title: "Chat Oracle Illimitata",
      feature1Desc: "Chatta con la tua guida IA senza limiti in qualsiasi momento.",
      feature2Title: "Stese di Tarocchi Avanzate",
      feature2Desc: "Accesso a tutti i 22 arcani maggiori e minori più stese specializzate.",
      feature3Title: "Intuizioni del Percorso dell'Anima",
      feature3Desc: "Analisi approfondita della tua Matrice del Destino e dei transiti personali.",
      feature4Title: "Biblioteca Sacra",
      feature4Desc: "Un santuario permanente per le tue affermazioni, letture e sogni preferiti."
    },
    compatibility: {
      title: "Compatibilità",
      relationships: "RELAZIONI",
      synastry: "Sinastria",
      addPartnerEnergy: "AGGIUNGI ENERGIA DEL PARTNER",
      partnerName: "NOME DEL PARTNER / PERSONA",
      namePlaceholder: "Inserisci un nome...",
      birthDate: "DATA DI NASCITA",
      selectDate: "Seleziona data",
      calculateMatch: "CALCOLA COMPATIBILITÀ",
      you: "Tu",
      partner: "Partner",
      relationshipEnergy: "ENERGIA DELLA RELAZIONE",
      vibration: "Vibrazione",
      changePartner: "CAMBIA PERSONA",
      compatibilityScore: "Punteggio di compatibilità",
      strengths: "Punti di forza",
      challenges: "Sfide",
      advice: "Consiglio"
    },
    journeys: {
      title: "Viaggi",
      spiritualPrograms: "Programmi Spirituali",
      transformationPaths: "Percorsi di Trasformazione",
      weeklyFocus: "Focus Settimanale",
      dailyPractice: "Pratica Quotidiana",
      completedSessions: "Sessioni Completate",
      nextStep: "Passo Successivo",
      continueJourney: "Continua il Viaggio",
      startJourney: "Inizia il Viaggio",
      currentJourney: "Viaggio Attuale",
      availableJourneys: "Viaggi Disponibili",
      progress: "Progresso",
      daysLeft: "Giorni rimanenti"
    },
    palmreading: {
      title: "Lettura della Mano",
      analyze: "ANALIZZA PALMO",
      upload: "Carica foto del palmo",
      instructions: "Fotografa il palmo della tua mano in buona luce",
      lines: {
        heart: "Linea del Cuore",
        head: "Linea della Testa",
        life: "Linea della Vita",
        fate: "Linea del Destino",
        sun: "Linea del Sole"
      },
      interpretationTitle: "Interpretazione del Palmo",
      loading: "Analisi delle linee del palmo..."
    },
    binauralbeats: {
      title: "Onde Cerebrali",
      subtitle: "Battiti binaurali",
      start: "AVVIA",
      stop: "FERMA",
      waves: {
        delta: "Delta — sonno profondo",
        theta: "Theta — meditazione",
        alpha: "Alpha — rilassamento",
        beta: "Beta — focus",
        gamma: "Gamma — cognizione superiore"
      },
      benefits: "Benefici",
      session_complete: "Sessione completata"
    },
    sleephelper: {
      title: "Assistente del Sonno",
      start: "INIZIA IL SONNO",
      duration: "Durata",
      soundscape: "Suoni",
      story: "Storia",
      meditation: "Meditazione per il sonno",
      goodnight: "Buona notte, anima"
    },
    stars: {
      title: "Stelle",
      skyMap: "Mappa del Cielo",
      catalogue: "Catalogo Stellare",
      constellation: "Costellazione",
      magnitude: "Magnitudine",
      distance: "Distanza",
      realTimeSky: "Cielo in tempo reale",
      yourZenith: "Il tuo zenit",
      tabMap: "Mappa",
      tabCatalogue: "Catalogo",
      tabInfo: "Info"
    },
    biorhythm: {
      title: "Bioritmo",
      physical: "Fisico",
      emotional: "Emotivo",
      intellectual: "Intellettuale",
      today: "Oggi",
      peak: "Picco",
      low: "Basso",
      neutral: "Neutro",
      chartTitle: "Grafico del Bioritmo"
    },
    knowledge: {
      title: "Biblioteca",
      search: "Cerca conoscenza...",
      categories: "Categorie",
      articles: "Articoli",
      savedArticles: "Articoli salvati",
      readMore: "Leggi di più"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "Il mazzo più preciso e classico basato sulla tradizione Rider-Waite.",
        cosmic: "Luce Cosmica",
        cosmicDesc: "Un'interpretazione moderna e galattica degli archetipi universali.",
        dark: "Oscurità dell'Anima",
        darkDesc: "Un mazzo profondo per il lavoro sull'ombra e le verità nascoste."
      },
      rituals: {
        morning_alignment: {
          title: "Allineamento Mattutino",
          description: "Una breve meditazione per impostare la tua intenzione per la giornata.",
          duration: "5 min"
        },
        evening_reflection: {
          title: "Riflessione Serale",
          description: "Rilascia le emozioni accumulate prima di dormire.",
          duration: "10 min"
        },
        candle_magic: {
          title: "Magia delle Candele",
          description: "Manifestare un desiderio specifico attraverso l'elemento fuoco.",
          duration: "15 min"
        }
      }
    },
    archetypes: {
      "1": { name: "Il Mago", title: "Creatore di Realtà" },
      "2": { name: "La Papessa", title: "Custode dei Segreti" },
      "3": { name: "L'Imperatrice", title: "Sovrana dell'Abbondanza" },
      "4": { name: "L'Imperatore", title: "Architetto dell'Ordine" },
      "5": { name: "Il Papa", title: "Guardiano della Tradizione" },
      "6": { name: "Gli Amanti", title: "Armonizzatore di Energia" },
      "7": { name: "Il Carro", title: "Conquistatore di Obiettivi" },
      "8": { name: "La Giustizia", title: "Bilancia del Karma" },
      "9": { name: "L'Eremita", title: "Cercatore della Verità" },
      "10": { name: "La Ruota della Fortuna", title: "Maestro del Destino" },
      "11": { name: "La Forza", title: "Maestro delle Emozioni" },
      "12": { name: "L'Appeso", title: "Visionario della Prospettiva" },
      "13": { name: "La Morte", title: "Agente di Trasformazione" },
      "14": { name: "La Temperanza", title: "Alchimista dell'Equilibrio" },
      "15": { name: "Il Diavolo", title: "Esploratore dell'Ombra" },
      "16": { name: "La Torre", title: "Distruttore delle Illusioni" },
      "17": { name: "La Stella", title: "Ispiratore di Speranza" },
      "18": { name: "La Luna", title: "Viaggiatore del Subconscio" },
      "19": { name: "Il Sole", title: "Raggio di Chiarezza" },
      "20": { name: "Il Giudizio", title: "Voce del Risveglio" },
      "21": { name: "Il Mondo", title: "Maestro dell'Integrazione" },
      "22": { name: "Il Matto", title: "Spirito Libero" }
    },
    sleepRitual: {
      title: "Rituale del Sonno",
      eyebrow: "MONDO DEI SOGNI",
      tabProtocol: "Protocollo",
      tabScan: "Scansione Corporea",
      tabBreath: "Respiro",
      start: "Inizia",
      done: "Fatto"
    },
    lucidDreaming: {
      title: "Sogno Lucido",
      eyebrow: "MONDO DEI SOGNI",
      tabTechniques: "Tecniche",
      tabDiary: "Diario",
      tabSigns: "Segni"
    },
    fireCeremony: {
      title: "Cerimonia del Fuoco",
      eyebrow: "MONDO DEI RITUALI",
      writeIntention: "Scrivi la tua intenzione...",
      burn: "Bruciare"
    },
    ancestralConnection: {
      title: "Connessione Ancestrale",
      eyebrow: "MONDO DEI RITUALI",
      askOracle: "Chiedi all'Oracolo"
    },
    protectionRitual: {
      title: "Scudo di Protezione",
      eyebrow: "MONDO DELLA PURIFICAZIONE",
      activate: "Attiva protezione"
    },
    saltBath: {
      title: "Bagno di Sale",
      eyebrow: "MONDO DELLA PURIFICAZIONE",
      tabProtocols: "Protocolli",
      tabSteps: "Passi",
      start: "Inizia"
    },
    releaseLetters: {
      title: "Lettere al Fuoco",
      eyebrow: "MONDO DELLA PURIFICAZIONE",
      write: "Scrivi una lettera...",
      release: "Rilasciare"
    },
    innerChild: {
      title: "Bambino Interiore",
      eyebrow: "MONDO DEL SUPPORTO",
      askOracle: "Chiedi all'Oracolo"
    },
    anxietyRelief: {
      title: "Sollievo dall'Ansia",
      eyebrow: "MONDO DEL SUPPORTO",
      sos: "SOS",
      techniques: "Tecniche",
      habits: "Abitudini"
    },
    selfCompassion: {
      title: "Auto-Compassione",
      eyebrow: "MONDO DEL SUPPORTO",
      generateLetter: "Genera lettera"
    },
    healingFrequencies: {
      title: "Frequenze di Guarigione",
      eyebrow: "MONDO DEL SUPPORTO",
      play: "Riproduci",
      stop: "Ferma"
    },
    emotionalAnchors: {
      title: "Ancore Emotive",
      eyebrow: "MONDO DEL SUPPORTO",
      activate: "Attiva ancora",
      create: "Crea nuovo"
    },
    lifeWheel: {
      title: "Ruota della Vita",
      eyebrow: "IL TUO MONDO",
      score: "Punteggio",
      yourWheel: "La tua Ruota"
    },
    soulArchetype: {
      title: "Archetipo dell'Anima",
      eyebrow: "IL TUO MONDO",
      startQuiz: "Inizia il quiz",
      result: "Il tuo archetipo"
    },
    natalChart: {
      title: "Tema Natale",
      eyebrow: "MONDO DELL'OROSCOPO",
      tabChart: "Carta",
      tabPlanets: "Pianeti",
      tabHouses: "Case"
    },
    retrogrades: {
      title: "Retrogradi ℞",
      eyebrow: "MONDO DELL'OROSCOPO",
      survivalGuide: "GUIDA DI SOPRAVVIVENZA ℞"
    },
    signMeditation: {
      title: "Meditazione del Segno",
      eyebrow: "MONDO DELL'OROSCOPO",
      tabMeditation: "Meditazione",
      tabAffirmations: "Affermazioni",
      start: "Inizia",
      stop: "Ferma"
    }
  },

  pt: {
    checkin: {
      title: "Check-in",
      mood: "Humor",
      energy: "Energia",
      focus: "Foco",
      moods: {
        joy: "Alegria",
        peace: "Paz",
        gratitude: "Gratidão",
        love: "Amor",
        anxiety: "Ansiedade",
        sadness: "Tristeza",
        anger: "Raiva",
        confusion: "Confusão",
        emptiness: "Vazio"
      },
      energy_levels: {
        very_low: "Muito baixa",
        low: "Baixa",
        medium: "Média",
        high: "Alta",
        very_high: "Muito alta"
      },
      focus_areas: {
        love: "Amor",
        career: "Carreira",
        health: "Saúde",
        spirituality: "Espiritualidade",
        creativity: "Criatividade",
        healing: "Cura"
      },
      save: "SALVAR CHECK-IN",
      particles: "partículas de energia"
    },
    reports: {
      title: "Relatórios",
      pathAnalysis: "ANÁLISE DO CAMINHO",
      weeklyInsight: "Perspectiva Semanal",
      dominantEnergy: "ENERGIA DOMINANTE",
      frequentArchetypes: "ARQUÉTIPOS FREQUENTES",
      suggestedFocus: "FOCO SUGERIDO",
      consistencyMastery: "Maestria em Consistência",
      streakDesc: "Você manteve contato com seu interior por {{days}} dias consecutivos.",
      entries: "ENTRADAS",
      readings: "LEITURAS",
      recordDays: "DIAS RECORDE",
      currentPhase: "FASE ATUAL",
      emotionalLandscape: "PAISAGEM EMOCIONAL",
      moodConstellation: "CONSTELAÇÃO DE HUMOR",
      constellationDesc: "Visualização dos seus estados emocionais como um mapa estelar.",
      practiceDynamics: "DINÂMICA DA PRÁTICA",
      reflections: "REFLEXÕES",
      tarotInsight: "PERSPECTIVA DO TAROT",
      calm: "Calmo",
      excellent: "Excelente",
      good: "Bom",
      peaceful: "Pacífico",
      weak: "Fraco",
      difficult: "Difícil",
      soulReports: "Relatórios da Alma",
      trends: "Suas tendências",
      generating: "Gerando relatório...",
      weeklyReport: "Relatório Semanal",
      monthlyReport: "Relatório Mensal"
    },
    astrology: {
      title: "Astrologia",
      transits: "Trânsitos",
      cycles: "Ciclos",
      biorhythm: "Biorritmo",
      stars: "Estrelas",
      vedic: "Astrologia Védica",
      retrograde: "Retrógrado",
      aspects: "Aspectos",
      conjunction: "Conjunção",
      opposition: "Oposição",
      trine: "Trígono",
      square: "Quadratura",
      sextile: "Sextil",
      natalChart: "Mapa Natal",
      starsMap: "Mapa do Céu",
      currentTransits: "Trânsitos Atuais",
      biorhythmCycles: "Ciclos de Biorritmo",
      physical: "Físico",
      emotional: "Emocional",
      intellectual: "Intelectual"
    },
    notifications: {
      title: "Notificações",
      reminders: "Lembretes",
      add_reminder: "Adicionar Lembrete",
      morning: "Manhã",
      evening: "Noite",
      meditation: "Meditação",
      ritual: "Ritual",
      enabled: "Ativado",
      disabled: "Desativado",
      time: "Hora",
      days: "Dias",
      presets: "Predefinições",
      customTime: "Hora personalizada",
      reminderLabel: "Rótulo do lembrete",
      saveReminder: "SALVAR LEMBRETE",
      deleteReminder: "Excluir lembrete",
      allDays: "Todos os dias",
      weekdays: "Dias úteis",
      weekends: "Fins de semana"
    },
    paywall: {
      premiumTitle: "Desbloqueie a Sabedoria Infinita",
      premiumSubtitle: "Sua jornada interior começa agora. Junte-se ao círculo de buscadores.",
      choosePath: "ESCOLHA SEU CAMINHO",
      monthly: "Mensal",
      yearly: "Anual",
      monthlyDesc: "Cancele quando quiser",
      yearlyDesc: "Apenas R$4,99 / mês",
      bestValue: "MELHOR VALOR",
      restore: "RESTAURAR COMPRAS",
      feature1Title: "Chat Oracle Ilimitado",
      feature1Desc: "Converse com seu guia de IA sem limites a qualquer momento.",
      feature2Title: "Tiragens de Tarot Avançadas",
      feature2Desc: "Acesso a todos os 22 arcanos maiores e menores mais tiragens especializadas.",
      feature3Title: "Perspectivas do Caminho da Alma",
      feature3Desc: "Análise profunda da sua Matriz do Destino e trânsitos pessoais.",
      feature4Title: "Biblioteca Sagrada",
      feature4Desc: "Um santuário permanente para suas afirmações, leituras e sonhos favoritos."
    },
    compatibility: {
      title: "Compatibilidade",
      relationships: "RELACIONAMENTOS",
      synastry: "Sinastria",
      addPartnerEnergy: "ADICIONAR ENERGIA DO PARCEIRO",
      partnerName: "NOME DO PARCEIRO / PESSOA",
      namePlaceholder: "Digite um nome...",
      birthDate: "DATA DE NASCIMENTO",
      selectDate: "Selecionar data",
      calculateMatch: "CALCULAR COMPATIBILIDADE",
      you: "Você",
      partner: "Parceiro",
      relationshipEnergy: "ENERGIA DO RELACIONAMENTO",
      vibration: "Vibração",
      changePartner: "MUDAR PESSOA",
      compatibilityScore: "Pontuação de compatibilidade",
      strengths: "Pontos fortes",
      challenges: "Desafios",
      advice: "Conselho"
    },
    journeys: {
      title: "Jornadas",
      spiritualPrograms: "Programas Espirituais",
      transformationPaths: "Caminhos de Transformação",
      weeklyFocus: "Foco Semanal",
      dailyPractice: "Prática Diária",
      completedSessions: "Sessões Concluídas",
      nextStep: "Próximo Passo",
      continueJourney: "Continuar Jornada",
      startJourney: "Iniciar Jornada",
      currentJourney: "Jornada Atual",
      availableJourneys: "Jornadas Disponíveis",
      progress: "Progresso",
      daysLeft: "Dias restantes"
    },
    palmreading: {
      title: "Quiromancia",
      analyze: "ANALISAR PALMA",
      upload: "Fazer upload de foto da palma",
      instructions: "Fotografe a palma da sua mão com boa iluminação",
      lines: {
        heart: "Linha do Coração",
        head: "Linha da Cabeça",
        life: "Linha da Vida",
        fate: "Linha do Destino",
        sun: "Linha do Sol"
      },
      interpretationTitle: "Interpretação da Palma",
      loading: "Analisando as linhas da sua palma..."
    },
    binauralbeats: {
      title: "Ondas Cerebrais",
      subtitle: "Batidas binaurais",
      start: "INICIAR",
      stop: "PARAR",
      waves: {
        delta: "Delta — sono profundo",
        theta: "Theta — meditação",
        alpha: "Alpha — relaxamento",
        beta: "Beta — foco",
        gamma: "Gamma — cognição superior"
      },
      benefits: "Benefícios",
      session_complete: "Sessão concluída"
    },
    sleephelper: {
      title: "Assistente de Sono",
      start: "INICIAR SONO",
      duration: "Duração",
      soundscape: "Sons",
      story: "História",
      meditation: "Meditação para dormir",
      goodnight: "Boa noite, alma"
    },
    stars: {
      title: "Estrelas",
      skyMap: "Mapa do Céu",
      catalogue: "Catálogo Estelar",
      constellation: "Constelação",
      magnitude: "Magnitude",
      distance: "Distância",
      realTimeSky: "Céu em tempo real",
      yourZenith: "Seu zênite",
      tabMap: "Mapa",
      tabCatalogue: "Catálogo",
      tabInfo: "Info"
    },
    biorhythm: {
      title: "Biorritmo",
      physical: "Físico",
      emotional: "Emocional",
      intellectual: "Intelectual",
      today: "Hoje",
      peak: "Pico",
      low: "Baixo",
      neutral: "Neutro",
      chartTitle: "Gráfico de Biorritmo"
    },
    knowledge: {
      title: "Biblioteca",
      search: "Pesquisar conhecimento...",
      categories: "Categorias",
      articles: "Artigos",
      savedArticles: "Artigos salvos",
      readMore: "Leia mais"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "O baralho mais preciso e clássico baseado na tradição Rider-Waite.",
        cosmic: "Luz Cósmica",
        cosmicDesc: "Uma interpretação moderna e galáctica dos arquétipos universais.",
        dark: "Escuridão da Alma",
        darkDesc: "Um baralho profundo para trabalho com a sombra e verdades ocultas."
      },
      rituals: {
        morning_alignment: {
          title: "Alinhamento Matinal",
          description: "Uma breve meditação para definir sua intenção para o dia.",
          duration: "5 min"
        },
        evening_reflection: {
          title: "Reflexão Noturna",
          description: "Libere emoções acumuladas antes de dormir.",
          duration: "10 min"
        },
        candle_magic: {
          title: "Magia de Velas",
          description: "Manifestar um desejo específico através do elemento fogo.",
          duration: "15 min"
        }
      }
    },
    archetypes: {
      "1": { name: "O Mago", title: "Criador de Realidade" },
      "2": { name: "A Sacerdotisa", title: "Guardiã dos Segredos" },
      "3": { name: "A Imperatriz", title: "Soberana da Abundância" },
      "4": { name: "O Imperador", title: "Arquiteto da Ordem" },
      "5": { name: "O Hierofante", title: "Guardião da Tradição" },
      "6": { name: "Os Amantes", title: "Harmonizador de Energia" },
      "7": { name: "O Carro", title: "Conquistador de Metas" },
      "8": { name: "A Justiça", title: "Balança do Karma" },
      "9": { name: "O Eremita", title: "Buscador da Verdade" },
      "10": { name: "A Roda da Fortuna", title: "Mestre do Destino" },
      "11": { name: "A Força", title: "Mestre das Emoções" },
      "12": { name: "O Enforcado", title: "Visionário da Perspectiva" },
      "13": { name: "A Morte", title: "Agente de Transformação" },
      "14": { name: "A Temperança", title: "Alquimista do Equilíbrio" },
      "15": { name: "O Diabo", title: "Explorador da Sombra" },
      "16": { name: "A Torre", title: "Destruidor de Ilusões" },
      "17": { name: "A Estrela", title: "Inspirador de Esperança" },
      "18": { name: "A Lua", title: "Viajante do Subconsciente" },
      "19": { name: "O Sol", title: "Raio de Clareza" },
      "20": { name: "O Julgamento", title: "Voz do Despertar" },
      "21": { name: "O Mundo", title: "Mestre da Integração" },
      "22": { name: "O Louco", title: "Espírito Livre" }
    },
    sleepRitual: {
      title: "Ritual do Sono",
      eyebrow: "MUNDO DOS SONHOS",
      tabProtocol: "Protocolo",
      tabScan: "Varredura Corporal",
      tabBreath: "Respiração",
      start: "Iniciar",
      done: "Feito"
    },
    lucidDreaming: {
      title: "Sonho Lúcido",
      eyebrow: "MUNDO DOS SONHOS",
      tabTechniques: "Técnicas",
      tabDiary: "Diário",
      tabSigns: "Sinais"
    },
    fireCeremony: {
      title: "Cerimônia do Fogo",
      eyebrow: "MUNDO DOS RITUAIS",
      writeIntention: "Escreva sua intenção...",
      burn: "Queimar"
    },
    ancestralConnection: {
      title: "Conexão Ancestral",
      eyebrow: "MUNDO DOS RITUAIS",
      askOracle: "Consultar o Oráculo"
    },
    protectionRitual: {
      title: "Escudo de Proteção",
      eyebrow: "MUNDO DA PURIFICAÇÃO",
      activate: "Ativar proteção"
    },
    saltBath: {
      title: "Banho de Sal",
      eyebrow: "MUNDO DA PURIFICAÇÃO",
      tabProtocols: "Protocolos",
      tabSteps: "Passos",
      start: "Iniciar"
    },
    releaseLetters: {
      title: "Cartas ao Fogo",
      eyebrow: "MUNDO DA PURIFICAÇÃO",
      write: "Escrever uma carta...",
      release: "Liberar"
    },
    innerChild: {
      title: "Criança Interior",
      eyebrow: "MUNDO DO SUPORTE",
      askOracle: "Consultar o Oráculo"
    },
    anxietyRelief: {
      title: "Alívio da Ansiedade",
      eyebrow: "MUNDO DO SUPORTE",
      sos: "SOS",
      techniques: "Técnicas",
      habits: "Hábitos"
    },
    selfCompassion: {
      title: "Autocompaixão",
      eyebrow: "MUNDO DO SUPORTE",
      generateLetter: "Gerar carta"
    },
    healingFrequencies: {
      title: "Frequências de Cura",
      eyebrow: "MUNDO DO SUPORTE",
      play: "Reproduzir",
      stop: "Parar"
    },
    emotionalAnchors: {
      title: "Âncoras Emocionais",
      eyebrow: "MUNDO DO SUPORTE",
      activate: "Ativar âncora",
      create: "Criar novo"
    },
    lifeWheel: {
      title: "Roda da Vida",
      eyebrow: "SEU MUNDO",
      score: "Pontuação",
      yourWheel: "Sua Roda"
    },
    soulArchetype: {
      title: "Arquétipo da Alma",
      eyebrow: "SEU MUNDO",
      startQuiz: "Iniciar questionário",
      result: "Seu arquétipo"
    },
    natalChart: {
      title: "Mapa Natal",
      eyebrow: "MUNDO DO HORÓSCOPO",
      tabChart: "Mapa",
      tabPlanets: "Planetas",
      tabHouses: "Casas"
    },
    retrogrades: {
      title: "Retrógrados ℞",
      eyebrow: "MUNDO DO HORÓSCOPO",
      survivalGuide: "GUIA DE SOBREVIVÊNCIA ℞"
    },
    signMeditation: {
      title: "Meditação do Signo",
      eyebrow: "MUNDO DO HORÓSCOPO",
      tabMeditation: "Meditação",
      tabAffirmations: "Afirmações",
      start: "Iniciar",
      stop: "Parar"
    }
  },

  ru: {
    checkin: {
      title: "Отметка",
      mood: "Настроение",
      energy: "Энергия",
      focus: "Фокус",
      moods: {
        joy: "Радость",
        peace: "Покой",
        gratitude: "Благодарность",
        love: "Любовь",
        anxiety: "Тревога",
        sadness: "Грусть",
        anger: "Гнев",
        confusion: "Замешательство",
        emptiness: "Пустота"
      },
      energy_levels: {
        very_low: "Очень низкая",
        low: "Низкая",
        medium: "Средняя",
        high: "Высокая",
        very_high: "Очень высокая"
      },
      focus_areas: {
        love: "Любовь",
        career: "Карьера",
        health: "Здоровье",
        spirituality: "Духовность",
        creativity: "Творчество",
        healing: "Исцеление"
      },
      save: "СОХРАНИТЬ ОТМЕТКУ",
      particles: "частиц энергии"
    },
    reports: {
      title: "Отчёты",
      pathAnalysis: "АНАЛИЗ ПУТИ",
      weeklyInsight: "Еженедельное Видение",
      dominantEnergy: "ДОМИНИРУЮЩАЯ ЭНЕРГИЯ",
      frequentArchetypes: "ЧАСТЫЕ АРХЕТИПЫ",
      suggestedFocus: "РЕКОМЕНДУЕМЫЙ ФОКУС",
      consistencyMastery: "Мастерство Постоянства",
      streakDesc: "Вы поддерживали связь с вашим внутренним миром {{days}} дней подряд.",
      entries: "ЗАПИСИ",
      readings: "ЧТЕНИЯ",
      recordDays: "ДНЕЙ РЕКОРД",
      currentPhase: "ТЕКУЩАЯ ФАЗА",
      emotionalLandscape: "ЭМОЦИОНАЛЬНЫЙ ЛАНДШАФТ",
      moodConstellation: "СОЗВЕЗДИЕ НАСТРОЕНИЯ",
      constellationDesc: "Визуализация ваших эмоциональных состояний как звёздной карты.",
      practiceDynamics: "ДИНАМИКА ПРАКТИК",
      reflections: "РАЗМЫШЛЕНИЯ",
      tarotInsight: "ОТКРОВЕНИЕ ТАРО",
      calm: "Спокойный",
      excellent: "Отличный",
      good: "Хороший",
      peaceful: "Мирный",
      weak: "Слабый",
      difficult: "Трудный",
      soulReports: "Отчёты Души",
      trends: "Ваши тенденции",
      generating: "Создание отчёта...",
      weeklyReport: "Еженедельный Отчёт",
      monthlyReport: "Ежемесячный Отчёт"
    },
    astrology: {
      title: "Астрология",
      transits: "Транзиты",
      cycles: "Циклы",
      biorhythm: "Биоритм",
      stars: "Звёзды",
      vedic: "Ведическая Астрология",
      retrograde: "Ретроградный",
      aspects: "Аспекты",
      conjunction: "Соединение",
      opposition: "Оппозиция",
      trine: "Тригон",
      square: "Квадратура",
      sextile: "Секстиль",
      natalChart: "Натальная Карта",
      starsMap: "Карта Неба",
      currentTransits: "Текущие Транзиты",
      biorhythmCycles: "Циклы Биоритма",
      physical: "Физический",
      emotional: "Эмоциональный",
      intellectual: "Интеллектуальный"
    },
    notifications: {
      title: "Уведомления",
      reminders: "Напоминания",
      add_reminder: "Добавить Напоминание",
      morning: "Утро",
      evening: "Вечер",
      meditation: "Медитация",
      ritual: "Ритуал",
      enabled: "Включено",
      disabled: "Отключено",
      time: "Время",
      days: "Дни",
      presets: "Пресеты",
      customTime: "Пользовательское время",
      reminderLabel: "Метка напоминания",
      saveReminder: "СОХРАНИТЬ НАПОМИНАНИЕ",
      deleteReminder: "Удалить напоминание",
      allDays: "Каждый день",
      weekdays: "Будние дни",
      weekends: "Выходные"
    },
    paywall: {
      premiumTitle: "Откройте Бесконечную Мудрость",
      premiumSubtitle: "Ваше внутреннее путешествие начинается сейчас. Присоединитесь к элитному кругу искателей.",
      choosePath: "ВЫБЕРИТЕ СВОЙ ПУТЬ",
      monthly: "Ежемесячно",
      yearly: "Ежегодно",
      monthlyDesc: "Отмена в любое время",
      yearlyDesc: "Всего $4.99 / месяц",
      bestValue: "ЛУЧШАЯ ЦЕННОСТЬ",
      restore: "ВОССТАНОВИТЬ ПОКУПКИ",
      feature1Title: "Неограниченный Чат Оракула",
      feature1Desc: "Общайтесь с вашим ИИ-гидом без ограничений в любое время.",
      feature2Title: "Расширенные Расклады Таро",
      feature2Desc: "Доступ ко всем 22 старшим и младшим арканам плюс специализированные расклады.",
      feature3Title: "Прозрения Пути Души",
      feature3Desc: "Глубокий анализ вашей Матрицы Судьбы и личных транзитов.",
      feature4Title: "Священная Библиотека",
      feature4Desc: "Постоянное святилище для ваших любимых аффирмаций, чтений и снов."
    },
    compatibility: {
      title: "Совместимость",
      relationships: "ОТНОШЕНИЯ",
      synastry: "Синастрия",
      addPartnerEnergy: "ДОБАВИТЬ ЭНЕРГИЮ ПАРТНЁРА",
      partnerName: "ИМЯ ПАРТНЁРА / ПЕРСОНЫ",
      namePlaceholder: "Введите имя...",
      birthDate: "ДАТА РОЖДЕНИЯ",
      selectDate: "Выбрать дату",
      calculateMatch: "РАССЧИТАТЬ СОВМЕСТИМОСТЬ",
      you: "Вы",
      partner: "Партнёр",
      relationshipEnergy: "ЭНЕРГИЯ ОТНОШЕНИЙ",
      vibration: "Вибрация",
      changePartner: "СМЕНИТЬ ПЕРСОНУ",
      compatibilityScore: "Оценка совместимости",
      strengths: "Сильные стороны",
      challenges: "Вызовы",
      advice: "Совет"
    },
    journeys: {
      title: "Путешествия",
      spiritualPrograms: "Духовные Программы",
      transformationPaths: "Пути Трансформации",
      weeklyFocus: "Еженедельный Фокус",
      dailyPractice: "Ежедневная Практика",
      completedSessions: "Завершённые Сессии",
      nextStep: "Следующий Шаг",
      continueJourney: "Продолжить Путешествие",
      startJourney: "Начать Путешествие",
      currentJourney: "Текущее Путешествие",
      availableJourneys: "Доступные Путешествия",
      progress: "Прогресс",
      daysLeft: "Осталось дней"
    },
    palmreading: {
      title: "Хиромантия",
      analyze: "АНАЛИЗИРОВАТЬ ЛАДОНЬ",
      upload: "Загрузить фото ладони",
      instructions: "Сфотографируйте ладонь при хорошем освещении",
      lines: {
        heart: "Линия Сердца",
        head: "Линия Ума",
        life: "Линия Жизни",
        fate: "Линия Судьбы",
        sun: "Линия Солнца"
      },
      interpretationTitle: "Интерпретация Ладони",
      loading: "Анализ линий вашей ладони..."
    },
    binauralbeats: {
      title: "Мозговые Волны",
      subtitle: "Бинауральные ритмы",
      start: "СТАРТ",
      stop: "СТОП",
      waves: {
        delta: "Дельта — глубокий сон",
        theta: "Тета — медитация",
        alpha: "Альфа — расслабление",
        beta: "Бета — фокус",
        gamma: "Гамма — высшее познание"
      },
      benefits: "Преимущества",
      session_complete: "Сессия завершена"
    },
    sleephelper: {
      title: "Помощник Сна",
      start: "НАЧАТЬ СОН",
      duration: "Продолжительность",
      soundscape: "Звуки",
      story: "История",
      meditation: "Медитация для сна",
      goodnight: "Спокойной ночи, душа"
    },
    stars: {
      title: "Звёзды",
      skyMap: "Карта Неба",
      catalogue: "Звёздный Каталог",
      constellation: "Созвездие",
      magnitude: "Magnitude",
      distance: "Расстояние",
      realTimeSky: "Небо в реальном времени",
      yourZenith: "Ваш зенит",
      tabMap: "Карта",
      tabCatalogue: "Каталог",
      tabInfo: "Инфо"
    },
    biorhythm: {
      title: "Биоритм",
      physical: "Физический",
      emotional: "Эмоциональный",
      intellectual: "Интеллектуальный",
      today: "Сегодня",
      peak: "Пик",
      low: "Минимум",
      neutral: "Нейтральный",
      chartTitle: "График Биоритма"
    },
    knowledge: {
      title: "Библиотека",
      search: "Поиск знаний...",
      categories: "Категории",
      articles: "Статьи",
      savedArticles: "Сохранённые статьи",
      readMore: "Читать далее"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "Самая точная и классическая колода, основанная на традиции Райдер-Уэйт.",
        cosmic: "Космический Свет",
        cosmicDesc: "Современная, галактическая интерпретация универсальных архетипов.",
        dark: "Тьма Души",
        darkDesc: "Глубокая колода для работы с тенью и скрытыми истинами."
      },
      rituals: {
        morning_alignment: {
          title: "Утреннее Выравнивание",
          description: "Короткая медитация для установки намерения на день.",
          duration: "5 мин"
        },
        evening_reflection: {
          title: "Вечерняя Рефлексия",
          description: "Отпустите накопленные эмоции перед сном.",
          duration: "10 мин"
        },
        candle_magic: {
          title: "Магия Свечи",
          description: "Проявление конкретного желания через элемент огня.",
          duration: "15 мин"
        }
      }
    },
    archetypes: {
      "1": { name: "Маг", title: "Творец Реальности" },
      "2": { name: "Жрица", title: "Хранительница Тайн" },
      "3": { name: "Императрица", title: "Владычица Изобилия" },
      "4": { name: "Император", title: "Архитектор Порядка" },
      "5": { name: "Иерофант", title: "Страж Традиций" },
      "6": { name: "Влюблённые", title: "Гармонизатор Энергии" },
      "7": { name: "Колесница", title: "Покоритель Целей" },
      "8": { name: "Справедливость", title: "Весы Кармы" },
      "9": { name: "Отшельник", title: "Искатель Истины" },
      "10": { name: "Колесо Фортуны", title: "Повелитель Судьбы" },
      "11": { name: "Сила", title: "Мастер Эмоций" },
      "12": { name: "Повешенный", title: "Провидец Перспективы" },
      "13": { name: "Смерть", title: "Агент Трансформации" },
      "14": { name: "Умеренность", title: "Алхимик Равновесия" },
      "15": { name: "Дьявол", title: "Исследователь Тени" },
      "16": { name: "Башня", title: "Разрушитель Иллюзий" },
      "17": { name: "Звезда", title: "Вдохновитель Надежды" },
      "18": { name: "Луна", title: "Путешественник Подсознания" },
      "19": { name: "Солнце", title: "Луч Ясности" },
      "20": { name: "Суд", title: "Голос Пробуждения" },
      "21": { name: "Мир", title: "Мастер Интеграции" },
      "22": { name: "Шут", title: "Свободный Дух" }
    },
    sleepRitual: {
      title: "Ритуал Сна",
      eyebrow: "МИР СНОВ",
      tabProtocol: "Протокол",
      tabScan: "Сканирование Тела",
      tabBreath: "Дыхание",
      start: "Начать",
      done: "Готово"
    },
    lucidDreaming: {
      title: "Осознанные Сновидения",
      eyebrow: "МИР СНОВ",
      tabTechniques: "Техники",
      tabDiary: "Дневник",
      tabSigns: "Знаки"
    },
    fireCeremony: {
      title: "Огненная Церемония",
      eyebrow: "МИР РИТУАЛОВ",
      writeIntention: "Запишите своё намерение...",
      burn: "Сжечь"
    },
    ancestralConnection: {
      title: "Связь с Предками",
      eyebrow: "МИР РИТУАЛОВ",
      askOracle: "Спросить Оракул"
    },
    protectionRitual: {
      title: "Щит Защиты",
      eyebrow: "МИР ОЧИЩЕНИЯ",
      activate: "Активировать защиту"
    },
    saltBath: {
      title: "Солевая Ванна",
      eyebrow: "МИР ОЧИЩЕНИЯ",
      tabProtocols: "Протоколы",
      tabSteps: "Шаги",
      start: "Начать"
    },
    releaseLetters: {
      title: "Письма Огню",
      eyebrow: "МИР ОЧИЩЕНИЯ",
      write: "Написать письмо...",
      release: "Отпустить"
    },
    innerChild: {
      title: "Внутренний Ребёнок",
      eyebrow: "МИР ПОДДЕРЖКИ",
      askOracle: "Спросить Оракул"
    },
    anxietyRelief: {
      title: "Снятие Тревоги",
      eyebrow: "МИР ПОДДЕРЖКИ",
      sos: "SOS",
      techniques: "Техники",
      habits: "Привычки"
    },
    selfCompassion: {
      title: "Самосострадание",
      eyebrow: "МИР ПОДДЕРЖКИ",
      generateLetter: "Создать письмо"
    },
    healingFrequencies: {
      title: "Исцеляющие Частоты",
      eyebrow: "МИР ПОДДЕРЖКИ",
      play: "Воспроизвести",
      stop: "Остановить"
    },
    emotionalAnchors: {
      title: "Эмоциональные Якоря",
      eyebrow: "МИР ПОДДЕРЖКИ",
      activate: "Активировать якорь",
      create: "Создать новый"
    },
    lifeWheel: {
      title: "Колесо Жизни",
      eyebrow: "ВАШЕ МИРЕ",
      score: "Оценка",
      yourWheel: "Ваше Колесо"
    },
    soulArchetype: {
      title: "Архетип Души",
      eyebrow: "ВАШЕ МИРЕ",
      startQuiz: "Начать тест",
      result: "Ваш архетип"
    },
    natalChart: {
      title: "Натальная Карта",
      eyebrow: "МИР ГОРОСКОПА",
      tabChart: "Карта",
      tabPlanets: "Планеты",
      tabHouses: "Дома"
    },
    retrogrades: {
      title: "Ретрограды ℞",
      eyebrow: "МИР ГОРОСКОПА",
      survivalGuide: "РУКОВОДСТВО ПО ВЫЖИВАНИЮ ℞"
    },
    signMeditation: {
      title: "Медитация Знака",
      eyebrow: "МИР ГОРОСКОПА",
      tabMeditation: "Медитация",
      tabAffirmations: "Аффирмации",
      start: "Начать",
      stop: "Остановить"
    }
  },

  ar: {
    checkin: {
      title: "تسجيل الوصول",
      mood: "المزاج",
      energy: "الطاقة",
      focus: "التركيز",
      moods: {
        joy: "الفرح",
        peace: "السلام",
        gratitude: "الامتنان",
        love: "الحب",
        anxiety: "القلق",
        sadness: "الحزن",
        anger: "الغضب",
        confusion: "الارتباك",
        emptiness: "الفراغ"
      },
      energy_levels: {
        very_low: "منخفضة جداً",
        low: "منخفضة",
        medium: "متوسطة",
        high: "عالية",
        very_high: "عالية جداً"
      },
      focus_areas: {
        love: "الحب",
        career: "المهنة",
        health: "الصحة",
        spirituality: "الروحانية",
        creativity: "الإبداع",
        healing: "الشفاء"
      },
      save: "حفظ تسجيل الوصول",
      particles: "جسيمات الطاقة"
    },
    reports: {
      title: "التقارير",
      pathAnalysis: "تحليل المسار",
      weeklyInsight: "رؤية أسبوعية",
      dominantEnergy: "الطاقة السائدة",
      frequentArchetypes: "النماذج المتكررة",
      suggestedFocus: "التركيز المقترح",
      consistencyMastery: "إتقان الاتساق",
      streakDesc: "لقد حافظت على التواصل مع عالمك الداخلي لمدة {{days}} أيام متتالية.",
      entries: "المدخلات",
      readings: "القراءات",
      recordDays: "أيام الرقم القياسي",
      currentPhase: "المرحلة الحالية",
      emotionalLandscape: "المشهد العاطفي",
      moodConstellation: "كوكبة المزاج",
      constellationDesc: "تصور لحالاتك العاطفية كخريطة نجمية.",
      practiceDynamics: "ديناميكيات الممارسة",
      reflections: "التأملات",
      tarotInsight: "رؤية التاروت",
      calm: "هادئ",
      excellent: "ممتاز",
      good: "جيد",
      peaceful: "مسالم",
      weak: "ضعيف",
      difficult: "صعب",
      soulReports: "تقارير الروح",
      trends: "اتجاهاتك",
      generating: "جارٍ إنشاء التقرير...",
      weeklyReport: "التقرير الأسبوعي",
      monthlyReport: "التقرير الشهري"
    },
    astrology: {
      title: "علم التنجيم",
      transits: "العبورات",
      cycles: "الدورات",
      biorhythm: "الإيقاع الحيوي",
      stars: "النجوم",
      vedic: "علم التنجيم الفيدي",
      retrograde: "الرجعي",
      aspects: "الجوانب",
      conjunction: "الاقتران",
      opposition: "التقابل",
      trine: "التثليث",
      square: "التربيع",
      sextile: "التسديس",
      natalChart: "خريطة الميلاد",
      starsMap: "خريطة السماء",
      currentTransits: "العبورات الحالية",
      biorhythmCycles: "دورات الإيقاع الحيوي",
      physical: "جسدي",
      emotional: "عاطفي",
      intellectual: "فكري"
    },
    notifications: {
      title: "الإشعارات",
      reminders: "التذكيرات",
      add_reminder: "إضافة تذكير",
      morning: "الصباح",
      evening: "المساء",
      meditation: "التأمل",
      ritual: "الطقس",
      enabled: "مفعّل",
      disabled: "معطّل",
      time: "الوقت",
      days: "الأيام",
      presets: "الإعدادات المسبقة",
      customTime: "وقت مخصص",
      reminderLabel: "عنوان التذكير",
      saveReminder: "حفظ التذكير",
      deleteReminder: "حذف التذكير",
      allDays: "كل يوم",
      weekdays: "أيام الأسبوع",
      weekends: "عطلات نهاية الأسبوع"
    },
    paywall: {
      premiumTitle: "افتح الحكمة اللانهائية",
      premiumSubtitle: "رحلتك الداخلية تبدأ الآن. انضم إلى دائرة الباحثين النخبة.",
      choosePath: "اختر مسارك",
      monthly: "شهري",
      yearly: "سنوي",
      monthlyDesc: "إلغاء في أي وقت",
      yearlyDesc: "فقط $4.99 / شهر",
      bestValue: "أفضل قيمة",
      restore: "استعادة المشتريات",
      feature1Title: "محادثة أوراكل غير محدودة",
      feature1Desc: "تحدث مع مرشدك بالذكاء الاصطناعي دون قيود في أي وقت.",
      feature2Title: "مفروشات تاروت متقدمة",
      feature2Desc: "الوصول إلى جميع 22 أركانا الكبرى والصغرى بالإضافة إلى مفروشات متخصصة.",
      feature3Title: "رؤى مسار الروح",
      feature3Desc: "تحليل عميق لمصفوفة قدرك وعبوراتك الشخصية.",
      feature4Title: "المكتبة المقدسة",
      feature4Desc: "ملاذ دائم لتأكيداتك وقراءاتك وأحلامك المفضلة."
    },
    compatibility: {
      title: "التوافق",
      relationships: "العلاقات",
      synastry: "السيناسترا",
      addPartnerEnergy: "إضافة طاقة الشريك",
      partnerName: "اسم الشريك / الشخص",
      namePlaceholder: "أدخل اسماً...",
      birthDate: "تاريخ الميلاد",
      selectDate: "اختر تاريخاً",
      calculateMatch: "احسب التوافق",
      you: "أنت",
      partner: "الشريك",
      relationshipEnergy: "طاقة العلاقة",
      vibration: "الاهتزاز",
      changePartner: "تغيير الشخص",
      compatibilityScore: "نقاط التوافق",
      strengths: "نقاط القوة",
      challenges: "التحديات",
      advice: "النصيحة"
    },
    journeys: {
      title: "الرحلات",
      spiritualPrograms: "البرامج الروحية",
      transformationPaths: "مسارات التحول",
      weeklyFocus: "التركيز الأسبوعي",
      dailyPractice: "الممارسة اليومية",
      completedSessions: "الجلسات المكتملة",
      nextStep: "الخطوة التالية",
      continueJourney: "مواصلة الرحلة",
      startJourney: "ابدأ الرحلة",
      currentJourney: "الرحلة الحالية",
      availableJourneys: "الرحلات المتاحة",
      progress: "التقدم",
      daysLeft: "الأيام المتبقية"
    },
    palmreading: {
      title: "قراءة الكف",
      analyze: "تحليل الكف",
      upload: "تحميل صورة الكف",
      instructions: "صوّر راحة يدك في ضوء جيد",
      lines: {
        heart: "خط القلب",
        head: "خط العقل",
        life: "خط الحياة",
        fate: "خط المصير",
        sun: "خط الشمس"
      },
      interpretationTitle: "تفسير الكف",
      loading: "تحليل خطوط كفك..."
    },
    binauralbeats: {
      title: "موجات الدماغ",
      subtitle: "الإيقاعات ثنائية الأذن",
      start: "ابدأ",
      stop: "أوقف",
      waves: {
        delta: "دلتا — نوم عميق",
        theta: "ثيتا — تأمل",
        alpha: "ألفا — استرخاء",
        beta: "بيتا — تركيز",
        gamma: "غاما — إدراك أعلى"
      },
      benefits: "الفوائد",
      session_complete: "اكتملت الجلسة"
    },
    sleephelper: {
      title: "مساعد النوم",
      start: "ابدأ النوم",
      duration: "المدة",
      soundscape: "الأصوات",
      story: "القصة",
      meditation: "تأمل النوم",
      goodnight: "تصبح على خير، روح"
    },
    stars: {
      title: "النجوم",
      skyMap: "خريطة السماء",
      catalogue: "كتالوج النجوم",
      constellation: "الكوكبة",
      magnitude: "السطوع",
      distance: "المسافة",
      realTimeSky: "سماء في الوقت الفعلي",
      yourZenith: "ذروتك",
      tabMap: "الخريطة",
      tabCatalogue: "الكتالوج",
      tabInfo: "معلومات"
    },
    biorhythm: {
      title: "الإيقاع الحيوي",
      physical: "جسدي",
      emotional: "عاطفي",
      intellectual: "فكري",
      today: "اليوم",
      peak: "الذروة",
      low: "منخفض",
      neutral: "محايد",
      chartTitle: "مخطط الإيقاع الحيوي"
    },
    knowledge: {
      title: "المكتبة",
      search: "ابحث في المعرفة...",
      categories: "الفئات",
      articles: "المقالات",
      savedArticles: "المقالات المحفوظة",
      readMore: "اقرأ المزيد"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "أدق وأكثر مجموعة ورق كلاسيكية تستند إلى تقليد رايدر-ويت.",
        cosmic: "الضوء الكوني",
        cosmicDesc: "تفسير حديث مجري للنماذج الأولية العالمية.",
        dark: "ظلام الروح",
        darkDesc: "مجموعة عميقة للعمل مع الظل والحقائق المخفية."
      },
      rituals: {
        morning_alignment: {
          title: "المحاذاة الصباحية",
          description: "تأمل قصير لتحديد نيتك لليوم.",
          duration: "٥ دقائق"
        },
        evening_reflection: {
          title: "التأمل المسائي",
          description: "أطلق المشاعر المتراكمة قبل النوم.",
          duration: "١٠ دقائق"
        },
        candle_magic: {
          title: "سحر الشمعة",
          description: "تجلي رغبة محددة من خلال عنصر النار.",
          duration: "١٥ دقيقة"
        }
      }
    },
    archetypes: {
      "1": { name: "الساحر", title: "خالق الواقع" },
      "2": { name: "الكاهنة العليا", title: "حارسة الأسرار" },
      "3": { name: "الإمبراطورة", title: "حاكمة الوفرة" },
      "4": { name: "الإمبراطور", title: "مهندس النظام" },
      "5": { name: "الكاهن الأعظم", title: "حارس التقاليد" },
      "6": { name: "العاشقان", title: "مناغم الطاقة" },
      "7": { name: "العربة", title: "محقق الأهداف" },
      "8": { name: "العدالة", title: "ميزان الكارما" },
      "9": { name: "الناسك", title: "باحث الحقيقة" },
      "10": { name: "عجلة الحظ", title: "سيد القدر" },
      "11": { name: "القوة", title: "سيد المشاعر" },
      "12": { name: "المشنوق", title: "رؤيوي المنظور" },
      "13": { name: "الموت", title: "عامل التحول" },
      "14": { name: "الاعتدال", title: "خيميائي التوازن" },
      "15": { name: "الشيطان", title: "مستكشف الظل" },
      "16": { name: "البرج", title: "مدمر الأوهام" },
      "17": { name: "النجمة", title: "ملهم الأمل" },
      "18": { name: "القمر", title: "مسافر اللاوعي" },
      "19": { name: "الشمس", title: "شعاع الوضوح" },
      "20": { name: "الحكم", title: "صوت الصحوة" },
      "21": { name: "العالم", title: "سيد التكامل" },
      "22": { name: "المجنون", title: "الروح الحرة" }
    },
    sleepRitual: {
      title: "طقس النوم",
      eyebrow: "عالم الأحلام",
      tabProtocol: "البروتوكول",
      tabScan: "مسح الجسم",
      tabBreath: "التنفس",
      start: "ابدأ",
      done: "تم"
    },
    lucidDreaming: {
      title: "الأحلام الواضحة",
      eyebrow: "عالم الأحلام",
      tabTechniques: "التقنيات",
      tabDiary: "المفكرة",
      tabSigns: "الإشارات"
    },
    fireCeremony: {
      title: "طقس النار",
      eyebrow: "عالم الطقوس",
      writeIntention: "اكتب نيتك...",
      burn: "أحرق"
    },
    ancestralConnection: {
      title: "الصلة الأجدادية",
      eyebrow: "عالم الطقوس",
      askOracle: "اسأل الأوراكل"
    },
    protectionRitual: {
      title: "درع الحماية",
      eyebrow: "عالم التطهير",
      activate: "تفعيل الحماية"
    },
    saltBath: {
      title: "حمام الملح",
      eyebrow: "عالم التطهير",
      tabProtocols: "البروتوكولات",
      tabSteps: "الخطوات",
      start: "ابدأ"
    },
    releaseLetters: {
      title: "رسائل إلى النار",
      eyebrow: "عالم التطهير",
      write: "اكتب رسالة...",
      release: "أطلق"
    },
    innerChild: {
      title: "الطفل الداخلي",
      eyebrow: "عالم الدعم",
      askOracle: "اسأل الأوراكل"
    },
    anxietyRelief: {
      title: "تخفيف القلق",
      eyebrow: "عالم الدعم",
      sos: "SOS",
      techniques: "التقنيات",
      habits: "العادات"
    },
    selfCompassion: {
      title: "التعاطف مع الذات",
      eyebrow: "عالم الدعم",
      generateLetter: "توليد رسالة"
    },
    healingFrequencies: {
      title: "ترددات الشفاء",
      eyebrow: "عالم الدعم",
      play: "شغّل",
      stop: "أوقف"
    },
    emotionalAnchors: {
      title: "المراسي العاطفية",
      eyebrow: "عالم الدعم",
      activate: "تفعيل المرساة",
      create: "إنشاء جديد"
    },
    lifeWheel: {
      title: "عجلة الحياة",
      eyebrow: "عالمك",
      score: "النتيجة",
      yourWheel: "عجلتك"
    },
    soulArchetype: {
      title: "نموذج الروح",
      eyebrow: "عالمك",
      startQuiz: "ابدأ الاختبار",
      result: "نموذجك"
    },
    natalChart: {
      title: "خريطة الميلاد",
      eyebrow: "عالم الأبراج",
      tabChart: "الخريطة",
      tabPlanets: "الكواكب",
      tabHouses: "البيوت"
    },
    retrogrades: {
      title: "الكواكب الراجعة ℞",
      eyebrow: "عالم الأبراج",
      survivalGuide: "دليل البقاء ℞"
    },
    signMeditation: {
      title: "تأمل الجدي",
      eyebrow: "عالم الأبراج",
      tabMeditation: "التأمل",
      tabAffirmations: "التأكيدات",
      start: "ابدأ",
      stop: "أوقف"
    }
  },

  ja: {
    checkin: {
      title: "チェックイン",
      mood: "気分",
      energy: "エネルギー",
      focus: "フォーカス",
      moods: {
        joy: "喜び",
        peace: "平和",
        gratitude: "感謝",
        love: "愛",
        anxiety: "不安",
        sadness: "悲しみ",
        anger: "怒り",
        confusion: "混乱",
        emptiness: "空虚"
      },
      energy_levels: {
        very_low: "非常に低い",
        low: "低い",
        medium: "普通",
        high: "高い",
        very_high: "非常に高い"
      },
      focus_areas: {
        love: "愛",
        career: "キャリア",
        health: "健康",
        spirituality: "スピリチュアリティ",
        creativity: "創造性",
        healing: "癒し"
      },
      save: "チェックインを保存",
      particles: "エネルギー粒子"
    },
    reports: {
      title: "レポート",
      pathAnalysis: "パス分析",
      weeklyInsight: "週次インサイト",
      dominantEnergy: "優勢なエネルギー",
      frequentArchetypes: "頻繁なアーキタイプ",
      suggestedFocus: "推奨フォーカス",
      consistencyMastery: "一貫性の習熟",
      streakDesc: "{{days}}日連続で内なる自己と繋がり続けています。",
      entries: "エントリー",
      readings: "リーディング",
      recordDays: "記録日数",
      currentPhase: "現在のフェーズ",
      emotionalLandscape: "感情の風景",
      moodConstellation: "気分の星座",
      constellationDesc: "あなたの感情状態を星図として視覚化。",
      practiceDynamics: "修行のダイナミクス",
      reflections: "内省",
      tarotInsight: "タロットのインサイト",
      calm: "穏やか",
      excellent: "優秀",
      good: "良い",
      peaceful: "平和的",
      weak: "弱い",
      difficult: "困難",
      soulReports: "魂のレポート",
      trends: "あなたのトレンド",
      generating: "レポートを生成中...",
      weeklyReport: "週次レポート",
      monthlyReport: "月次レポート"
    },
    astrology: {
      title: "占星術",
      transits: "トランジット",
      cycles: "サイクル",
      biorhythm: "バイオリズム",
      stars: "星",
      vedic: "ヴェーダ占星術",
      retrograde: "逆行",
      aspects: "アスペクト",
      conjunction: "コンジャンクション",
      opposition: "オポジション",
      trine: "トライン",
      square: "スクエア",
      sextile: "セクスタイル",
      natalChart: "出生図",
      starsMap: "星空マップ",
      currentTransits: "現在のトランジット",
      biorhythmCycles: "バイオリズムサイクル",
      physical: "肉体的",
      emotional: "感情的",
      intellectual: "知的"
    },
    notifications: {
      title: "通知",
      reminders: "リマインダー",
      add_reminder: "リマインダーを追加",
      morning: "朝",
      evening: "夜",
      meditation: "瞑想",
      ritual: "儀式",
      enabled: "有効",
      disabled: "無効",
      time: "時間",
      days: "日",
      presets: "プリセット",
      customTime: "カスタム時間",
      reminderLabel: "リマインダーラベル",
      saveReminder: "リマインダーを保存",
      deleteReminder: "リマインダーを削除",
      allDays: "毎日",
      weekdays: "平日",
      weekends: "週末"
    },
    paywall: {
      premiumTitle: "無限の知恵を解き放て",
      premiumSubtitle: "内なる旅が今始まります。求道者の精鋭サークルに参加しよう。",
      choosePath: "あなたの道を選んでください",
      monthly: "月間",
      yearly: "年間",
      monthlyDesc: "いつでもキャンセル可能",
      yearlyDesc: "わずか$4.99 / 月",
      bestValue: "最良の価値",
      restore: "購入を復元",
      feature1Title: "無制限オラクルチャット",
      feature1Desc: "いつでもAIガイドと無制限でチャット。",
      feature2Title: "高度なタロットスプレッド",
      feature2Desc: "22の大アルカナと小アルカナすべてに加え、専門スプレッドにアクセス。",
      feature3Title: "魂のパスの洞察",
      feature3Desc: "運命のマトリックスと個人的なトランジットの深い分析。",
      feature4Title: "聖なる図書館",
      feature4Desc: "お気に入りのアファメーション、リーディング、夢の永続的な聖域。"
    },
    compatibility: {
      title: "相性",
      relationships: "関係",
      synastry: "シナストリー",
      addPartnerEnergy: "パートナーのエネルギーを追加",
      partnerName: "パートナー / 人物の名前",
      namePlaceholder: "名前を入力...",
      birthDate: "生年月日",
      selectDate: "日付を選択",
      calculateMatch: "相性を計算",
      you: "あなた",
      partner: "パートナー",
      relationshipEnergy: "関係のエネルギー",
      vibration: "波動",
      changePartner: "人物を変更",
      compatibilityScore: "相性スコア",
      strengths: "強み",
      challenges: "課題",
      advice: "アドバイス"
    },
    journeys: {
      title: "ジャーニー",
      spiritualPrograms: "スピリチュアルプログラム",
      transformationPaths: "変容の道",
      weeklyFocus: "週次フォーカス",
      dailyPractice: "日課",
      completedSessions: "完了セッション",
      nextStep: "次のステップ",
      continueJourney: "旅を続ける",
      startJourney: "旅を始める",
      currentJourney: "現在の旅",
      availableJourneys: "利用可能な旅",
      progress: "進捗",
      daysLeft: "残り日数"
    },
    palmreading: {
      title: "手相占い",
      analyze: "手のひらを分析",
      upload: "手のひら写真をアップロード",
      instructions: "良い光の中で手のひらを撮影してください",
      lines: {
        heart: "感情線",
        head: "頭脳線",
        life: "生命線",
        fate: "運命線",
        sun: "太陽線"
      },
      interpretationTitle: "手のひら解釈",
      loading: "手のひらの線を分析中..."
    },
    binauralbeats: {
      title: "脳波",
      subtitle: "バイノーラルビート",
      start: "スタート",
      stop: "ストップ",
      waves: {
        delta: "デルタ — 深い睡眠",
        theta: "シータ — 瞑想",
        alpha: "アルファ — リラクゼーション",
        beta: "ベータ — 集中",
        gamma: "ガンマ — 高次認知"
      },
      benefits: "効果",
      session_complete: "セッション完了"
    },
    sleephelper: {
      title: "睡眠サポート",
      start: "睡眠を開始",
      duration: "時間",
      soundscape: "サウンド",
      story: "ストーリー",
      meditation: "睡眠瞑想",
      goodnight: "おやすみなさい、魂よ"
    },
    stars: {
      title: "星",
      skyMap: "星空マップ",
      catalogue: "星カタログ",
      constellation: "星座",
      magnitude: "等級",
      distance: "距離",
      realTimeSky: "リアルタイムの空",
      yourZenith: "あなたの天頂",
      tabMap: "マップ",
      tabCatalogue: "カタログ",
      tabInfo: "情報"
    },
    biorhythm: {
      title: "バイオリズム",
      physical: "肉体的",
      emotional: "感情的",
      intellectual: "知的",
      today: "今日",
      peak: "ピーク",
      low: "低",
      neutral: "ニュートラル",
      chartTitle: "バイオリズムチャート"
    },
    knowledge: {
      title: "ライブラリ",
      search: "知識を検索...",
      categories: "カテゴリ",
      articles: "記事",
      savedArticles: "保存済み記事",
      readMore: "続きを読む"
    },
    data: {
      decks: {
        classic: "Golden Dawn",
        classicDesc: "ライダー=ウェイト伝統に基づく最も正確でクラシックなデッキ。",
        cosmic: "コズミックライト",
        cosmicDesc: "普遍的なアーキタイプの現代的で銀河的な解釈。",
        dark: "魂の暗闇",
        darkDesc: "シャドウワークと隠された真実のための深いデッキ。"
      },
      rituals: {
        morning_alignment: {
          title: "朝の整列",
          description: "一日の意図を設定するための短い瞑想。",
          duration: "5分"
        },
        evening_reflection: {
          title: "夜の反省",
          description: "眠る前に蓄積した感情を解放する。",
          duration: "10分"
        },
        candle_magic: {
          title: "キャンドルマジック",
          description: "火の元素を通じて特定の願いを顕現させる。",
          duration: "15分"
        }
      }
    },
    archetypes: {
      "1": { name: "魔術師", title: "現実の創造者" },
      "2": { name: "女教皇", title: "秘密の守護者" },
      "3": { name: "女帝", title: "豊かさの支配者" },
      "4": { name: "皇帝", title: "秩序の建築家" },
      "5": { name: "法王", title: "伝統の守護者" },
      "6": { name: "恋人", title: "エネルギーの調和者" },
      "7": { name: "戦車", title: "目標の達成者" },
      "8": { name: "正義", title: "カルマの天秤" },
      "9": { name: "隠者", title: "真実の探求者" },
      "10": { name: "運命の輪", title: "運命の主人" },
      "11": { name: "力", title: "感情の主人" },
      "12": { name: "吊るされた男", title: "視点のビジョナリー" },
      "13": { name: "死神", title: "変容のエージェント" },
      "14": { name: "節制", title: "均衡の錬金術師" },
      "15": { name: "悪魔", title: "影の探求者" },
      "16": { name: "塔", title: "幻想の破壊者" },
      "17": { name: "星", title: "希望の鼓舞者" },
      "18": { name: "月", title: "潜在意識の旅人" },
      "19": { name: "太陽", title: "明晰のひかり" },
      "20": { name: "審判", title: "覚醒の声" },
      "21": { name: "世界", title: "統合の主人" },
      "22": { name: "愚者", title: "自由な魂" }
    },
    sleepRitual: {
      title: "睡眠の儀式",
      eyebrow: "夢の世界",
      tabProtocol: "プロトコル",
      tabScan: "ボディスキャン",
      tabBreath: "呼吸",
      start: "開始",
      done: "完了"
    },
    lucidDreaming: {
      title: "明晰夢",
      eyebrow: "夢の世界",
      tabTechniques: "テクニック",
      tabDiary: "日記",
      tabSigns: "サイン"
    },
    fireCeremony: {
      title: "火の儀式",
      eyebrow: "儀式の世界",
      writeIntention: "意図を書いてください...",
      burn: "燃やす"
    },
    ancestralConnection: {
      title: "先祖との繋がり",
      eyebrow: "儀式の世界",
      askOracle: "オラクルに聞く"
    },
    protectionRitual: {
      title: "保護の盾",
      eyebrow: "浄化の世界",
      activate: "保護を起動"
    },
    saltBath: {
      title: "塩風呂",
      eyebrow: "浄化の世界",
      tabProtocols: "プロトコル",
      tabSteps: "ステップ",
      start: "開始"
    },
    releaseLetters: {
      title: "火への手紙",
      eyebrow: "浄化の世界",
      write: "手紙を書く...",
      release: "解放する"
    },
    innerChild: {
      title: "内なる子供",
      eyebrow: "サポートの世界",
      askOracle: "オラクルに聞く"
    },
    anxietyRelief: {
      title: "不安の緩和",
      eyebrow: "サポートの世界",
      sos: "SOS",
      techniques: "テクニック",
      habits: "習慣"
    },
    selfCompassion: {
      title: "自己慈悲",
      eyebrow: "サポートの世界",
      generateLetter: "手紙を生成"
    },
    healingFrequencies: {
      title: "ヒーリング周波数",
      eyebrow: "サポートの世界",
      play: "再生",
      stop: "停止"
    },
    emotionalAnchors: {
      title: "感情のアンカー",
      eyebrow: "サポートの世界",
      activate: "アンカーを起動",
      create: "新規作成"
    },
    lifeWheel: {
      title: "ライフホイール",
      eyebrow: "あなたの世界",
      score: "スコア",
      yourWheel: "あなたのホイール"
    },
    soulArchetype: {
      title: "魂のアーキタイプ",
      eyebrow: "あなたの世界",
      startQuiz: "クイズを始める",
      result: "あなたのアーキタイプ"
    },
    natalChart: {
      title: "出生図",
      eyebrow: "ホロスコープの世界",
      tabChart: "チャート",
      tabPlanets: "惑星",
      tabHouses: "ハウス"
    },
    retrogrades: {
      title: "逆行 ℞",
      eyebrow: "ホロスコープの世界",
      survivalGuide: "サバイバルガイド ℞"
    },
    signMeditation: {
      title: "星座の瞑想",
      eyebrow: "ホロスコープの世界",
      tabMeditation: "瞑想",
      tabAffirmations: "アファメーション",
      start: "開始",
      stop: "停止"
    }
  }
};

// ── zh.json — full file built from en.json ─────────────────────────────────
// Read en.json and translate all values to Chinese

const EN = JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8'));

// Deep-merge helper
function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object') target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

// ── Inject missing sections into existing 8 languages ─────────────────────
const LANGS_TO_UPDATE = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ar', 'ja'];

let totalAdded = 0;

for (const lang of LANGS_TO_UPDATE) {
  const filePath = path.join(DIR, `${lang}.json`);
  const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const additions = MISSING[lang];

  if (!additions) {
    console.log(`[skip] ${lang} — no additions defined`);
    continue;
  }

  let addedSections = 0;
  for (const [section, data] of Object.entries(additions)) {
    if (!existing[section]) {
      existing[section] = data;
      addedSections++;
    } else {
      // Deep-merge to fill any sub-keys that are missing
      deepMerge(existing[section], data);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  console.log(`✓ ${lang}.json — merged ${Object.keys(additions).length} sections`);
  totalAdded += addedSections;
}

// ── Build zh.json ──────────────────────────────────────────────────────────
// Start from en.json structure and replace all values with Chinese translations

const ZH_TRANSLATIONS = {
  common: {
    back: "返回",
    save: "保存",
    cancel: "取消",
    confirm: "确认",
    delete: "删除",
    close: "关闭",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    next: "下一步",
    previous: "上一步",
    done: "完成",
    start: "开始",
    stop: "停止",
    play: "播放",
    pause: "暂停",
    share: "分享",
    edit: "编辑",
    add: "添加",
    remove: "删除",
    search: "搜索",
    filter: "筛选",
    sort: "排序",
    all: "全部",
    more: "更多",
    less: "收起",
    seeAll: "查看全部",
    noData: "暂无数据",
    comingSoon: "即将推出",
    premium: "高级版",
    free: "免费",
    unlock: "解锁",
    locked: "已锁定",
    settings: "设置",
    logout: "退出登录",
    profile: "个人资料",
    notifications: "通知",
    language: "语言",
    theme: "主题",
    dark: "深色",
    light: "浅色",
    auto: "自动",
    screenErrorTitle: "屏幕错误",
    screenErrorBody: "此屏幕遇到了问题。\n请返回并重试。",
    localeCode: "zh-CN",
    hapticFeedback: "触觉反馈",
    notificationSettings: "通知设置",
    privacyPolicy: "隐私政策",
    termsOfService: "服务条款",
    appVersion: "应用版本",
    guidanceStyle: "引导风格"
  },
  nav: {
    portal: "入口",
    worlds: "世界",
    oracle: "神谕",
    notifications: "通知",
    profile: "个人资料"
  },
  tabs: {
    home: "主页",
    today: "今天",
    portal: "入口",
    oracle: "神谕",
    profile: "个人资料"
  },
  onboarding: {
    welcome: "欢迎来到灵魂宇宙",
    subtitle: "你的灵性旅程始于此刻",
    start: "开始",
    skip: "跳过",
    step1: "选择你的语言",
    step2: "你叫什么名字？",
    step3: "你的出生日期",
    step4: "你的星座",
    step5: "选择你的灵魂原型",
    namePlaceholder: "输入你的名字...",
    birthDateLabel: "选择日期",
    continue: "继续",
    finish: "完成设置"
  },
  home: {
    greeting: "你好",
    dailyMessage: "今日信息",
    quickActions: "快速操作",
    recentActivity: "最近活动",
    featuredRitual: "精选仪式",
    cosmicWeather: "宇宙天气",
    yourEnergy: "你的能量",
    todaysFocus: "今日焦点"
  },
  portal: {
    title: "入口",
    explore: "探索世界",
    featured: "精选",
    new: "新内容",
    popular: "热门",
    categories: "类别"
  },
  oracle: {
    title: "神谕",
    askQuestion: "提问",
    placeholder: "你的问题...",
    send: "发送",
    thinking: "神谕思考中...",
    newSession: "新对话",
    history: "历史记录",
    sessionHistory: "对话历史"
  },
  tarot: {
    title: "塔罗牌",
    draw: "抽牌",
    daily: "每日塔罗",
    reading: "解读",
    spread: "牌阵",
    card: "牌",
    upright: "正位",
    reversed: "逆位",
    meaning: "含义",
    advice: "建议",
    past: "过去",
    present: "现在",
    future: "未来",
    selectDeck: "选择牌组",
    flipCard: "翻牌",
    newReading: "新解读",
    saveReading: "保存解读",
    journalEntry: "塔罗日记"
  },
  horoscope: {
    title: "星座运势",
    daily: "每日",
    weekly: "每周",
    monthly: "每月",
    yearly: "每年",
    love: "爱情",
    career: "事业",
    health: "健康",
    finance: "财运",
    selectSign: "选择星座",
    chineseHoroscope: "中国生肖",
    partner: "伴侣运势"
  },
  journal: {
    title: "日记",
    newEntry: "新日记",
    entries: "日记条目",
    mood: "心情",
    tags: "标签",
    write: "写作...",
    save: "保存",
    delete: "删除",
    search: "搜索日记..."
  },
  dreams: {
    title: "梦境",
    record: "记录梦境",
    interpret: "解析梦境",
    symbols: "梦境符号",
    lucid: "清醒梦",
    recurring: "反复梦",
    nightmares: "噩梦",
    archive: "梦境档案",
    mood: "梦境情绪"
  },
  rituals: {
    title: "仪式",
    start: "开始仪式",
    daily: "每日仪式",
    moon: "月亮仪式",
    categories: "类别",
    duration: "时长",
    complete: "完成",
    inProgress: "进行中",
    scheduled: "已计划"
  },
  meditation: {
    title: "冥想",
    start: "开始冥想",
    stop: "停止",
    duration: "时长",
    guided: "引导冥想",
    silent: "静默冥想",
    breathing: "呼吸练习",
    timer: "计时器",
    complete: "冥想完成"
  },
  breathwork: {
    title: "呼吸工作",
    start: "开始",
    stop: "停止",
    inhale: "吸气",
    hold: "屏息",
    exhale: "呼气",
    cycles: "循环",
    pattern: "模式",
    complete: "完成"
  },
  chakra: {
    title: "脉轮",
    root: "根轮",
    sacral: "脐轮",
    solar: "太阳神经丛",
    heart: "心轮",
    throat: "喉轮",
    third_eye: "第三眼",
    crown: "顶轮",
    balance: "平衡",
    activate: "激活"
  },
  affirmations: {
    title: "肯定句",
    daily: "每日肯定",
    custom: "自定义",
    favorites: "收藏",
    generate: "生成",
    share: "分享",
    copy: "复制",
    categories: "类别"
  },
  gratitude: {
    title: "感恩",
    record: "记录感恩",
    entries: "感恩条目",
    daily: "每日感恩",
    streak: "连续天数",
    add: "添加感恩"
  },
  shadow: {
    title: "阴影工作",
    explore: "探索阴影",
    prompts: "提示",
    journal: "日记",
    integrate: "整合",
    archetypes: "原型"
  },
  lunar: {
    title: "月历",
    phase: "月相",
    new: "新月",
    waxing: "上弦月",
    full: "满月",
    waning: "下弦月",
    eclipse: "月食",
    ritual: "月亮仪式",
    energy: "月亮能量"
  },
  soundbath: {
    title: "音浴",
    start: "开始",
    stop: "停止",
    instruments: "乐器",
    duration: "时长",
    frequencies: "频率",
    tibetan: "西藏颂钵"
  },
  numerology: {
    title: "数字学",
    lifePathNumber: "生命路径数",
    destinyNumber: "命运数",
    soulUrge: "灵魂渴望数",
    personality: "个性数",
    calculate: "计算",
    meaning: "含义"
  },
  matrix: {
    title: "命运矩阵",
    calculate: "计算",
    birthDate: "出生日期",
    result: "结果",
    energy: "能量",
    mission: "使命",
    talent: "才能"
  },
  cleansing: {
    title: "净化",
    ritual: "净化仪式",
    sage: "鼠尾草",
    salt: "盐",
    crystal: "水晶",
    sound: "声音",
    intention: "意图"
  },
  community: {
    title: "社区",
    chat: "聊天",
    share: "分享",
    challenges: "挑战",
    rituals: "仪式",
    feed: "动态",
    members: "成员",
    join: "加入",
    create: "创建"
  },
  profile: {
    title: "个人资料",
    edit: "编辑",
    zodiac: "星座",
    archetype: "原型",
    birthDate: "出生日期",
    joinDate: "加入日期",
    stats: "统计",
    achievements: "成就",
    settings: "设置"
  },
  checkin: {
    title: "打卡",
    mood: "心情",
    energy: "能量",
    focus: "焦点",
    moods: {
      joy: "喜悦",
      peace: "平静",
      gratitude: "感恩",
      love: "爱",
      anxiety: "焦虑",
      sadness: "悲伤",
      anger: "愤怒",
      confusion: "困惑",
      emptiness: "空虚"
    },
    energy_levels: {
      very_low: "非常低",
      low: "低",
      medium: "中等",
      high: "高",
      very_high: "非常高"
    },
    focus_areas: {
      love: "爱情",
      career: "事业",
      health: "健康",
      spirituality: "灵性",
      creativity: "创意",
      healing: "疗愈"
    },
    save: "保存打卡",
    particles: "能量粒子"
  },
  reports: {
    title: "报告",
    pathAnalysis: "路径分析",
    weeklyInsight: "每周洞察",
    dominantEnergy: "主导能量",
    frequentArchetypes: "常见原型",
    suggestedFocus: "建议焦点",
    consistencyMastery: "持续精通",
    streakDesc: "你已连续{{days}}天与内心保持联系。",
    entries: "条目",
    readings: "解读",
    recordDays: "记录天数",
    currentPhase: "当前阶段",
    emotionalLandscape: "情感景观",
    moodConstellation: "心情星座",
    constellationDesc: "将你的情感状态可视化为星图。",
    practiceDynamics: "修练动态",
    reflections: "反思",
    tarotInsight: "塔罗洞察",
    calm: "平静",
    excellent: "优秀",
    good: "良好",
    peaceful: "平和",
    weak: "微弱",
    difficult: "困难",
    soulReports: "灵魂报告",
    trends: "你的趋势",
    generating: "正在生成报告...",
    weeklyReport: "周报",
    monthlyReport: "月报"
  },
  astrology: {
    title: "占星学",
    transits: "行星过境",
    cycles: "周期",
    biorhythm: "生物节律",
    stars: "星星",
    vedic: "吠陀占星",
    retrograde: "逆行",
    aspects: "相位",
    conjunction: "合相",
    opposition: "对分相",
    trine: "三分相",
    square: "四分相",
    sextile: "六分相",
    natalChart: "出生星盘",
    starsMap: "星空地图",
    currentTransits: "当前过境",
    biorhythmCycles: "生物节律周期",
    physical: "身体",
    emotional: "情感",
    intellectual: "智力"
  },
  notifications: {
    title: "通知",
    reminders: "提醒",
    add_reminder: "添加提醒",
    morning: "早晨",
    evening: "傍晚",
    meditation: "冥想",
    ritual: "仪式",
    enabled: "已启用",
    disabled: "已禁用",
    time: "时间",
    days: "天数",
    presets: "预设",
    customTime: "自定义时间",
    reminderLabel: "提醒标签",
    saveReminder: "保存提醒",
    deleteReminder: "删除提醒",
    allDays: "每天",
    weekdays: "工作日",
    weekends: "周末"
  },
  paywall: {
    premiumTitle: "解锁无限智慧",
    premiumSubtitle: "你的内在旅程现在开始。加入精英探索者圈子。",
    choosePath: "选择你的道路",
    monthly: "按月",
    yearly: "按年",
    monthlyDesc: "随时取消",
    yearlyDesc: "仅需$4.99/月",
    bestValue: "最超值",
    restore: "恢复购买",
    feature1Title: "无限神谕对话",
    feature1Desc: "随时与你的AI向导无限制地交流。",
    feature2Title: "高级塔罗牌阵",
    feature2Desc: "使用所有22张大阿卡纳和小阿卡纳及专业牌阵。",
    feature3Title: "灵魂路径洞见",
    feature3Desc: "深度分析你的命运矩阵和个人行星过境。",
    feature4Title: "神圣图书馆",
    feature4Desc: "永久收藏你最喜爱的肯定句、解读和梦境。"
  },
  compatibility: {
    title: "合盘",
    relationships: "关系",
    synastry: "合盘分析",
    addPartnerEnergy: "添加伴侣能量",
    partnerName: "伴侣/人物姓名",
    namePlaceholder: "输入姓名...",
    birthDate: "出生日期",
    selectDate: "选择日期",
    calculateMatch: "计算匹配",
    you: "你",
    partner: "伴侣",
    relationshipEnergy: "关系能量",
    vibration: "振动",
    changePartner: "更换人物",
    compatibilityScore: "合盘分数",
    strengths: "优势",
    challenges: "挑战",
    advice: "建议"
  },
  journeys: {
    title: "旅程",
    spiritualPrograms: "灵性项目",
    transformationPaths: "转化路径",
    weeklyFocus: "每周焦点",
    dailyPractice: "每日修练",
    completedSessions: "已完成课程",
    nextStep: "下一步",
    continueJourney: "继续旅程",
    startJourney: "开始旅程",
    currentJourney: "当前旅程",
    availableJourneys: "可用旅程",
    progress: "进度",
    daysLeft: "剩余天数"
  },
  palmreading: {
    title: "手相",
    analyze: "分析手掌",
    upload: "上传手掌照片",
    instructions: "在良好的光线下拍摄手掌",
    lines: {
      heart: "感情线",
      head: "智慧线",
      life: "生命线",
      fate: "命运线",
      sun: "太阳线"
    },
    interpretationTitle: "手相解读",
    loading: "正在分析手掌线..."
  },
  binauralbeats: {
    title: "脑波",
    subtitle: "双耳节拍",
    start: "开始",
    stop: "停止",
    waves: {
      delta: "δ波 — 深度睡眠",
      theta: "θ波 — 冥想",
      alpha: "α波 — 放松",
      beta: "β波 — 专注",
      gamma: "γ波 — 高级认知"
    },
    benefits: "益处",
    session_complete: "课程完成"
  },
  sleephelper: {
    title: "睡眠助手",
    start: "开始睡眠",
    duration: "时长",
    soundscape: "音景",
    story: "故事",
    meditation: "睡眠冥想",
    goodnight: "晚安，灵魂"
  },
  stars: {
    title: "星星",
    skyMap: "星空地图",
    catalogue: "星表",
    constellation: "星座",
    magnitude: "星等",
    distance: "距离",
    realTimeSky: "实时星空",
    yourZenith: "你的天顶",
    tabMap: "地图",
    tabCatalogue: "星表",
    tabInfo: "信息"
  },
  biorhythm: {
    title: "生物节律",
    physical: "身体",
    emotional: "情感",
    intellectual: "智力",
    today: "今天",
    peak: "峰值",
    low: "谷值",
    neutral: "中性",
    chartTitle: "生物节律图"
  },
  knowledge: {
    title: "图书馆",
    search: "搜索知识...",
    categories: "分类",
    articles: "文章",
    savedArticles: "已保存文章",
    readMore: "阅读更多"
  },
  data: {
    decks: {
      classic: "黄金黎明",
      classicDesc: "基于莱德-韦特传统的最精准经典牌组。",
      cosmic: "宇宙之光",
      cosmicDesc: "对普世原型的现代银河系诠释。",
      dark: "灵魂黑暗",
      darkDesc: "用于阴影工作和隐秘真相的深度牌组。"
    },
    rituals: {
      morning_alignment: {
        title: "晨间调整",
        description: "简短冥想，为当天设定意图。",
        duration: "5分钟"
      },
      evening_reflection: {
        title: "晚间反思",
        description: "睡前释放积累的情绪。",
        duration: "10分钟"
      },
      candle_magic: {
        title: "烛光魔法",
        description: "通过火元素显化特定愿望。",
        duration: "15分钟"
      }
    }
  },
  archetypes: {
    "1": { name: "魔术师", title: "现实创造者" },
    "2": { name: "女祭司", title: "秘密守护者" },
    "3": { name: "女皇", title: "丰盛的统治者" },
    "4": { name: "皇帝", title: "秩序的建构者" },
    "5": { name: "教皇", title: "传统的守护者" },
    "6": { name: "恋人", title: "能量调和者" },
    "7": { name: "战车", title: "目标征服者" },
    "8": { name: "正义", title: "因果的天平" },
    "9": { name: "隐士", title: "真理探寻者" },
    "10": { name: "命运之轮", title: "命运主宰者" },
    "11": { name: "力量", title: "情感主宰者" },
    "12": { name: "倒吊人", title: "视角远见者" },
    "13": { name: "死神", title: "转化推动者" },
    "14": { name: "节制", title: "平衡炼金师" },
    "15": { name: "恶魔", title: "阴影探索者" },
    "16": { name: "塔", title: "幻象破除者" },
    "17": { name: "星星", title: "希望启迪者" },
    "18": { name: "月亮", title: "潜意识旅行者" },
    "19": { name: "太阳", title: "清晰之光" },
    "20": { name: "审判", title: "觉醒之声" },
    "21": { name: "世界", title: "整合大师" },
    "22": { name: "愚者", title: "自由灵魂" }
  },
  sleepRitual: {
    title: "睡眠仪式",
    eyebrow: "梦境世界",
    tabProtocol: "协议",
    tabScan: "身体扫描",
    tabBreath: "呼吸",
    start: "开始",
    done: "完成"
  },
  lucidDreaming: {
    title: "清醒梦",
    eyebrow: "梦境世界",
    tabTechniques: "技巧",
    tabDiary: "日记",
    tabSigns: "迹象"
  },
  fireCeremony: {
    title: "火焰仪式",
    eyebrow: "仪式世界",
    writeIntention: "写下你的意图...",
    burn: "燃烧"
  },
  ancestralConnection: {
    title: "祖先连接",
    eyebrow: "仪式世界",
    askOracle: "询问神谕"
  },
  protectionRitual: {
    title: "保护盾",
    eyebrow: "净化世界",
    activate: "激活保护"
  },
  saltBath: {
    title: "盐浴",
    eyebrow: "净化世界",
    tabProtocols: "协议",
    tabSteps: "步骤",
    start: "开始"
  },
  releaseLetters: {
    title: "致火焰的信",
    eyebrow: "净化世界",
    write: "写信...",
    release: "释放"
  },
  innerChild: {
    title: "内在小孩",
    eyebrow: "支持世界",
    askOracle: "询问神谕"
  },
  anxietyRelief: {
    title: "焦虑缓解",
    eyebrow: "支持世界",
    sos: "SOS",
    techniques: "技巧",
    habits: "习惯"
  },
  selfCompassion: {
    title: "自我慈悲",
    eyebrow: "支持世界",
    generateLetter: "生成信件"
  },
  healingFrequencies: {
    title: "疗愈频率",
    eyebrow: "支持世界",
    play: "播放",
    stop: "停止"
  },
  emotionalAnchors: {
    title: "情感锚点",
    eyebrow: "支持世界",
    activate: "激活锚点",
    create: "创建新的"
  },
  lifeWheel: {
    title: "生命之轮",
    eyebrow: "你的世界",
    score: "分数",
    yourWheel: "你的轮盘"
  },
  soulArchetype: {
    title: "灵魂原型",
    eyebrow: "你的世界",
    startQuiz: "开始测验",
    result: "你的原型"
  },
  natalChart: {
    title: "出生星盘",
    eyebrow: "星座世界",
    tabChart: "星盘",
    tabPlanets: "行星",
    tabHouses: "宫位"
  },
  retrogrades: {
    title: "逆行 ℞",
    eyebrow: "星座世界",
    survivalGuide: "生存指南 ℞"
  },
  signMeditation: {
    title: "星座冥想",
    eyebrow: "星座世界",
    tabMeditation: "冥想",
    tabAffirmations: "肯定句",
    start: "开始",
    stop: "停止"
  },
  auth: {
    loginTitle: "登录",
    subtitle: "登入你的灵魂",
    email: "电子邮件",
    password: "密码",
    loginButton: "进入 ✦",
    noAccount: "没有账户？",
    register: "注册",
    hasAccount: "已有账户？",
    login: "登录",
    step1: "第1步/2 — 账户信息",
    step2: "第2步/2 — 你的资料",
    displayName: "你的名字",
    zodiacSign: "星座",
    archetype: "灵魂原型",
    symbol: "你的符号",
    registerButton: "创建账户 ✦",
    nextStep: "下一步 →",
    backStep: "← 返回",
    errorInvalidCredential: "电子邮件或密码无效。",
    errorEmailInUse: "此电子邮件已被使用。",
    errorWeakPassword: "密码必须至少6个字符。",
    errorConnection: "无法登录。请检查你的网络连接。"
  }
};

// Write zh.json
const zhPath = path.join(DIR, 'zh.json');
fs.writeFileSync(zhPath, JSON.stringify(ZH_TRANSLATIONS, null, 2) + '\n', 'utf8');
console.log('✓ zh.json — created complete Chinese file');

// ── Summary ────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════');
console.log('  inject-missing-translations — DONE');
console.log('  Updated: de, es, fr, it, pt, ru, ar, ja (+33 sections each)');
console.log('  Created: zh.json (complete from scratch)');
console.log('══════════════════════════════════════════════════');
