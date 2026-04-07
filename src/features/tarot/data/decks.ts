import { TarotDeck } from '../types';
import { RIDER_WAITE_IMAGE_MAP } from './riderWaiteImages';
import { RWS_COLOR_IMAGE_MAP } from './rwsColorImages';
import { RWS_BW_IMAGE_MAP } from './rwsBwImages';
import { RWS_1910_IMAGE_MAP } from './rws1910Images';
import { SOLA_BUSCA_IMAGE_MAP } from './solaBuscaImages';

export const TAROT_DECKS: TarotDeck[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. RIDER-WAITE-SMITH (1909) — oryginalny, lokalne assety
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rider_waite',
    name: 'Rider-Waite-Smith (1909)',
    author: 'Pamela Colman Smith, 1909',
    description: 'Kultowa talia z 1909 roku — punkt odniesienia dla wszystkich talii tarota na świecie. Ciepłe, ilustrowane karty pełne symboliki i życia.',
    mood: 'Klasyczna, symboliczna i ponadczasowa.',
    available: true,
    accent: ['#8B4513', '#C19A6B'],
    surface: ['#FBF5E6', '#F0E6D0'],
    faceGradient: ['#FBF7EE', '#F5EDD8', '#FBF7EE'],
    backGradient: ['#1A0C08', '#2E1408', '#1A0C08'],
    border: 'rgba(139,69,19,0.40)',
    textOnCard: '#2C1810',
    cardBackLabel: 'Rider-Waite · 1909',
    motif: 'classic',
    frameStyle: 'heritage',
    patternStyle: 'compass',
    textureLabel: 'Ilustrowana · Oryginalna',
    imageMap: RIDER_WAITE_IMAGE_MAP,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. RIDER-WAITE — EDYCJA CYFROWA KOLOR (yunruse CC0, 300×527)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rws_color',
    name: 'Rider-Waite — Edycja Cyfrowa',
    author: 'Pamela Colman Smith / yunruse (CC0)',
    description: 'Cyfrowo przetworzona edycja RWS w żywych, czystych kolorach. Idealna do uważnych odczytów — czytelna i świeża.',
    mood: 'Czysta, klarowna i nowoczesna.',
    available: true,
    isPremium: true,
    accent: ['#7B5EA7', '#A98BD4'],
    surface: ['#F3EEF8', '#E0D4F0'],
    faceGradient: ['#F5F0FA', '#E8DDF5', '#F5F0FA'],
    backGradient: ['#0D0818', '#1A0D35', '#0D0818'],
    border: 'rgba(123,94,167,0.40)',
    textOnCard: '#1A0D35',
    cardBackLabel: 'RWS · Kolor CC0',
    motif: 'classic',
    frameStyle: 'sanctuary',
    patternStyle: 'sunburst',
    textureLabel: 'Cyfrowa · CC0',
    imageMap: RWS_COLOR_IMAGE_MAP,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. RIDER-WAITE — EDYCJA CZARNO-BIAŁA (yunruse CC0, ~800×1400)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rws_bw',
    name: 'Rider-Waite — Czarno-Biały',
    author: 'Pamela Colman Smith / yunruse (CC0)',
    description: 'Dramatyczna edycja czarno-biała w wysokim kontraście. Odkrywa surową symbolikę ukrytą za kolorem — idealna do głębokiej introspekcji.',
    mood: 'Minimalistyczna, kontrastowa i medytacyjna.',
    available: true,
    isPremium: true,
    accent: ['#E8E0D5', '#A09080'],
    surface: ['#1A1612', '#0D0B09'],
    faceGradient: ['#2A2520', '#1A1410', '#2A2520'],
    backGradient: ['#000000', '#0D0D0D', '#000000'],
    border: 'rgba(232,224,213,0.30)',
    textOnCard: '#F0EBE0',
    cardBackLabel: 'RWS · Czerń i Biel',
    motif: 'obsidian',
    frameStyle: 'obsidian',
    patternStyle: 'facets',
    textureLabel: 'Czerń i Biel · Artystyczna',
    imageMap: RWS_BW_IMAGE_MAP,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. RIDER-WAITE 1910 — EDYCJA PREMIUM HD (yunruse CC0, 1111×1919)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'rws_1910',
    name: 'Rider-Waite 1910 — Premium HD',
    author: 'Pamela Colman Smith / yunruse (CC0)',
    description: 'Najwyższa jakość skanów z 1910 roku — 1111×1919px, nasycone kolory, każdy detal widoczny w pełnej glorii. Edycja dla koneserów.',
    mood: 'Bogata, szczegółowa i ceremonialna.',
    available: true,
    isPremium: true,
    accent: ['#E0BB6D', '#A8742D'],
    surface: ['#FAF4E8', '#F2E1BF'],
    faceGradient: ['#FFF8E1', '#FFE082', '#FFF8E1'],
    backGradient: ['#0A0700', '#2A1A00', '#0A0700'],
    border: 'rgba(224,187,109,0.55)',
    textOnCard: '#241A0F',
    cardBackLabel: 'RWS · 1910 HD',
    motif: 'golden',
    frameStyle: 'sanctuary',
    patternStyle: 'sunburst',
    textureLabel: 'Złota · Najwyższa Jakość',
    imageMap: RWS_1910_IMAGE_MAP,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. SOLA BUSCA (1491) — WIKIMEDIA PUBLIC DOMAIN
  //    Najstarsza kompletna talia 78 kart — wenecki miedzioryt z 1491 r.
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'sola_busca',
    name: 'Sola Busca (1491)',
    author: 'Anonim, Wenecja 1491',
    description: 'Najstarsza kompletna talia 78 kart na świecie. Wenecki miedzioryt z 1491 r. — postacie z mitologii greckiej i historii starożytnej. Zupełnie inny, archaiczny język symboli.',
    mood: 'Archaiczna, tajemnicza i historyczna.',
    available: true,
    isPremium: true,
    accent: ['#C4962A', '#8B6420'],
    surface: ['#F5EDD5', '#E8D9B0'],
    faceGradient: ['#F8F0DC', '#EDD9A8', '#F8F0DC'],
    backGradient: ['#120E06', '#241A08', '#120E06'],
    border: 'rgba(196,150,42,0.45)',
    textOnCard: '#1C1506',
    cardBackLabel: 'Sola Busca · 1491',
    motif: 'golden',
    frameStyle: 'heritage',
    patternStyle: 'compass',
    textureLabel: 'Miedzioryt · Wenecja 1491',
    imageMap: SOLA_BUSCA_IMAGE_MAP,
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. RIDER-WAITE — WIKIMEDIA HD (oryginalne skany Wikimedia Commons)
  //    Dla talii bez imageMap — SVG art jako artystyczna talia domyślna
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'aethera_sacred',
    name: 'Aethera — Święta Geometria',
    author: 'Pracownia Aethery',
    description: 'Autorska talia Aethery tworzona dynamicznie — unikalne grafiki SVG generowane per karta, z elementami świętej geometrii, symboli i astrologicznych archetypów.',
    mood: 'Geometryczna, precyzyjna i kontemplacyjna.',
    available: true,
    accent: ['#D3B476', '#80715E'],
    surface: ['#F4EEE2', '#DDD1BC'],
    faceGradient: ['#F8F0E8', '#F0DFC8', '#F8F0E8'],
    backGradient: ['#0C0508', '#200A14', '#0C0508'],
    border: 'rgba(211,180,118,0.50)',
    textOnCard: '#211B14',
    cardBackLabel: 'Aethera · Święta Geometria',
    motif: 'geometry',
    frameStyle: 'geometry',
    patternStyle: 'lattice',
    textureLabel: 'Kosmiczna · SVG Art',
    // Brak imageMap — używa TarotCardArt (SVG generowane dynamicznie)
  },
];

export const getTarotDeckById = (deckId?: string) =>
  TAROT_DECKS.find((deck) => deck.id === deckId) || TAROT_DECKS[0];

export const AVAILABLE_TAROT_DECKS = TAROT_DECKS.filter((deck) => deck.available);
