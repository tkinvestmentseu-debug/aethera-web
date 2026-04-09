#!/usr/bin/env python3
"""Add social.* section to all 11 language files."""
import json, os

BASE = r"D:\Soulverse\src\core\i18n"

SOCIAL = {
    "en": {
        "stat": {
            "votes": "votes",
            "participants": "participants",
            "chronicles": "Essays · Reflections",
            "onlineNow": "souls online now"
        },
        "hero": {
            "eyebrow": "✦ COSMIC COMMUNITY",
            "title": "You are connected",
            "online": "souls active now",
            "live": "LIVE"
        },
        "hub": {
            "title": "COMMUNITY PORTALS",
            "count": "17 spaces"
        },
        "section": {
            "energyCircleTitle": "Energy Circle",
            "energyCircleSub": "Synchronous group meditation",
            "tarotTitle": "Community Tarot",
            "tarotSub": "The community card of the day",
            "liveRitualsTitle": "Live Rituals",
            "liveRitualsSub": "Ceremonies led by masters",
            "matchingTitle": "Cosmic Match",
            "matchingSub": "Soul resonance and energies",
            "dreamsTitle": "Dream Symbolarium",
            "dreamsSub": "Community dream trends · anonymous",
            "affirmationTitle": "Community Affirmation",
            "affirmationSub": "Voting every 24h",
            "challengesTitle": "Soul Challenges",
            "challengesSub": "Collective paths of transformation",
            "intentionsTitle": "Intention Chamber",
            "intentionsSub": "Shared manifestation board",
            "feedTitle": "Field of Awareness",
            "feedSub": "Reflections and community breakthroughs",
            "mentorsTitle": "Soul Mentors",
            "mentorsSub": "Sessions with spiritual guides",
            "portalsTitle": "Cosmic Portals",
            "portalsSub": "Shared celebrations of energy",
            "chronicleTitle": "Community Chronicle",
            "chronicleSub": "Essays and archive of spiritual wisdom"
        },
        "energy": {
            "nextSession": "next session",
            "ready": "ready",
            "in": "in",
            "topic": "Grounding and inner peace",
            "circleEnergy": "CIRCLE ENERGY",
            "highCoherence": "high coherence",
            "joined": "You joined the circle ✓",
            "join": "Join the circle"
        },
        "tarot": {
            "card": "The Star",
            "theme": "Hope and renewal",
            "energyLabel": "Energy",
            "comment": "This card reminded me that after every darkness, light returns.",
            "interpretations": "interpretations",
            "addYours": "Add yours"
        },
        "rituals": {
            "startFirst": "Start the first ritual"
        },
        "ritual": {
            "unnamed": "Community Ritual",
            "hostedBy": "Hosted by:",
            "host": "Community Master"
        },
        "match": {
            "discover": "Discover souls resonating with your energy",
            "sub": "Based on your zodiac sign and archetype",
            "btn": "Find your resonant souls"
        },
        "dreams": {
            "mostCommon": "Most common symbols tonight",
            "addSymbol": "Add a symbol from your dream"
        },
        "affirmation": {
            "text": "I am ready to receive the love I have been seeking within myself for so long.",
            "confirmed": "of the community confirmed",
            "confirmedState": "Confirmed",
            "confirm": "Confirm"
        },
        "intentions": {
            "yours": "YOUR INTENTION",
            "placeholder": "Write the intention you want to send into the world...",
            "send": "Send intention",
            "sent": "Intention sent — the community is bearing witness ✓",
            "witnesses": "witnesses"
        },
        "feed": {
            "placeholder": "Share your reflection with the community...",
            "publish": "Publish",
            "empty": "Be the first to share",
            "emptySub": "Share a reflection with the whole community",
            "anonSoul": "Anonymous Soul",
            "reply": "Reply"
        },
        "mentors": {
            "discover": "Discover Soul Mentors",
            "discoverSub": "Private sessions with spiritual guides",
            "mentor": "Mentor",
            "sessions": "sessions",
            "book": "Book a session"
        },
        "chronicle": {
            "empty": "Write the first chronicle",
            "emptySub": "Share your knowledge and experience",
            "by": "by"
        },
        "more": "more",
        "moreBtn": "More",
        "participants": "participants",
        "days": "days",
        "daysUpper": "DAYS",
        "voteCount": "votes",
        "challenges": {
            "completed": "completed"
        }
    },
    "pl": {
        "stat": {
            "votes": "głosów",
            "participants": "uczestników",
            "chronicles": "Eseje · Refleksje",
            "onlineNow": "dusz online teraz"
        },
        "hero": {
            "eyebrow": "✦ KOSMICZNA WSPÓLNOTA",
            "title": "Jesteś połączona",
            "online": "dusz aktywnych teraz",
            "live": "NA ŻYWO"
        },
        "hub": {
            "title": "PORTALE WSPÓLNOTY",
            "count": "17 przestrzeni"
        },
        "section": {
            "energyCircleTitle": "Krąg Energetyczny",
            "energyCircleSub": "Synchroniczna medytacja grupy",
            "tarotTitle": "Tarot Wspólnoty",
            "tarotSub": "Karta dnia całej wspólnoty",
            "liveRitualsTitle": "Rytuały na Żywo",
            "liveRitualsSub": "Ceremonie prowadzone przez mistrzów",
            "matchingTitle": "Kosmiczne Dopasowanie",
            "matchingSub": "Energie i rezonans dusz",
            "dreamsTitle": "Symbolarium Snów",
            "dreamsSub": "Trendy snów wspólnoty · anonimowo",
            "affirmationTitle": "Afirmacja Wspólnoty",
            "affirmationSub": "Głosowanie co 24h",
            "challengesTitle": "Wyzwania Ducha",
            "challengesSub": "Zbiorowe ścieżki transformacji",
            "intentionsTitle": "Komora Intencji",
            "intentionsSub": "Wspólna tablica manifestacji",
            "feedTitle": "Pasmo Świadomości",
            "feedSub": "Refleksje i przełomy wspólnoty",
            "mentorsTitle": "Mentorzy Duszy",
            "mentorsSub": "Sesje z duchowymi przewodnikami",
            "portalsTitle": "Portale Kosmiczne",
            "portalsSub": "Zbiorowe świętowania energii",
            "chronicleTitle": "Kronika Wspólnoty",
            "chronicleSub": "Eseje i archiwum duchowej wiedzy"
        },
        "energy": {
            "nextSession": "następna sesja",
            "ready": "gotowych",
            "in": "za",
            "topic": "Uziemienie i wewnętrzny spokój",
            "circleEnergy": "ENERGIA KRĘGU",
            "highCoherence": "wysoka spójność",
            "joined": "Dołączyłeś do kręgu ✓",
            "join": "Dołącz do kręgu"
        },
        "tarot": {
            "card": "Gwiazda",
            "theme": "Nadzieja i odnowa",
            "energyLabel": "Energia",
            "comment": "Ta karta przypomniała mi, że po każdej ciemności wraca światło.",
            "interpretations": "interpretacji",
            "addYours": "Dodaj swoją"
        },
        "rituals": {
            "startFirst": "Zacznij pierwszy rytuał"
        },
        "ritual": {
            "unnamed": "Rytuał Wspólnoty",
            "hostedBy": "Prowadzi:",
            "host": "Mistrz Wspólnoty"
        },
        "match": {
            "discover": "Odkryj dusze rezonujące z twoją energią",
            "sub": "Na podstawie twojego znaku zodiaku i archetypu",
            "btn": "Znajdź swoje rezonujące dusze"
        },
        "dreams": {
            "mostCommon": "Najczęstsze symbole tej nocy",
            "addSymbol": "Dodaj symbol ze swojego snu"
        },
        "affirmation": {
            "text": "Jestem gotowa przyjąć miłość, której szukałam w sobie przez tak długi czas.",
            "confirmed": "społeczności potwierdziło",
            "confirmedState": "Potwierdzona",
            "confirm": "Potwierdź"
        },
        "intentions": {
            "yours": "TWOJA INTENCJA",
            "placeholder": "Napisz intencję, którą chcesz posłać światu...",
            "send": "Wyślij intencję",
            "sent": "Intencja wysłana — wspólnota jest świadkiem ✓",
            "witnesses": "świadków"
        },
        "feed": {
            "placeholder": "Podziel się swoją refleksją ze wspólnotą...",
            "publish": "Opublikuj",
            "empty": "Bądź pierwszą osobą która się podzieli",
            "emptySub": "Podziel się refleksją z całą wspólnotą",
            "anonSoul": "Anonimowa Dusza",
            "reply": "Odpowiedz"
        },
        "mentors": {
            "discover": "Odkryj Mentorów Duszy",
            "discoverSub": "Prywatne sesje z duchowymi przewodnikami",
            "mentor": "Mentor",
            "sessions": "sesji",
            "book": "Zarezerwuj sesję"
        },
        "chronicle": {
            "empty": "Napisz pierwszą kronikę",
            "emptySub": "Podziel się wiedzą i doświadczeniem",
            "by": "przez"
        },
        "more": "więcej",
        "moreBtn": "Więcej",
        "participants": "uczestników",
        "days": "dni",
        "daysUpper": "DNI",
        "voteCount": "głosów",
        "challenges": {
            "completed": "ukończono"
        }
    },
    "de": {
        "stat": {"votes": "Stimmen", "participants": "Teilnehmer", "chronicles": "Essays · Reflexionen", "onlineNow": "Seelen jetzt online"},
        "hero": {"eyebrow": "✦ KOSMISCHE GEMEINSCHAFT", "title": "Du bist verbunden", "online": "aktive Seelen jetzt", "live": "LIVE"},
        "hub": {"title": "GEMEINSCHAFTSPORTALE", "count": "17 Räume"},
        "section": {
            "energyCircleTitle": "Energiekreis", "energyCircleSub": "Synchrone Gruppenmeditation",
            "tarotTitle": "Gemeinschaftstarot", "tarotSub": "Die Tageskarte der Gemeinschaft",
            "liveRitualsTitle": "Live-Rituale", "liveRitualsSub": "Von Meistern geleitete Zeremonien",
            "matchingTitle": "Kosmisches Match", "matchingSub": "Seelenresonanz und Energien",
            "dreamsTitle": "Traumsymbolarium", "dreamsSub": "Traumtrends der Gemeinschaft · anonym",
            "affirmationTitle": "Gemeinschaftsaffirmation", "affirmationSub": "Abstimmung alle 24h",
            "challengesTitle": "Seelen-Challenges", "challengesSub": "Kollektive Transformationspfade",
            "intentionsTitle": "Absichtskammer", "intentionsSub": "Gemeinsames Manifestationsbrett",
            "feedTitle": "Bewusstseinsfeld", "feedSub": "Reflexionen und Gemeinschaftsdurchbrüche",
            "mentorsTitle": "Seelenmentoren", "mentorsSub": "Sitzungen mit spirituellen Führern",
            "portalsTitle": "Kosmische Portale", "portalsSub": "Gemeinsame Energiefeiern",
            "chronicleTitle": "Gemeinschaftschronik", "chronicleSub": "Essays und Archiv spirituellen Wissens"
        },
        "energy": {"nextSession": "nächste Sitzung", "ready": "bereit", "in": "in", "topic": "Erdung und innerer Frieden", "circleEnergy": "KREISENERGIE", "highCoherence": "hohe Kohärenz", "joined": "Du bist dem Kreis beigetreten ✓", "join": "Dem Kreis beitreten"},
        "tarot": {"card": "Der Stern", "theme": "Hoffnung und Erneuerung", "energyLabel": "Energie", "comment": "Diese Karte erinnerte mich daran, dass nach jeder Dunkelheit das Licht zurückkehrt.", "interpretations": "Interpretationen", "addYours": "Deine hinzufügen"},
        "rituals": {"startFirst": "Erstes Ritual starten"},
        "ritual": {"unnamed": "Gemeinschaftsritual", "hostedBy": "Geleitet von:", "host": "Gemeinschaftsmeister"},
        "match": {"discover": "Entdecke mit deiner Energie resonante Seelen", "sub": "Basierend auf deinem Sternzeichen und Archetyp", "btn": "Finde deine resonanten Seelen"},
        "dreams": {"mostCommon": "Häufigste Symbole heute Nacht", "addSymbol": "Symbol aus deinem Traum hinzufügen"},
        "affirmation": {"text": "Ich bin bereit, die Liebe zu empfangen, die ich so lange in mir gesucht habe.", "confirmed": "der Gemeinschaft bestätigt", "confirmedState": "Bestätigt", "confirm": "Bestätigen"},
        "intentions": {"yours": "DEINE ABSICHT", "placeholder": "Schreibe die Absicht, die du in die Welt senden möchtest...", "send": "Absicht senden", "sent": "Absicht gesendet — die Gemeinschaft ist Zeuge ✓", "witnesses": "Zeugen"},
        "feed": {"placeholder": "Teile deine Reflexion mit der Gemeinschaft...", "publish": "Veröffentlichen", "empty": "Sei der Erste, der teilt", "emptySub": "Teile eine Reflexion mit der ganzen Gemeinschaft", "anonSoul": "Anonyme Seele", "reply": "Antworten"},
        "mentors": {"discover": "Seelenmentoren entdecken", "discoverSub": "Private Sitzungen mit spirituellen Führern", "mentor": "Mentor", "sessions": "Sitzungen", "book": "Sitzung buchen"},
        "chronicle": {"empty": "Erste Chronik schreiben", "emptySub": "Wissen und Erfahrung teilen", "by": "von"},
        "more": "mehr", "moreBtn": "Mehr", "participants": "Teilnehmer", "days": "Tage", "daysUpper": "TAGE", "voteCount": "Stimmen",
        "challenges": {"completed": "abgeschlossen"}
    },
    "es": {
        "stat": {"votes": "votos", "participants": "participantes", "chronicles": "Ensayos · Reflexiones", "onlineNow": "almas en línea ahora"},
        "hero": {"eyebrow": "✦ COMUNIDAD CÓSMICA", "title": "Estás conectado", "online": "almas activas ahora", "live": "EN VIVO"},
        "hub": {"title": "PORTALES COMUNITARIOS", "count": "17 espacios"},
        "section": {
            "energyCircleTitle": "Círculo de Energía", "energyCircleSub": "Meditación grupal sincronizada",
            "tarotTitle": "Tarot Comunitario", "tarotSub": "La carta del día de la comunidad",
            "liveRitualsTitle": "Rituales en Vivo", "liveRitualsSub": "Ceremonias dirigidas por maestros",
            "matchingTitle": "Encuentro Cósmico", "matchingSub": "Resonancia y energías del alma",
            "dreamsTitle": "Simbolario de Sueños", "dreamsSub": "Tendencias de sueños · anónimo",
            "affirmationTitle": "Afirmación Comunitaria", "affirmationSub": "Votación cada 24h",
            "challengesTitle": "Desafíos del Alma", "challengesSub": "Caminos colectivos de transformación",
            "intentionsTitle": "Cámara de Intenciones", "intentionsSub": "Tablero de manifestación compartido",
            "feedTitle": "Campo de Conciencia", "feedSub": "Reflexiones y avances comunitarios",
            "mentorsTitle": "Mentores del Alma", "mentorsSub": "Sesiones con guías espirituales",
            "portalsTitle": "Portales Cósmicos", "portalsSub": "Celebraciones de energía compartida",
            "chronicleTitle": "Crónica Comunitaria", "chronicleSub": "Ensayos y archivo de sabiduría espiritual"
        },
        "energy": {"nextSession": "próxima sesión", "ready": "listos", "in": "en", "topic": "Conexión a tierra y paz interior", "circleEnergy": "ENERGÍA DEL CÍRCULO", "highCoherence": "alta coherencia", "joined": "Te uniste al círculo ✓", "join": "Unirse al círculo"},
        "tarot": {"card": "La Estrella", "theme": "Esperanza y renovación", "energyLabel": "Energía", "comment": "Esta carta me recordó que después de cada oscuridad, la luz regresa.", "interpretations": "interpretaciones", "addYours": "Añade la tuya"},
        "rituals": {"startFirst": "Iniciar el primer ritual"},
        "ritual": {"unnamed": "Ritual Comunitario", "hostedBy": "Dirigido por:", "host": "Maestro Comunitario"},
        "match": {"discover": "Descubre almas que resuenan con tu energía", "sub": "Basado en tu signo zodiacal y arquetipo", "btn": "Encuentra tus almas resonantes"},
        "dreams": {"mostCommon": "Símbolos más comunes esta noche", "addSymbol": "Añade un símbolo de tu sueño"},
        "affirmation": {"text": "Estoy listo para recibir el amor que he buscado dentro de mí durante tanto tiempo.", "confirmed": "de la comunidad confirmó", "confirmedState": "Confirmado", "confirm": "Confirmar"},
        "intentions": {"yours": "TU INTENCIÓN", "placeholder": "Escribe la intención que quieres enviar al mundo...", "send": "Enviar intención", "sent": "Intención enviada — la comunidad es testigo ✓", "witnesses": "testigos"},
        "feed": {"placeholder": "Comparte tu reflexión con la comunidad...", "publish": "Publicar", "empty": "Sé el primero en compartir", "emptySub": "Comparte una reflexión con toda la comunidad", "anonSoul": "Alma Anónima", "reply": "Responder"},
        "mentors": {"discover": "Descubrir Mentores del Alma", "discoverSub": "Sesiones privadas con guías espirituales", "mentor": "Mentor", "sessions": "sesiones", "book": "Reservar sesión"},
        "chronicle": {"empty": "Escribe la primera crónica", "emptySub": "Comparte tu conocimiento y experiencia", "by": "por"},
        "more": "más", "moreBtn": "Más", "participants": "participantes", "days": "días", "daysUpper": "DÍAS", "voteCount": "votos",
        "challenges": {"completed": "completado"}
    },
    "fr": {
        "stat": {"votes": "votes", "participants": "participants", "chronicles": "Essais · Réflexions", "onlineNow": "âmes en ligne maintenant"},
        "hero": {"eyebrow": "✦ COMMUNAUTÉ COSMIQUE", "title": "Vous êtes connecté", "online": "âmes actives maintenant", "live": "EN DIRECT"},
        "hub": {"title": "PORTAILS COMMUNAUTAIRES", "count": "17 espaces"},
        "section": {
            "energyCircleTitle": "Cercle d'Énergie", "energyCircleSub": "Méditation de groupe synchronisée",
            "tarotTitle": "Tarot Communautaire", "tarotSub": "La carte du jour de la communauté",
            "liveRitualsTitle": "Rituels en Direct", "liveRitualsSub": "Cérémonies dirigées par des maîtres",
            "matchingTitle": "Correspondance Cosmique", "matchingSub": "Résonance et énergies des âmes",
            "dreamsTitle": "Symbolaire des Rêves", "dreamsSub": "Tendances de rêves · anonyme",
            "affirmationTitle": "Affirmation Communautaire", "affirmationSub": "Vote toutes les 24h",
            "challengesTitle": "Défis de l'Âme", "challengesSub": "Chemins collectifs de transformation",
            "intentionsTitle": "Chambre des Intentions", "intentionsSub": "Tableau de manifestation partagé",
            "feedTitle": "Champ de Conscience", "feedSub": "Réflexions et percées communautaires",
            "mentorsTitle": "Mentors de l'Âme", "mentorsSub": "Sessions avec des guides spirituels",
            "portalsTitle": "Portails Cosmiques", "portalsSub": "Célébrations d'énergie partagées",
            "chronicleTitle": "Chronique Communautaire", "chronicleSub": "Essais et archives de sagesse spirituelle"
        },
        "energy": {"nextSession": "prochaine session", "ready": "prêts", "in": "dans", "topic": "Ancrage et paix intérieure", "circleEnergy": "ÉNERGIE DU CERCLE", "highCoherence": "haute cohérence", "joined": "Vous avez rejoint le cercle ✓", "join": "Rejoindre le cercle"},
        "tarot": {"card": "L'Étoile", "theme": "Espoir et renouveau", "energyLabel": "Énergie", "comment": "Cette carte m'a rappelé qu'après chaque obscurité, la lumière revient.", "interpretations": "interprétations", "addYours": "Ajouter la vôtre"},
        "rituals": {"startFirst": "Démarrer le premier rituel"},
        "ritual": {"unnamed": "Rituel Communautaire", "hostedBy": "Animé par:", "host": "Maître Communautaire"},
        "match": {"discover": "Découvrez des âmes résonnant avec votre énergie", "sub": "Basé sur votre signe zodiacal et archétype", "btn": "Trouvez vos âmes résonnantes"},
        "dreams": {"mostCommon": "Symboles les plus courants cette nuit", "addSymbol": "Ajouter un symbole de votre rêve"},
        "affirmation": {"text": "Je suis prêt à recevoir l'amour que je cherchais en moi depuis si longtemps.", "confirmed": "de la communauté a confirmé", "confirmedState": "Confirmé", "confirm": "Confirmer"},
        "intentions": {"yours": "VOTRE INTENTION", "placeholder": "Écrivez l'intention que vous voulez envoyer dans le monde...", "send": "Envoyer l'intention", "sent": "Intention envoyée — la communauté en est témoin ✓", "witnesses": "témoins"},
        "feed": {"placeholder": "Partagez votre réflexion avec la communauté...", "publish": "Publier", "empty": "Soyez le premier à partager", "emptySub": "Partagez une réflexion avec toute la communauté", "anonSoul": "Âme Anonyme", "reply": "Répondre"},
        "mentors": {"discover": "Découvrir les Mentors de l'Âme", "discoverSub": "Sessions privées avec des guides spirituels", "mentor": "Mentor", "sessions": "sessions", "book": "Réserver une session"},
        "chronicle": {"empty": "Écrire la première chronique", "emptySub": "Partagez vos connaissances et expériences", "by": "par"},
        "more": "plus", "moreBtn": "Plus", "participants": "participants", "days": "jours", "daysUpper": "JOURS", "voteCount": "votes",
        "challenges": {"completed": "complété"}
    },
    "it": {
        "stat": {"votes": "voti", "participants": "partecipanti", "chronicles": "Saggi · Riflessioni", "onlineNow": "anime online ora"},
        "hero": {"eyebrow": "✦ COMUNITÀ COSMICA", "title": "Sei connesso", "online": "anime attive ora", "live": "IN DIRETTA"},
        "hub": {"title": "PORTALI DELLA COMUNITÀ", "count": "17 spazi"},
        "section": {
            "energyCircleTitle": "Cerchio Energetico", "energyCircleSub": "Meditazione di gruppo sincronizzata",
            "tarotTitle": "Tarocchi della Comunità", "tarotSub": "La carta del giorno della comunità",
            "liveRitualsTitle": "Rituali dal Vivo", "liveRitualsSub": "Cerimonie condotte da maestri",
            "matchingTitle": "Corrispondenza Cosmica", "matchingSub": "Risonanza e energie dell'anima",
            "dreamsTitle": "Simbolario dei Sogni", "dreamsSub": "Tendenze dei sogni · anonimo",
            "affirmationTitle": "Affermazione della Comunità", "affirmationSub": "Votazione ogni 24h",
            "challengesTitle": "Sfide dell'Anima", "challengesSub": "Percorsi collettivi di trasformazione",
            "intentionsTitle": "Camera delle Intenzioni", "intentionsSub": "Bacheca di manifestazione condivisa",
            "feedTitle": "Campo di Coscienza", "feedSub": "Riflessioni e scoperte della comunità",
            "mentorsTitle": "Mentori dell'Anima", "mentorsSub": "Sessioni con guide spirituali",
            "portalsTitle": "Portali Cosmici", "portalsSub": "Celebrazioni di energia condivise",
            "chronicleTitle": "Cronaca della Comunità", "chronicleSub": "Saggi e archivio di saggezza spirituale"
        },
        "energy": {"nextSession": "prossima sessione", "ready": "pronti", "in": "tra", "topic": "Radicamento e pace interiore", "circleEnergy": "ENERGIA DEL CERCHIO", "highCoherence": "alta coerenza", "joined": "Sei entrato nel cerchio ✓", "join": "Unisciti al cerchio"},
        "tarot": {"card": "La Stella", "theme": "Speranza e rinnovamento", "energyLabel": "Energia", "comment": "Questa carta mi ha ricordato che dopo ogni oscurità, la luce ritorna.", "interpretations": "interpretazioni", "addYours": "Aggiungi la tua"},
        "rituals": {"startFirst": "Inizia il primo rituale"},
        "ritual": {"unnamed": "Rituale della Comunità", "hostedBy": "Condotto da:", "host": "Maestro della Comunità"},
        "match": {"discover": "Scopri anime in risonanza con la tua energia", "sub": "Basato sul tuo segno zodiacale e archetipo", "btn": "Trova le tue anime risonanti"},
        "dreams": {"mostCommon": "Simboli più comuni stanotte", "addSymbol": "Aggiungi un simbolo dal tuo sogno"},
        "affirmation": {"text": "Sono pronto a ricevere l'amore che ho cercato dentro di me per così tanto tempo.", "confirmed": "della comunità ha confermato", "confirmedState": "Confermato", "confirm": "Conferma"},
        "intentions": {"yours": "LA TUA INTENZIONE", "placeholder": "Scrivi l'intenzione che vuoi inviare al mondo...", "send": "Invia intenzione", "sent": "Intenzione inviata — la comunità è testimone ✓", "witnesses": "testimoni"},
        "feed": {"placeholder": "Condividi la tua riflessione con la comunità...", "publish": "Pubblica", "empty": "Sii il primo a condividere", "emptySub": "Condividi una riflessione con tutta la comunità", "anonSoul": "Anima Anonima", "reply": "Rispondi"},
        "mentors": {"discover": "Scopri i Mentori dell'Anima", "discoverSub": "Sessioni private con guide spirituali", "mentor": "Mentore", "sessions": "sessioni", "book": "Prenota sessione"},
        "chronicle": {"empty": "Scrivi la prima cronaca", "emptySub": "Condividi la tua conoscenza ed esperienza", "by": "di"},
        "more": "altro", "moreBtn": "Altro", "participants": "partecipanti", "days": "giorni", "daysUpper": "GIORNI", "voteCount": "voti",
        "challenges": {"completed": "completato"}
    },
    "pt": {
        "stat": {"votes": "votos", "participants": "participantes", "chronicles": "Ensaios · Reflexões", "onlineNow": "almas online agora"},
        "hero": {"eyebrow": "✦ COMUNIDADE CÓSMICA", "title": "Você está conectado", "online": "almas ativas agora", "live": "AO VIVO"},
        "hub": {"title": "PORTAIS DA COMUNIDADE", "count": "17 espaços"},
        "section": {
            "energyCircleTitle": "Círculo de Energia", "energyCircleSub": "Meditação grupal sincronizada",
            "tarotTitle": "Tarot da Comunidade", "tarotSub": "A carta do dia da comunidade",
            "liveRitualsTitle": "Rituais ao Vivo", "liveRitualsSub": "Cerimônias conduzidas por mestres",
            "matchingTitle": "Correspondência Cósmica", "matchingSub": "Ressonância e energias da alma",
            "dreamsTitle": "Simbolário de Sonhos", "dreamsSub": "Tendências de sonhos · anônimo",
            "affirmationTitle": "Afirmação da Comunidade", "affirmationSub": "Votação a cada 24h",
            "challengesTitle": "Desafios da Alma", "challengesSub": "Caminhos coletivos de transformação",
            "intentionsTitle": "Câmara de Intenções", "intentionsSub": "Quadro de manifestação compartilhado",
            "feedTitle": "Campo de Consciência", "feedSub": "Reflexões e avanços da comunidade",
            "mentorsTitle": "Mentores da Alma", "mentorsSub": "Sessões com guias espirituais",
            "portalsTitle": "Portais Cósmicos", "portalsSub": "Celebrações de energia compartilhadas",
            "chronicleTitle": "Crônica da Comunidade", "chronicleSub": "Ensaios e arquivo de sabedoria espiritual"
        },
        "energy": {"nextSession": "próxima sessão", "ready": "prontos", "in": "em", "topic": "Aterramento e paz interior", "circleEnergy": "ENERGIA DO CÍRCULO", "highCoherence": "alta coerência", "joined": "Você entrou no círculo ✓", "join": "Entrar no círculo"},
        "tarot": {"card": "A Estrela", "theme": "Esperança e renovação", "energyLabel": "Energia", "comment": "Este cartão me lembrou que após cada escuridão, a luz retorna.", "interpretations": "interpretações", "addYours": "Adicione a sua"},
        "rituals": {"startFirst": "Iniciar o primeiro ritual"},
        "ritual": {"unnamed": "Ritual da Comunidade", "hostedBy": "Conduzido por:", "host": "Mestre da Comunidade"},
        "match": {"discover": "Descubra almas que ressoam com sua energia", "sub": "Baseado no seu signo zodiacal e arquétipo", "btn": "Encontre suas almas ressonantes"},
        "dreams": {"mostCommon": "Símbolos mais comuns esta noite", "addSymbol": "Adicionar um símbolo do seu sonho"},
        "affirmation": {"text": "Estou pronto para receber o amor que tenho procurado dentro de mim por tanto tempo.", "confirmed": "da comunidade confirmou", "confirmedState": "Confirmado", "confirm": "Confirmar"},
        "intentions": {"yours": "SUA INTENÇÃO", "placeholder": "Escreva a intenção que quer enviar para o mundo...", "send": "Enviar intenção", "sent": "Intenção enviada — a comunidade é testemunha ✓", "witnesses": "testemunhas"},
        "feed": {"placeholder": "Compartilhe sua reflexão com a comunidade...", "publish": "Publicar", "empty": "Seja o primeiro a compartilhar", "emptySub": "Compartilhe uma reflexão com toda a comunidade", "anonSoul": "Alma Anônima", "reply": "Responder"},
        "mentors": {"discover": "Descobrir Mentores da Alma", "discoverSub": "Sessões privadas com guias espirituais", "mentor": "Mentor", "sessions": "sessões", "book": "Reservar sessão"},
        "chronicle": {"empty": "Escrever a primeira crônica", "emptySub": "Compartilhe seu conhecimento e experiência", "by": "por"},
        "more": "mais", "moreBtn": "Mais", "participants": "participantes", "days": "dias", "daysUpper": "DIAS", "voteCount": "votos",
        "challenges": {"completed": "concluído"}
    },
    "ru": {
        "stat": {"votes": "голосов", "participants": "участников", "chronicles": "Эссе · Размышления", "onlineNow": "душ онлайн сейчас"},
        "hero": {"eyebrow": "✦ КОСМИЧЕСКОЕ СООБЩЕСТВО", "title": "Вы связаны", "online": "активных душ сейчас", "live": "ПРЯМОЙ ЭФИР"},
        "hub": {"title": "ПОРТАЛЫ СООБЩЕСТВА", "count": "17 пространств"},
        "section": {
            "energyCircleTitle": "Энергетический Круг", "energyCircleSub": "Синхронная групповая медитация",
            "tarotTitle": "Таро Сообщества", "tarotSub": "Карта дня всего сообщества",
            "liveRitualsTitle": "Живые Ритуалы", "liveRitualsSub": "Церемонии, проводимые мастерами",
            "matchingTitle": "Космическое Соответствие", "matchingSub": "Резонанс и энергии душ",
            "dreamsTitle": "Символарий Снов", "dreamsSub": "Тренды снов сообщества · анонимно",
            "affirmationTitle": "Аффирмация Сообщества", "affirmationSub": "Голосование каждые 24ч",
            "challengesTitle": "Вызовы Души", "challengesSub": "Коллективные пути трансформации",
            "intentionsTitle": "Камера Намерений", "intentionsSub": "Общая доска манифестации",
            "feedTitle": "Поле Сознания", "feedSub": "Размышления и прорывы сообщества",
            "mentorsTitle": "Наставники Души", "mentorsSub": "Сессии с духовными наставниками",
            "portalsTitle": "Космические Порталы", "portalsSub": "Совместные празднования энергии",
            "chronicleTitle": "Хроника Сообщества", "chronicleSub": "Эссе и архив духовной мудрости"
        },
        "energy": {"nextSession": "следующая сессия", "ready": "готовы", "in": "через", "topic": "Заземление и внутренний покой", "circleEnergy": "ЭНЕРГИЯ КРУГА", "highCoherence": "высокая когерентность", "joined": "Вы присоединились к кругу ✓", "join": "Присоединиться к кругу"},
        "tarot": {"card": "Звезда", "theme": "Надежда и обновление", "energyLabel": "Энергия", "comment": "Эта карта напомнила мне, что после каждой тьмы свет возвращается.", "interpretations": "интерпретаций", "addYours": "Добавить свою"},
        "rituals": {"startFirst": "Начать первый ритуал"},
        "ritual": {"unnamed": "Ритуал Сообщества", "hostedBy": "Ведёт:", "host": "Мастер Сообщества"},
        "match": {"discover": "Откройте души, резонирующие с вашей энергией", "sub": "На основе вашего знака зодиака и архетипа", "btn": "Найдите ваши резонирующие души"},
        "dreams": {"mostCommon": "Самые распространённые символы этой ночи", "addSymbol": "Добавить символ из своего сна"},
        "affirmation": {"text": "Я готов принять любовь, которую так долго искал внутри себя.", "confirmed": "сообщества подтвердило", "confirmedState": "Подтверждено", "confirm": "Подтвердить"},
        "intentions": {"yours": "ВАШЕ НАМЕРЕНИЕ", "placeholder": "Напишите намерение, которое хотите отправить миру...", "send": "Отправить намерение", "sent": "Намерение отправлено — сообщество является свидетелем ✓", "witnesses": "свидетелей"},
        "feed": {"placeholder": "Поделитесь своим размышлением с сообществом...", "publish": "Опубликовать", "empty": "Будьте первым, кто поделится", "emptySub": "Поделитесь размышлением со всем сообществом", "anonSoul": "Анонимная Душа", "reply": "Ответить"},
        "mentors": {"discover": "Открыть Наставников Души", "discoverSub": "Частные сессии с духовными наставниками", "mentor": "Наставник", "sessions": "сессий", "book": "Забронировать сессию"},
        "chronicle": {"empty": "Написать первую хронику", "emptySub": "Поделитесь знаниями и опытом", "by": "автор"},
        "more": "ещё", "moreBtn": "Ещё", "participants": "участников", "days": "дн", "daysUpper": "ДНЕЙ", "voteCount": "голосов",
        "challenges": {"completed": "завершено"}
    },
    "ar": {
        "stat": {"votes": "أصوات", "participants": "مشاركين", "chronicles": "مقالات · تأملات", "onlineNow": "روح متصلة الآن"},
        "hero": {"eyebrow": "✦ مجتمع كوني", "title": "أنت متصل", "online": "روح نشطة الآن", "live": "مباشر"},
        "hub": {"title": "بوابات المجتمع", "count": "17 فضاء"},
        "section": {
            "energyCircleTitle": "دائرة الطاقة", "energyCircleSub": "تأمل جماعي متزامن",
            "tarotTitle": "تاروت المجتمع", "tarotSub": "بطاقة اليوم للمجتمع",
            "liveRitualsTitle": "طقوس مباشرة", "liveRitualsSub": "احتفالات يقودها أساتذة",
            "matchingTitle": "التوافق الكوني", "matchingSub": "رنين وطاقات الروح",
            "dreamsTitle": "رمزية الأحلام", "dreamsSub": "اتجاهات أحلام المجتمع · مجهول",
            "affirmationTitle": "تأكيد المجتمع", "affirmationSub": "تصويت كل 24 ساعة",
            "challengesTitle": "تحديات الروح", "challengesSub": "مسارات تحول جماعية",
            "intentionsTitle": "غرفة النوايا", "intentionsSub": "لوحة مشاركة للتجلي",
            "feedTitle": "مجال الوعي", "feedSub": "تأملات وإنجازات المجتمع",
            "mentorsTitle": "موجهو الروح", "mentorsSub": "جلسات مع مرشدين روحيين",
            "portalsTitle": "بوابات كونية", "portalsSub": "احتفالات طاقة مشتركة",
            "chronicleTitle": "سجل المجتمع", "chronicleSub": "مقالات وأرشيف الحكمة الروحية"
        },
        "energy": {"nextSession": "الجلسة القادمة", "ready": "مستعد", "in": "خلال", "topic": "التأريض والسلام الداخلي", "circleEnergy": "طاقة الدائرة", "highCoherence": "تماسك عالٍ", "joined": "انضممت إلى الدائرة ✓", "join": "انضم إلى الدائرة"},
        "tarot": {"card": "النجم", "theme": "الأمل والتجديد", "energyLabel": "طاقة", "comment": "ذكرتني هذه البطاقة بأن بعد كل ظلام يعود النور.", "interpretations": "تفسيرات", "addYours": "أضف تفسيرك"},
        "rituals": {"startFirst": "ابدأ أول طقس"},
        "ritual": {"unnamed": "طقس المجتمع", "hostedBy": "بقيادة:", "host": "سيد المجتمع"},
        "match": {"discover": "اكتشف الأرواح التي ترن مع طاقتك", "sub": "بناءً على برجك الفلكي ونمطك الأصلي", "btn": "ابحث عن أرواحك المتناغمة"},
        "dreams": {"mostCommon": "أكثر الرموز شيوعاً الليلة", "addSymbol": "أضف رمزاً من حلمك"},
        "affirmation": {"text": "أنا مستعد لتلقي الحب الذي كنت أبحث عنه بداخلي لفترة طويلة.", "confirmed": "من المجتمع أكد", "confirmedState": "مؤكد", "confirm": "تأكيد"},
        "intentions": {"yours": "نيتك", "placeholder": "اكتب النية التي تريد إرسالها إلى العالم...", "send": "إرسال النية", "sent": "تم إرسال النية — المجتمع يشهد ✓", "witnesses": "شاهد"},
        "feed": {"placeholder": "شارك تأملك مع المجتمع...", "publish": "نشر", "empty": "كن أول من يشارك", "emptySub": "شارك تأملاً مع المجتمع بأكمله", "anonSoul": "روح مجهولة", "reply": "رد"},
        "mentors": {"discover": "اكتشف موجهي الروح", "discoverSub": "جلسات خاصة مع مرشدين روحيين", "mentor": "موجه", "sessions": "جلسات", "book": "احجز جلسة"},
        "chronicle": {"empty": "اكتب أول سجل", "emptySub": "شارك معرفتك وتجربتك", "by": "بقلم"},
        "more": "المزيد", "moreBtn": "المزيد", "participants": "مشاركين", "days": "أيام", "daysUpper": "أيام", "voteCount": "أصوات",
        "challenges": {"completed": "مكتمل"}
    },
    "ja": {
        "stat": {"votes": "票", "participants": "参加者", "chronicles": "エッセイ・省察", "onlineNow": "人が今オンライン"},
        "hero": {"eyebrow": "✦ コスミックコミュニティ", "title": "あなたはつながっています", "online": "人が今活動中", "live": "ライブ"},
        "hub": {"title": "コミュニティポータル", "count": "17のスペース"},
        "section": {
            "energyCircleTitle": "エナジーサークル", "energyCircleSub": "同期グループ瞑想",
            "tarotTitle": "コミュニティタロット", "tarotSub": "コミュニティの今日のカード",
            "liveRitualsTitle": "ライブ儀式", "liveRitualsSub": "マスターが行う儀式",
            "matchingTitle": "コスミックマッチ", "matchingSub": "魂の共鳴とエネルギー",
            "dreamsTitle": "夢のシンボル集", "dreamsSub": "コミュニティの夢のトレンド・匿名",
            "affirmationTitle": "コミュニティアファメーション", "affirmationSub": "24時間ごとに投票",
            "challengesTitle": "ソウルチャレンジ", "challengesSub": "集合的変容の道",
            "intentionsTitle": "インテンションチェンバー", "intentionsSub": "共有マニフェストボード",
            "feedTitle": "意識の場", "feedSub": "コミュニティの省察と突破",
            "mentorsTitle": "ソウルメンター", "mentorsSub": "精神的ガイドとのセッション",
            "portalsTitle": "コスミックポータル", "portalsSub": "エネルギーの共同お祝い",
            "chronicleTitle": "コミュニティクロニクル", "chronicleSub": "エッセイと精神的知恵のアーカイブ"
        },
        "energy": {"nextSession": "次のセッション", "ready": "準備完了", "in": "まで", "topic": "グラウンディングと内なる平和", "circleEnergy": "サークルエネルギー", "highCoherence": "高コヒーレンス", "joined": "サークルに参加しました ✓", "join": "サークルに参加する"},
        "tarot": {"card": "星", "theme": "希望と再生", "energyLabel": "エネルギー", "comment": "このカードは、すべての闇の後に光が戻ってくることを思い出させてくれました。", "interpretations": "解釈", "addYours": "あなたの解釈を追加"},
        "rituals": {"startFirst": "最初の儀式を始める"},
        "ritual": {"unnamed": "コミュニティ儀式", "hostedBy": "主催者:", "host": "コミュニティマスター"},
        "match": {"discover": "あなたのエネルギーと共鳴する魂を発見する", "sub": "あなたの星座とアーキタイプに基づく", "btn": "共鳴する魂を見つける"},
        "dreams": {"mostCommon": "今夜最も一般的なシンボル", "addSymbol": "夢のシンボルを追加"},
        "affirmation": {"text": "私は長い間自分の中で求めていた愛を受け取る準備ができています。", "confirmed": "のコミュニティが確認しました", "confirmedState": "確認済み", "confirm": "確認する"},
        "intentions": {"yours": "あなたの意図", "placeholder": "世界に送りたい意図を書いてください...", "send": "意図を送る", "sent": "意図が送られました — コミュニティが証人です ✓", "witnesses": "証人"},
        "feed": {"placeholder": "コミュニティと省察を共有する...", "publish": "公開する", "empty": "最初に共有する人になりましょう", "emptySub": "コミュニティ全体と省察を共有する", "anonSoul": "匿名の魂", "reply": "返信する"},
        "mentors": {"discover": "ソウルメンターを発見する", "discoverSub": "精神的ガイドとのプライベートセッション", "mentor": "メンター", "sessions": "セッション", "book": "セッションを予約"},
        "chronicle": {"empty": "最初のクロニクルを書く", "emptySub": "知識と経験を共有する", "by": "著者"},
        "more": "もっと見る", "moreBtn": "もっと見る", "participants": "参加者", "days": "日", "daysUpper": "日", "voteCount": "票",
        "challenges": {"completed": "完了"}
    },
    "zh": {
        "stat": {"votes": "票", "participants": "参与者", "chronicles": "文章·反思", "onlineNow": "灵魂现在在线"},
        "hero": {"eyebrow": "✦ 宇宙社区", "title": "你已连接", "online": "活跃灵魂现在", "live": "直播"},
        "hub": {"title": "社区门户", "count": "17个空间"},
        "section": {
            "energyCircleTitle": "能量圈", "energyCircleSub": "同步团体冥想",
            "tarotTitle": "社区塔罗", "tarotSub": "社区今日牌",
            "liveRitualsTitle": "直播仪式", "liveRitualsSub": "由大师主持的仪式",
            "matchingTitle": "宇宙匹配", "matchingSub": "灵魂共鸣与能量",
            "dreamsTitle": "梦境符号集", "dreamsSub": "社区梦境趋势·匿名",
            "affirmationTitle": "社区肯定语", "affirmationSub": "每24小时投票",
            "challengesTitle": "灵魂挑战", "challengesSub": "集体转化之路",
            "intentionsTitle": "意图室", "intentionsSub": "共享显化板",
            "feedTitle": "意识场", "feedSub": "社区的反思与突破",
            "mentorsTitle": "灵魂导师", "mentorsSub": "与精神向导的会话",
            "portalsTitle": "宇宙门户", "portalsSub": "共同的能量庆典",
            "chronicleTitle": "社区编年史", "chronicleSub": "文章与精神智慧档案"
        },
        "energy": {"nextSession": "下一次课程", "ready": "准备好了", "in": "在", "topic": "接地与内心平静", "circleEnergy": "圆圈能量", "highCoherence": "高相干性", "joined": "您已加入圆圈 ✓", "join": "加入圆圈"},
        "tarot": {"card": "星星", "theme": "希望与更新", "energyLabel": "能量", "comment": "这张牌提醒我，每一片黑暗之后，光明都会回来。", "interpretations": "解释", "addYours": "添加你的解释"},
        "rituals": {"startFirst": "开始第一个仪式"},
        "ritual": {"unnamed": "社区仪式", "hostedBy": "主持人:", "host": "社区导师"},
        "match": {"discover": "发现与你能量共鸣的灵魂", "sub": "基于你的星座和原型", "btn": "找到你的共鸣灵魂"},
        "dreams": {"mostCommon": "今晚最常见的符号", "addSymbol": "添加来自你梦境的符号"},
        "affirmation": {"text": "我准备好接受我在自己内心寻找了这么久的爱了。", "confirmed": "的社区确认了", "confirmedState": "已确认", "confirm": "确认"},
        "intentions": {"yours": "你的意图", "placeholder": "写下你想送给世界的意图...", "send": "发送意图", "sent": "意图已发送 — 社区是见证者 ✓", "witnesses": "见证者"},
        "feed": {"placeholder": "与社区分享你的反思...", "publish": "发布", "empty": "成为第一个分享的人", "emptySub": "与整个社区分享一个反思", "anonSoul": "匿名灵魂", "reply": "回复"},
        "mentors": {"discover": "发现灵魂导师", "discoverSub": "与精神向导的私人会话", "mentor": "导师", "sessions": "会话", "book": "预约会话"},
        "chronicle": {"empty": "写第一篇编年史", "emptySub": "分享你的知识和经验", "by": "作者"},
        "more": "更多", "moreBtn": "更多", "participants": "参与者", "days": "天", "daysUpper": "天", "voteCount": "票",
        "challenges": {"completed": "已完成"}
    }
}

LANG_FILES = {
    "en": "en.json", "pl": "pl.json", "de": "de.json", "es": "es.json",
    "fr": "fr.json", "it": "it.json", "pt": "pt.json", "ru": "ru.json",
    "ar": "ar.json", "ja": "ja.json", "zh": "zh.json",
}

for lang, filename in LANG_FILES.items():
    path = os.path.join(BASE, filename)
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    tr = SOCIAL.get(lang, SOCIAL["en"])

    if "social" not in data:
        data["social"] = tr
        print(f"  [{lang}] Added social section")
    else:
        added = []
        for k, v in tr.items():
            if k not in data["social"]:
                data["social"][k] = v
                added.append(k)
        if added:
            print(f"  [{lang}] Added social keys: {', '.join(added)}")
        else:
            print(f"  [{lang}] social already complete")

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("\nDone.")
