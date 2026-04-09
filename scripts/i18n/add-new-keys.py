#!/usr/bin/env python3
"""
Add new translation keys for search, spiritualReveal, premium, and communityEvents
sections to all 11 language JSON files.
"""
import json
import os

I18N_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'core', 'i18n')

# ── New keys per language ──────────────────────────────────────────────────────

NEW_KEYS = {
    "en": {
        "search": {
            "placeholder": "Search screen or feature...",
            "countFound": "{{n}} screens for \"{{q}}\"",
            "countAll": "{{n}} available",
            "noResults": "No screen found for \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ YOUR COSMIC PORTRAIT",
            "title": "The stars know you",
            "starsKnowYou": "The stars know you",
            "subtitle": "Your unique spiritual profile — revealed through dates, numbers and the sky.",
            "zodiacBadge": "ZODIAC SIGN",
            "lifePathBadge": "LIFE PATH",
            "master": " · MASTER",
            "soulChallenge": "⚡ SOUL CHALLENGE",
            "ascendantBadge": "ASCENDANT · MASK",
            "ctaButton": "Enter Aethera ✦",
            "ctaHint": "Your profile is secure and encrypted. You can always edit it in settings."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Choose your spiritual growth plan"
            },
            "plan": {
                "activePlan": "Active plan",
                "selectedPlan": "Selected plan"
            },
            "cta": {
                "currentPlan": "Your current plan",
                "startSoul": "Start Soul plan — 59.99/mo.",
                "startMaster": "Start Master plan — 499/yr.",
                "cancelHint": "You can cancel at any time.",
                "storeHint": "Securely stored by Google Play / App Store."
            },
            "whySection": {
                "title": "WHY UPGRADE",
                "unlimitedOracle": "Unlimited Oracle",
                "moonRituals": "Moon Rituals",
                "aiDreams": "AI analyses dreams",
                "destinyMatrix": "Destiny Matrix",
                "soundBath": "Sound Bath & Binaural",
                "partnerTarot": "Partner Tarot"
            },
            "testimonialsSection": {
                "title": "WHAT SOULS SAY"
            },
            "badges": {
                "securePayment": "Secure payment",
                "cancelAnytime": "Cancel anytime",
                "refund": "7-day refund"
            }
        },
        "communityEvents": {
            "title": "Events Calendar",
            "upcomingCount": "{{n}} upcoming",
            "tab": {
                "upcoming": "Upcoming",
                "mine": "Mine",
                "past": "Archive"
            },
            "section": {
                "today": "TODAY",
                "thisWeek": "THIS WEEK",
                "later": "LATER"
            },
            "filter": {
                "all": "All",
                "meditation": "Meditation",
                "ritual": "Ritual",
                "tarot": "Tarot",
                "meeting": "Meeting"
            },
            "card": {
                "participants": "participants",
                "enterNow": "Enter now",
                "joined": "Joined",
                "full": "Full",
                "enterLive": "🔴 Enter Live",
                "join": "Join"
            },
            "modal": {
                "newEvent": "New Event",
                "titleLabel": "Title *",
                "titlePlaceholder": "Event name...",
                "descLabel": "Description",
                "descPlaceholder": "Brief description of the meeting...",
                "coverEmojiLabel": "Cover emoji",
                "typeLabel": "Type",
                "dateLabel": "Date and time (DD.MM HH:MM)",
                "datePlaceholder": "e.g. 25.04 20:00",
                "durationLabel": "Duration",
                "maxParticipantsLabel": "Max. participants",
                "privateLabel": "Private event",
                "privateSubLabel": "Invite code only",
                "creating": "Creating...",
                "createBtn": "Create event"
            },
            "joinModal": {
                "title": "Join by code",
                "subtitle": "Enter 6-character invite code",
                "joining": "Joining...",
                "joinBtn": "Join"
            },
            "empty": {
                "title": "No events",
                "mine": "You are not yet signed up for any event.",
                "upcoming": "No upcoming events in this category."
            }
        }
    },
    "pl": {
        "search": {
            "placeholder": "Szukaj ekranu lub funkcji...",
            "countFound": "{{n}} ekranow dla \"{{q}}\"",
            "countAll": "{{n}} dostepnych",
            "noResults": "Nie znaleziono ekranu dla \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ TWOJ KOSMICZNY PORTRET",
            "title": "Gwiazdy cie znaja",
            "starsKnowYou": "Gwiazdy cie znaja",
            "subtitle": "Twoj unikalny profil duchowy — odkryty przez daty, cyfry i niebo.",
            "zodiacBadge": "ZNAK ZODIAKU",
            "lifePathBadge": "LICZBA ZYCIA",
            "master": " · MISTRZOWSKA",
            "soulChallenge": "⚡ WYZWANIE DUSZY",
            "ascendantBadge": "ASCENDENT · MASKA",
            "ctaButton": "Wejdz do Aethery ✦",
            "ctaHint": "Twoj profil jest bezpieczny i szyfrowany. Zawsze mozesz go edytowac w ustawieniach."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Wybierz swoj plan duchowego wzrostu"
            },
            "plan": {
                "activePlan": "Plan aktywny",
                "selectedPlan": "Wybrany plan"
            },
            "cta": {
                "currentPlan": "Twoj obecny plan",
                "startSoul": "Rozpocznij plan Dusza — 59,99 zl/mies.",
                "startMaster": "Rozpocznij plan Mistrz — 499 zl/rok",
                "cancelHint": "Mozesz anulic w dowolnym momencie.",
                "storeHint": "Przechowywane bezpiecznie przez Google Play / App Store."
            },
            "whySection": {
                "title": "DLACZEGO WARTO",
                "unlimitedOracle": "Nielimitowany Oracle",
                "moonRituals": "Rytualy Ksiezycowe",
                "aiDreams": "AI analizuje sny",
                "destinyMatrix": "Matryca Przeznaczenia",
                "soundBath": "Sound Bath & Binauralne",
                "partnerTarot": "Tarot Partnerski"
            },
            "testimonialsSection": {
                "title": "CO MOWIA DUSZE"
            },
            "badges": {
                "securePayment": "Bezpieczna platnosc",
                "cancelAnytime": "Anuluj kiedy chcesz",
                "refund": "7-dniowy zwrot"
            }
        },
        "communityEvents": {
            "title": "Kalendarz Wydarzen",
            "upcomingCount": "{{n}} nadchodzacych",
            "tab": {
                "upcoming": "Nadchodzace",
                "mine": "Moje",
                "past": "Archiwum"
            },
            "section": {
                "today": "DZIS",
                "thisWeek": "TEN TYDZIEN",
                "later": "POZNIEJ"
            },
            "filter": {
                "all": "Wszystkie",
                "meditation": "Medytacja",
                "ritual": "Rytual",
                "tarot": "Tarot",
                "meeting": "Spotkanie"
            },
            "card": {
                "participants": "uczestnikow",
                "enterNow": "Wejdz teraz",
                "joined": "Zapisany(a)",
                "full": "Brak miejsc",
                "enterLive": "🔴 Wejdz Live",
                "join": "Dolacz"
            },
            "modal": {
                "newEvent": "Nowe Wydarzenie",
                "titleLabel": "Tytul *",
                "titlePlaceholder": "Nazwa wydarzenia...",
                "descLabel": "Opis",
                "descPlaceholder": "Krotki opis czego dotyczy spotkanie...",
                "coverEmojiLabel": "Emoji okladki",
                "typeLabel": "Typ",
                "dateLabel": "Data i czas (DD.MM HH:MM)",
                "datePlaceholder": "np. 25.04 20:00",
                "durationLabel": "Czas trwania",
                "maxParticipantsLabel": "Maks. uczestnikow",
                "privateLabel": "Prywatne wydarzenie",
                "privateSubLabel": "Tylko przez kod zaproszenia",
                "creating": "Tworze...",
                "createBtn": "Utworz wydarzenie"
            },
            "joinModal": {
                "title": "Dolacz przez kod",
                "subtitle": "Wpisz 6-znakowy kod zaproszenia",
                "joining": "Dolaczam...",
                "joinBtn": "Dolacz"
            },
            "empty": {
                "title": "Brak wydarzen",
                "mine": "Nie jestes jeszcze zapisany(a) na zadne wydarzenie.",
                "upcoming": "Nie ma nadchodzacych wydarzen w tej kategorii."
            }
        }
    },
    "de": {
        "search": {
            "placeholder": "Bildschirm oder Funktion suchen...",
            "countFound": "{{n}} Bildschirme fur \"{{q}}\"",
            "countAll": "{{n}} verfugbar",
            "noResults": "Kein Bildschirm gefunden fur \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ DEIN KOSMISCHES PORTRAT",
            "title": "Die Sterne kennen dich",
            "starsKnowYou": "Die Sterne kennen dich",
            "subtitle": "Dein einzigartiges spirituelles Profil — enthullt durch Daten, Zahlen und den Himmel.",
            "zodiacBadge": "STERNZEICHEN",
            "lifePathBadge": "LEBENSZAHL",
            "master": " · MEISTER",
            "soulChallenge": "⚡ SEELEN-HERAUSFORDERUNG",
            "ascendantBadge": "ASZENDENT · MASKE",
            "ctaButton": "Aethera betreten ✦",
            "ctaHint": "Dein Profil ist sicher und verschlusselt. Du kannst es jederzeit in den Einstellungen bearbeiten."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Wahle deinen spirituellen Wachstumsplan"
            },
            "plan": {
                "activePlan": "Aktiver Plan",
                "selectedPlan": "Ausgewahlter Plan"
            },
            "cta": {
                "currentPlan": "Dein aktueller Plan",
                "startSoul": "Soul-Plan starten — 59,99/Monat",
                "startMaster": "Master-Plan starten — 499/Jahr",
                "cancelHint": "Du kannst jederzeit kundigen.",
                "storeHint": "Sicher gespeichert durch Google Play / App Store."
            },
            "whySection": {
                "title": "WARUM UPGRADEN",
                "unlimitedOracle": "Unbegrenztes Orakel",
                "moonRituals": "Mondrituале",
                "aiDreams": "KI analysiert Traume",
                "destinyMatrix": "Schicksalsmatrix",
                "soundBath": "Klangbad & Binaural",
                "partnerTarot": "Partner-Tarot"
            },
            "testimonialsSection": {
                "title": "WAS SEELEN SAGEN"
            },
            "badges": {
                "securePayment": "Sichere Zahlung",
                "cancelAnytime": "Jederzeit kundbar",
                "refund": "7-Tage Ruckgabe"
            }
        },
        "communityEvents": {
            "title": "Veranstaltungskalender",
            "upcomingCount": "{{n}} bevorstehend",
            "tab": {
                "upcoming": "Bevorstehend",
                "mine": "Meine",
                "past": "Archiv"
            },
            "section": {
                "today": "HEUTE",
                "thisWeek": "DIESE WOCHE",
                "later": "SPATER"
            },
            "filter": {
                "all": "Alle",
                "meditation": "Meditation",
                "ritual": "Ritual",
                "tarot": "Tarot",
                "meeting": "Treffen"
            },
            "card": {
                "participants": "Teilnehmer",
                "enterNow": "Jetzt eintreten",
                "joined": "Angemeldet",
                "full": "Ausgebucht",
                "enterLive": "🔴 Live eintreten",
                "join": "Beitreten"
            },
            "modal": {
                "newEvent": "Neue Veranstaltung",
                "titleLabel": "Titel *",
                "titlePlaceholder": "Name der Veranstaltung...",
                "descLabel": "Beschreibung",
                "descPlaceholder": "Kurze Beschreibung des Treffens...",
                "coverEmojiLabel": "Cover-Emoji",
                "typeLabel": "Typ",
                "dateLabel": "Datum und Uhrzeit (TT.MM HH:MM)",
                "datePlaceholder": "z.B. 25.04 20:00",
                "durationLabel": "Dauer",
                "maxParticipantsLabel": "Max. Teilnehmer",
                "privateLabel": "Private Veranstaltung",
                "privateSubLabel": "Nur per Einladungscode",
                "creating": "Erstelle...",
                "createBtn": "Veranstaltung erstellen"
            },
            "joinModal": {
                "title": "Per Code beitreten",
                "subtitle": "6-stelligen Einladungscode eingeben",
                "joining": "Beitreten...",
                "joinBtn": "Beitreten"
            },
            "empty": {
                "title": "Keine Veranstaltungen",
                "mine": "Du bist noch fur keine Veranstaltung angemeldet.",
                "upcoming": "Keine bevorstehenden Veranstaltungen in dieser Kategorie."
            }
        }
    },
    "es": {
        "search": {
            "placeholder": "Buscar pantalla o funcion...",
            "countFound": "{{n}} pantallas para \"{{q}}\"",
            "countAll": "{{n}} disponibles",
            "noResults": "No se encontro pantalla para \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ TU RETRATO COSMICO",
            "title": "Las estrellas te conocen",
            "starsKnowYou": "Las estrellas te conocen",
            "subtitle": "Tu perfil espiritual unico — revelado a traves de fechas, numeros y el cielo.",
            "zodiacBadge": "SIGNO ZODIACAL",
            "lifePathBadge": "NUMERO DE VIDA",
            "master": " · MAESTRA",
            "soulChallenge": "⚡ DESAFIO DEL ALMA",
            "ascendantBadge": "ASCENDENTE · MASCARA",
            "ctaButton": "Entrar a Aethera ✦",
            "ctaHint": "Tu perfil es seguro y encriptado. Siempre puedes editarlo en ajustes."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Elige tu plan de crecimiento espiritual"
            },
            "plan": {
                "activePlan": "Plan activo",
                "selectedPlan": "Plan seleccionado"
            },
            "cta": {
                "currentPlan": "Tu plan actual",
                "startSoul": "Iniciar plan Alma — 59,99/mes",
                "startMaster": "Iniciar plan Maestro — 499/ano",
                "cancelHint": "Puedes cancelar en cualquier momento.",
                "storeHint": "Almacenado de forma segura por Google Play / App Store."
            },
            "whySection": {
                "title": "POR QUE ACTUALIZAR",
                "unlimitedOracle": "Oraculo ilimitado",
                "moonRituals": "Rituales lunares",
                "aiDreams": "IA analiza suenos",
                "destinyMatrix": "Matriz del destino",
                "soundBath": "Bano de sonido & Binaural",
                "partnerTarot": "Tarot de pareja"
            },
            "testimonialsSection": {
                "title": "LO QUE DICEN LAS ALMAS"
            },
            "badges": {
                "securePayment": "Pago seguro",
                "cancelAnytime": "Cancela cuando quieras",
                "refund": "Reembolso 7 dias"
            }
        },
        "communityEvents": {
            "title": "Calendario de Eventos",
            "upcomingCount": "{{n}} proximos",
            "tab": {
                "upcoming": "Proximos",
                "mine": "Mis eventos",
                "past": "Archivo"
            },
            "section": {
                "today": "HOY",
                "thisWeek": "ESTA SEMANA",
                "later": "MAS TARDE"
            },
            "filter": {
                "all": "Todos",
                "meditation": "Meditacion",
                "ritual": "Ritual",
                "tarot": "Tarot",
                "meeting": "Reunion"
            },
            "card": {
                "participants": "participantes",
                "enterNow": "Entrar ahora",
                "joined": "Inscrito(a)",
                "full": "Completo",
                "enterLive": "🔴 Entrar en vivo",
                "join": "Unirse"
            },
            "modal": {
                "newEvent": "Nuevo Evento",
                "titleLabel": "Titulo *",
                "titlePlaceholder": "Nombre del evento...",
                "descLabel": "Descripcion",
                "descPlaceholder": "Breve descripcion de la reunion...",
                "coverEmojiLabel": "Emoji de portada",
                "typeLabel": "Tipo",
                "dateLabel": "Fecha y hora (DD.MM HH:MM)",
                "datePlaceholder": "ej. 25.04 20:00",
                "durationLabel": "Duracion",
                "maxParticipantsLabel": "Max. participantes",
                "privateLabel": "Evento privado",
                "privateSubLabel": "Solo con codigo de invitacion",
                "creating": "Creando...",
                "createBtn": "Crear evento"
            },
            "joinModal": {
                "title": "Unirse por codigo",
                "subtitle": "Ingresa el codigo de invitacion de 6 caracteres",
                "joining": "Uniendose...",
                "joinBtn": "Unirse"
            },
            "empty": {
                "title": "Sin eventos",
                "mine": "Aun no estas inscrito(a) en ningun evento.",
                "upcoming": "No hay eventos proximos en esta categoria."
            }
        }
    },
    "fr": {
        "search": {
            "placeholder": "Rechercher un ecran ou une fonction...",
            "countFound": "{{n}} ecrans pour \"{{q}}\"",
            "countAll": "{{n}} disponibles",
            "noResults": "Aucun ecran trouve pour \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ TON PORTRAIT COSMIQUE",
            "title": "Les etoiles te connaissent",
            "starsKnowYou": "Les etoiles te connaissent",
            "subtitle": "Ton profil spirituel unique — revele par les dates, les chiffres et le ciel.",
            "zodiacBadge": "SIGNE ZODIACAL",
            "lifePathBadge": "CHEMIN DE VIE",
            "master": " · MAITRISE",
            "soulChallenge": "⚡ DEFI DE L'AME",
            "ascendantBadge": "ASCENDANT · MASQUE",
            "ctaButton": "Entrer dans Aethera ✦",
            "ctaHint": "Ton profil est securise et chiffre. Tu peux toujours le modifier dans les parametres."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Choisis ton plan de croissance spirituelle"
            },
            "plan": {
                "activePlan": "Plan actif",
                "selectedPlan": "Plan selectionne"
            },
            "cta": {
                "currentPlan": "Ton plan actuel",
                "startSoul": "Demarrer le plan Ame — 59,99/mois",
                "startMaster": "Demarrer le plan Maitre — 499/an",
                "cancelHint": "Tu peux annuler a tout moment.",
                "storeHint": "Stocke en toute securite par Google Play / App Store."
            },
            "whySection": {
                "title": "POURQUOI PASSER AU PREMIUM",
                "unlimitedOracle": "Oracle illimite",
                "moonRituals": "Rituels lunaires",
                "aiDreams": "IA analyse les reves",
                "destinyMatrix": "Matrice du destin",
                "soundBath": "Bain sonore & Binaural",
                "partnerTarot": "Tarot partenaire"
            },
            "testimonialsSection": {
                "title": "CE QUE DISENT LES AMES"
            },
            "badges": {
                "securePayment": "Paiement securise",
                "cancelAnytime": "Annuler quand tu veux",
                "refund": "Remboursement 7 jours"
            }
        },
        "communityEvents": {
            "title": "Calendrier des Evenements",
            "upcomingCount": "{{n}} a venir",
            "tab": {
                "upcoming": "A venir",
                "mine": "Mes evenements",
                "past": "Archives"
            },
            "section": {
                "today": "AUJOURD'HUI",
                "thisWeek": "CETTE SEMAINE",
                "later": "PLUS TARD"
            },
            "filter": {
                "all": "Tous",
                "meditation": "Meditation",
                "ritual": "Rituel",
                "tarot": "Tarot",
                "meeting": "Reunion"
            },
            "card": {
                "participants": "participants",
                "enterNow": "Entrer maintenant",
                "joined": "Inscrit(e)",
                "full": "Complet",
                "enterLive": "🔴 Entrer en direct",
                "join": "Rejoindre"
            },
            "modal": {
                "newEvent": "Nouvel Evenement",
                "titleLabel": "Titre *",
                "titlePlaceholder": "Nom de l'evenement...",
                "descLabel": "Description",
                "descPlaceholder": "Breve description de la reunion...",
                "coverEmojiLabel": "Emoji de couverture",
                "typeLabel": "Type",
                "dateLabel": "Date et heure (JJ.MM HH:MM)",
                "datePlaceholder": "ex. 25.04 20:00",
                "durationLabel": "Duree",
                "maxParticipantsLabel": "Max. participants",
                "privateLabel": "Evenement prive",
                "privateSubLabel": "Code d'invitation uniquement",
                "creating": "Creation...",
                "createBtn": "Creer l'evenement"
            },
            "joinModal": {
                "title": "Rejoindre par code",
                "subtitle": "Entrer le code d'invitation a 6 caracteres",
                "joining": "Rejoindre...",
                "joinBtn": "Rejoindre"
            },
            "empty": {
                "title": "Pas d'evenements",
                "mine": "Tu n'es pas encore inscrit(e) a aucun evenement.",
                "upcoming": "Pas d'evenements a venir dans cette categorie."
            }
        }
    },
    "it": {
        "search": {
            "placeholder": "Cerca schermata o funzione...",
            "countFound": "{{n}} schermate per \"{{q}}\"",
            "countAll": "{{n}} disponibili",
            "noResults": "Nessuna schermata trovata per \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ IL TUO RITRATTO COSMICO",
            "title": "Le stelle ti conoscono",
            "starsKnowYou": "Le stelle ti conoscono",
            "subtitle": "Il tuo profilo spirituale unico — rivelato attraverso date, numeri e il cielo.",
            "zodiacBadge": "SEGNO ZODIACALE",
            "lifePathBadge": "NUMERO DEL DESTINO",
            "master": " · MAESTRIA",
            "soulChallenge": "⚡ SFIDA DELL'ANIMA",
            "ascendantBadge": "ASCENDENTE · MASCHERA",
            "ctaButton": "Entra in Aethera ✦",
            "ctaHint": "Il tuo profilo e sicuro e crittografato. Puoi sempre modificarlo nelle impostazioni."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Scegli il tuo piano di crescita spirituale"
            },
            "plan": {
                "activePlan": "Piano attivo",
                "selectedPlan": "Piano selezionato"
            },
            "cta": {
                "currentPlan": "Il tuo piano attuale",
                "startSoul": "Inizia piano Anima — 59,99/mese",
                "startMaster": "Inizia piano Maestro — 499/anno",
                "cancelHint": "Puoi annullare in qualsiasi momento.",
                "storeHint": "Archiviato in modo sicuro da Google Play / App Store."
            },
            "whySection": {
                "title": "PERCHE AGGIORNARE",
                "unlimitedOracle": "Oracolo illimitato",
                "moonRituals": "Rituali lunari",
                "aiDreams": "IA analizza i sogni",
                "destinyMatrix": "Matrice del destino",
                "soundBath": "Bagno sonoro & Binaurale",
                "partnerTarot": "Tarot di coppia"
            },
            "testimonialsSection": {
                "title": "COSA DICONO LE ANIME"
            },
            "badges": {
                "securePayment": "Pagamento sicuro",
                "cancelAnytime": "Annulla quando vuoi",
                "refund": "Rimborso 7 giorni"
            }
        },
        "communityEvents": {
            "title": "Calendario Eventi",
            "upcomingCount": "{{n}} in arrivo",
            "tab": {
                "upcoming": "In arrivo",
                "mine": "I miei eventi",
                "past": "Archivio"
            },
            "section": {
                "today": "OGGI",
                "thisWeek": "QUESTA SETTIMANA",
                "later": "PIU TARDI"
            },
            "filter": {
                "all": "Tutti",
                "meditation": "Meditazione",
                "ritual": "Rituale",
                "tarot": "Tarot",
                "meeting": "Riunione"
            },
            "card": {
                "participants": "partecipanti",
                "enterNow": "Entra ora",
                "joined": "Iscritto(a)",
                "full": "Completo",
                "enterLive": "🔴 Entra in diretta",
                "join": "Partecipa"
            },
            "modal": {
                "newEvent": "Nuovo Evento",
                "titleLabel": "Titolo *",
                "titlePlaceholder": "Nome dell'evento...",
                "descLabel": "Descrizione",
                "descPlaceholder": "Breve descrizione della riunione...",
                "coverEmojiLabel": "Emoji di copertina",
                "typeLabel": "Tipo",
                "dateLabel": "Data e ora (GG.MM HH:MM)",
                "datePlaceholder": "es. 25.04 20:00",
                "durationLabel": "Durata",
                "maxParticipantsLabel": "Max. partecipanti",
                "privateLabel": "Evento privato",
                "privateSubLabel": "Solo con codice invito",
                "creating": "Creazione...",
                "createBtn": "Crea evento"
            },
            "joinModal": {
                "title": "Unisciti con codice",
                "subtitle": "Inserisci il codice invito a 6 caratteri",
                "joining": "Unione...",
                "joinBtn": "Unisciti"
            },
            "empty": {
                "title": "Nessun evento",
                "mine": "Non sei ancora iscritto(a) a nessun evento.",
                "upcoming": "Nessun evento in arrivo in questa categoria."
            }
        }
    },
    "pt": {
        "search": {
            "placeholder": "Pesquisar tela ou funcao...",
            "countFound": "{{n}} telas para \"{{q}}\"",
            "countAll": "{{n}} disponiveis",
            "noResults": "Nenhuma tela encontrada para \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ SEU RETRATO COSMICO",
            "title": "As estrelas te conhecem",
            "starsKnowYou": "As estrelas te conhecem",
            "subtitle": "Seu perfil espiritual unico — revelado atraves de datas, numeros e o ceu.",
            "zodiacBadge": "SIGNO ZODIACAL",
            "lifePathBadge": "NUMERO DE VIDA",
            "master": " · MESTRE",
            "soulChallenge": "⚡ DESAFIO DA ALMA",
            "ascendantBadge": "ASCENDENTE · MASCARA",
            "ctaButton": "Entrar na Aethera ✦",
            "ctaHint": "Seu perfil e seguro e criptografado. Voce sempre pode edita-lo nas configuracoes."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Escolha seu plano de crescimento espiritual"
            },
            "plan": {
                "activePlan": "Plano ativo",
                "selectedPlan": "Plano selecionado"
            },
            "cta": {
                "currentPlan": "Seu plano atual",
                "startSoul": "Iniciar plano Alma — 59,99/mes",
                "startMaster": "Iniciar plano Mestre — 499/ano",
                "cancelHint": "Voce pode cancelar a qualquer momento.",
                "storeHint": "Armazenado com seguranca pelo Google Play / App Store."
            },
            "whySection": {
                "title": "POR QUE FAZER UPGRADE",
                "unlimitedOracle": "Oraculo ilimitado",
                "moonRituals": "Rituais lunares",
                "aiDreams": "IA analisa sonhos",
                "destinyMatrix": "Matriz do destino",
                "soundBath": "Banho sonoro & Binaural",
                "partnerTarot": "Tarot parceiro"
            },
            "testimonialsSection": {
                "title": "O QUE AS ALMAS DIZEM"
            },
            "badges": {
                "securePayment": "Pagamento seguro",
                "cancelAnytime": "Cancele quando quiser",
                "refund": "Reembolso 7 dias"
            }
        },
        "communityEvents": {
            "title": "Calendario de Eventos",
            "upcomingCount": "{{n}} proximos",
            "tab": {
                "upcoming": "Proximos",
                "mine": "Meus eventos",
                "past": "Arquivo"
            },
            "section": {
                "today": "HOJE",
                "thisWeek": "ESTA SEMANA",
                "later": "MAIS TARDE"
            },
            "filter": {
                "all": "Todos",
                "meditation": "Meditacao",
                "ritual": "Ritual",
                "tarot": "Tarot",
                "meeting": "Reuniao"
            },
            "card": {
                "participants": "participantes",
                "enterNow": "Entrar agora",
                "joined": "Inscrito(a)",
                "full": "Lotado",
                "enterLive": "🔴 Entrar ao vivo",
                "join": "Participar"
            },
            "modal": {
                "newEvent": "Novo Evento",
                "titleLabel": "Titulo *",
                "titlePlaceholder": "Nome do evento...",
                "descLabel": "Descricao",
                "descPlaceholder": "Breve descricao da reuniao...",
                "coverEmojiLabel": "Emoji da capa",
                "typeLabel": "Tipo",
                "dateLabel": "Data e hora (DD.MM HH:MM)",
                "datePlaceholder": "ex. 25.04 20:00",
                "durationLabel": "Duracao",
                "maxParticipantsLabel": "Max. participantes",
                "privateLabel": "Evento privado",
                "privateSubLabel": "Apenas por codigo de convite",
                "creating": "Criando...",
                "createBtn": "Criar evento"
            },
            "joinModal": {
                "title": "Entrar por codigo",
                "subtitle": "Digite o codigo de convite de 6 caracteres",
                "joining": "Entrando...",
                "joinBtn": "Entrar"
            },
            "empty": {
                "title": "Sem eventos",
                "mine": "Voce ainda nao esta inscrito(a) em nenhum evento.",
                "upcoming": "Nao ha eventos proximos nesta categoria."
            }
        }
    },
    "ru": {
        "search": {
            "placeholder": "Поиск экрана или функции...",
            "countFound": "{{n}} экранов для \"{{q}}\"",
            "countAll": "{{n}} доступно",
            "noResults": "Экран не найден для \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ ТВОЙ КОСМИЧЕСКИЙ ПОРТРЕТ",
            "title": "Звезды знают тебя",
            "starsKnowYou": "Звезды знают тебя",
            "subtitle": "Твой уникальный духовный профиль — раскрытый через даты, цифры и небо.",
            "zodiacBadge": "ЗНАК ЗОДИАКА",
            "lifePathBadge": "ЧИСЛО ЖИЗНИ",
            "master": " · МАСТЕРСКОЕ",
            "soulChallenge": "⚡ ВЫЗОВ ДУШИ",
            "ascendantBadge": "АСЦЕНДЕНТ · МАСКА",
            "ctaButton": "Войти в Aethera ✦",
            "ctaHint": "Твой профиль защищен и зашифрован. Ты всегда можешь изменить его в настройках."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "Выбери свой план духовного роста"
            },
            "plan": {
                "activePlan": "Активный план",
                "selectedPlan": "Выбранный план"
            },
            "cta": {
                "currentPlan": "Твой текущий план",
                "startSoul": "Начать план Душа — 59,99/мес.",
                "startMaster": "Начать план Мастер — 499/год",
                "cancelHint": "Ты можешь отменить в любое время.",
                "storeHint": "Надежно хранится через Google Play / App Store."
            },
            "whySection": {
                "title": "ПОЧЕМУ СТОИТ",
                "unlimitedOracle": "Безлимитный Оракул",
                "moonRituals": "Лунные ритуалы",
                "aiDreams": "ИИ анализирует сны",
                "destinyMatrix": "Матрица судьбы",
                "soundBath": "Звуковая ванна и бинауральные",
                "partnerTarot": "Партнерское Таро"
            },
            "testimonialsSection": {
                "title": "ЧТО ГОВОРЯТ ДУШИ"
            },
            "badges": {
                "securePayment": "Безопасная оплата",
                "cancelAnytime": "Отмена когда угодно",
                "refund": "Возврат 7 дней"
            }
        },
        "communityEvents": {
            "title": "Календарь мероприятий",
            "upcomingCount": "{{n}} предстоящих",
            "tab": {
                "upcoming": "Предстоящие",
                "mine": "Мои",
                "past": "Архив"
            },
            "section": {
                "today": "СЕГОДНЯ",
                "thisWeek": "НА ЭТОЙ НЕДЕЛЕ",
                "later": "ПОЗЖЕ"
            },
            "filter": {
                "all": "Все",
                "meditation": "Медитация",
                "ritual": "Ритуал",
                "tarot": "Таро",
                "meeting": "Встреча"
            },
            "card": {
                "participants": "участников",
                "enterNow": "Войти сейчас",
                "joined": "Записан(а)",
                "full": "Мест нет",
                "enterLive": "🔴 Войти в прямой эфир",
                "join": "Присоединиться"
            },
            "modal": {
                "newEvent": "Новое мероприятие",
                "titleLabel": "Название *",
                "titlePlaceholder": "Название мероприятия...",
                "descLabel": "Описание",
                "descPlaceholder": "Краткое описание встречи...",
                "coverEmojiLabel": "Обложка-эмодзи",
                "typeLabel": "Тип",
                "dateLabel": "Дата и время (ДД.ММ ЧЧ:ММ)",
                "datePlaceholder": "напр. 25.04 20:00",
                "durationLabel": "Продолжительность",
                "maxParticipantsLabel": "Макс. участников",
                "privateLabel": "Закрытое мероприятие",
                "privateSubLabel": "Только по коду приглашения",
                "creating": "Создаю...",
                "createBtn": "Создать мероприятие"
            },
            "joinModal": {
                "title": "Войти по коду",
                "subtitle": "Введите 6-значный код приглашения",
                "joining": "Присоединяюсь...",
                "joinBtn": "Присоединиться"
            },
            "empty": {
                "title": "Нет мероприятий",
                "mine": "Ты ещё не записан(а) ни на одно мероприятие.",
                "upcoming": "Нет предстоящих мероприятий в этой категории."
            }
        }
    },
    "ar": {
        "search": {
            "placeholder": "ابحث عن شاشة أو ميزة...",
            "countFound": "{{n}} شاشات لـ \"{{q}}\"",
            "countAll": "{{n}} متاحة",
            "noResults": "لم يتم العثور على شاشة لـ \"{{q}}\""
        },
        "spiritualReveal": {
            "eyebrow": "✦ صورتك الكونية",
            "title": "النجوم تعرفك",
            "starsKnowYou": "النجوم تعرفك",
            "subtitle": "ملفك الروحي الفريد — مكشوف من خلال التواريخ والأرقام والسماء.",
            "zodiacBadge": "برج الزودياك",
            "lifePathBadge": "رقم مسار الحياة",
            "master": " · إتقان",
            "soulChallenge": "⚡ تحدي الروح",
            "ascendantBadge": "الصاعد · القناع",
            "ctaButton": "ادخل إلى Aethera ✦",
            "ctaHint": "ملفك الشخصي آمن ومشفر. يمكنك دائمًا تعديله في الإعدادات."
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "اختر خطة نموك الروحي"
            },
            "plan": {
                "activePlan": "الخطة النشطة",
                "selectedPlan": "الخطة المختارة"
            },
            "cta": {
                "currentPlan": "خطتك الحالية",
                "startSoul": "ابدأ خطة الروح — 59.99/شهر",
                "startMaster": "ابدأ خطة الماستر — 499/سنة",
                "cancelHint": "يمكنك الإلغاء في أي وقت.",
                "storeHint": "محفوظ بأمان بواسطة Google Play / App Store."
            },
            "whySection": {
                "title": "لماذا الترقية",
                "unlimitedOracle": "أوراكل غير محدود",
                "moonRituals": "طقوس القمر",
                "aiDreams": "الذكاء الاصطناعي يحلل الأحلام",
                "destinyMatrix": "مصفوفة المصير",
                "soundBath": "حمام الصوت والثنائي",
                "partnerTarot": "تاروت الشريك"
            },
            "testimonialsSection": {
                "title": "ما تقوله الأرواح"
            },
            "badges": {
                "securePayment": "دفع آمن",
                "cancelAnytime": "إلغاء في أي وقت",
                "refund": "استرداد 7 أيام"
            }
        },
        "communityEvents": {
            "title": "تقويم الأحداث",
            "upcomingCount": "{{n}} قادم",
            "tab": {
                "upcoming": "القادمة",
                "mine": "أحداثي",
                "past": "الأرشيف"
            },
            "section": {
                "today": "اليوم",
                "thisWeek": "هذا الأسبوع",
                "later": "لاحقًا"
            },
            "filter": {
                "all": "الكل",
                "meditation": "تأمل",
                "ritual": "طقوس",
                "tarot": "تاروت",
                "meeting": "اجتماع"
            },
            "card": {
                "participants": "مشاركون",
                "enterNow": "ادخل الآن",
                "joined": "مسجل(ة)",
                "full": "ممتلئ",
                "enterLive": "🔴 ادخل مباشرة",
                "join": "انضم"
            },
            "modal": {
                "newEvent": "حدث جديد",
                "titleLabel": "العنوان *",
                "titlePlaceholder": "اسم الحدث...",
                "descLabel": "الوصف",
                "descPlaceholder": "وصف موجز للاجتماع...",
                "coverEmojiLabel": "رمز الغلاف",
                "typeLabel": "النوع",
                "dateLabel": "التاريخ والوقت (يي.شش سس:دد)",
                "datePlaceholder": "مثال: 25.04 20:00",
                "durationLabel": "المدة",
                "maxParticipantsLabel": "أقصى عدد للمشاركين",
                "privateLabel": "حدث خاص",
                "privateSubLabel": "بكود الدعوة فقط",
                "creating": "جارٍ الإنشاء...",
                "createBtn": "إنشاء حدث"
            },
            "joinModal": {
                "title": "الانضمام بالكود",
                "subtitle": "أدخل كود الدعوة المكون من 6 أحرف",
                "joining": "جارٍ الانضمام...",
                "joinBtn": "انضم"
            },
            "empty": {
                "title": "لا أحداث",
                "mine": "لم تنضم بعد إلى أي حدث.",
                "upcoming": "لا توجد أحداث قادمة في هذه الفئة."
            }
        }
    },
    "ja": {
        "search": {
            "placeholder": "画面または機能を検索...",
            "countFound": "「{{q}}」の{{n}}画面",
            "countAll": "{{n}}件利用可能",
            "noResults": "「{{q}}」の画面が見つかりません"
        },
        "spiritualReveal": {
            "eyebrow": "✦ あなたの宇宙的肖像",
            "title": "星があなたを知っている",
            "starsKnowYou": "星があなたを知っている",
            "subtitle": "日付、数字、そして空によって明かされたあなただけのスピリチュアルプロフィール。",
            "zodiacBadge": "星座",
            "lifePathBadge": "ライフパスナンバー",
            "master": " · マスター",
            "soulChallenge": "⚡ ソウルチャレンジ",
            "ascendantBadge": "アセンダント · マスク",
            "ctaButton": "Aetheraに入る ✦",
            "ctaHint": "あなたのプロフィールは安全で暗号化されています。設定でいつでも編集できます。"
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "スピリチュアル成長プランを選択"
            },
            "plan": {
                "activePlan": "アクティブプラン",
                "selectedPlan": "選択されたプラン"
            },
            "cta": {
                "currentPlan": "現在のプラン",
                "startSoul": "ソウルプランを開始 — 59.99/月",
                "startMaster": "マスタープランを開始 — 499/年",
                "cancelHint": "いつでもキャンセルできます。",
                "storeHint": "Google Play / App Storeで安全に保存されています。"
            },
            "whySection": {
                "title": "アップグレードの理由",
                "unlimitedOracle": "無制限オラクル",
                "moonRituals": "月のリチュアル",
                "aiDreams": "AIが夢を分析",
                "destinyMatrix": "デスティニーマトリックス",
                "soundBath": "サウンドバス & バイノーラル",
                "partnerTarot": "パートナータロット"
            },
            "testimonialsSection": {
                "title": "ソウルたちの声"
            },
            "badges": {
                "securePayment": "安全な支払い",
                "cancelAnytime": "いつでもキャンセル",
                "refund": "7日間返金"
            }
        },
        "communityEvents": {
            "title": "イベントカレンダー",
            "upcomingCount": "{{n}}件の予定",
            "tab": {
                "upcoming": "予定",
                "mine": "マイイベント",
                "past": "アーカイブ"
            },
            "section": {
                "today": "今日",
                "thisWeek": "今週",
                "later": "後日"
            },
            "filter": {
                "all": "すべて",
                "meditation": "瞑想",
                "ritual": "儀式",
                "tarot": "タロット",
                "meeting": "ミーティング"
            },
            "card": {
                "participants": "参加者",
                "enterNow": "今すぐ入る",
                "joined": "登録済み",
                "full": "満員",
                "enterLive": "🔴 ライブに入る",
                "join": "参加"
            },
            "modal": {
                "newEvent": "新しいイベント",
                "titleLabel": "タイトル *",
                "titlePlaceholder": "イベント名...",
                "descLabel": "説明",
                "descPlaceholder": "ミーティングの簡単な説明...",
                "coverEmojiLabel": "カバー絵文字",
                "typeLabel": "タイプ",
                "dateLabel": "日付と時刻 (DD.MM HH:MM)",
                "datePlaceholder": "例: 25.04 20:00",
                "durationLabel": "所要時間",
                "maxParticipantsLabel": "最大参加者数",
                "privateLabel": "プライベートイベント",
                "privateSubLabel": "招待コードのみ",
                "creating": "作成中...",
                "createBtn": "イベントを作成"
            },
            "joinModal": {
                "title": "コードで参加",
                "subtitle": "6文字の招待コードを入力",
                "joining": "参加中...",
                "joinBtn": "参加"
            },
            "empty": {
                "title": "イベントなし",
                "mine": "まだどのイベントにも登録していません。",
                "upcoming": "このカテゴリに予定されているイベントはありません。"
            }
        }
    },
    "zh": {
        "search": {
            "placeholder": "搜索屏幕或功能...",
            "countFound": "找到{{n}}个屏幕，关键词\"{{q}}\"",
            "countAll": "{{n}}个可用",
            "noResults": "未找到\"{{q}}\"的相关屏幕"
        },
        "spiritualReveal": {
            "eyebrow": "✦ 你的宇宙肖像",
            "title": "星星了解你",
            "starsKnowYou": "星星了解你",
            "subtitle": "你独特的灵性档案——通过日期、数字和天空揭示。",
            "zodiacBadge": "星座",
            "lifePathBadge": "生命数字",
            "master": " · 大师数",
            "soulChallenge": "⚡ 灵魂挑战",
            "ascendantBadge": "上升星座 · 面具",
            "ctaButton": "进入Aethera ✦",
            "ctaHint": "你的档案是安全且加密的。你随时可以在设置中编辑它。"
        },
        "premium": {
            "hero": {
                "title": "AETHERA PREMIUM",
                "subtitle": "选择你的灵性成长计划"
            },
            "plan": {
                "activePlan": "当前计划",
                "selectedPlan": "已选计划"
            },
            "cta": {
                "currentPlan": "你的当前计划",
                "startSoul": "开始灵魂计划 — 59.99/月",
                "startMaster": "开始大师计划 — 499/年",
                "cancelHint": "你可以随时取消。",
                "storeHint": "通过Google Play / App Store安全存储。"
            },
            "whySection": {
                "title": "为何升级",
                "unlimitedOracle": "无限神谕",
                "moonRituals": "月亮仪式",
                "aiDreams": "AI分析梦境",
                "destinyMatrix": "命运矩阵",
                "soundBath": "声音浴 & 双耳节拍",
                "partnerTarot": "伴侣塔罗"
            },
            "testimonialsSection": {
                "title": "灵魂们的声音"
            },
            "badges": {
                "securePayment": "安全支付",
                "cancelAnytime": "随时取消",
                "refund": "7天退款"
            }
        },
        "communityEvents": {
            "title": "活动日历",
            "upcomingCount": "{{n}}个即将举行",
            "tab": {
                "upcoming": "即将举行",
                "mine": "我的活动",
                "past": "存档"
            },
            "section": {
                "today": "今天",
                "thisWeek": "本周",
                "later": "稍后"
            },
            "filter": {
                "all": "全部",
                "meditation": "冥想",
                "ritual": "仪式",
                "tarot": "塔罗",
                "meeting": "会议"
            },
            "card": {
                "participants": "参与者",
                "enterNow": "立即进入",
                "joined": "已报名",
                "full": "已满",
                "enterLive": "🔴 进入直播",
                "join": "加入"
            },
            "modal": {
                "newEvent": "新活动",
                "titleLabel": "标题 *",
                "titlePlaceholder": "活动名称...",
                "descLabel": "描述",
                "descPlaceholder": "会议的简短描述...",
                "coverEmojiLabel": "封面表情",
                "typeLabel": "类型",
                "dateLabel": "日期和时间 (DD.MM HH:MM)",
                "datePlaceholder": "例如: 25.04 20:00",
                "durationLabel": "持续时间",
                "maxParticipantsLabel": "最大参与人数",
                "privateLabel": "私人活动",
                "privateSubLabel": "仅限邀请码",
                "creating": "创建中...",
                "createBtn": "创建活动"
            },
            "joinModal": {
                "title": "通过代码加入",
                "subtitle": "输入6位邀请码",
                "joining": "加入中...",
                "joinBtn": "加入"
            },
            "empty": {
                "title": "没有活动",
                "mine": "你尚未报名参加任何活动。",
                "upcoming": "该类别中没有即将举行的活动。"
            }
        }
    }
}

def deep_merge(base, additions):
    """Merge additions into base dict, preserving existing keys."""
    result = dict(base)
    for key, value in additions.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            # Only add if key doesn't exist (don't overwrite existing translations)
            if key not in result:
                result[key] = value
    return result

updated = 0
for lang, additions in NEW_KEYS.items():
    filepath = os.path.join(I18N_DIR, f"{lang}.json")
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} not found")
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    merged = deep_merge(data, additions)
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f"OK: {lang}.json updated")
    updated += 1

print(f"\nDone. Updated {updated} files.")
