// src/features/tarot/types.ts
export type TarotSuit = 'major' | 'cups' | 'pentacles' | 'swords' | 'wands';

export interface TarotCardData {
  id: string;
  name: string;
  suit: TarotSuit;
  arcana?: 'major' | 'minor';
  value: number;
  meaningUpright: string;
  meaningReversed: string;
  description: string;
  advice: string;
}

export interface TarotDeck {
  id: string;
  name: string;
  author: string;
  description: string;
  mood: string;
  available: boolean;
  accent: [string, string];
  surface: [string, string];
  faceGradient: [string, string, string];
  backGradient: [string, string, string];
  border: string;
  textOnCard: string;
  cardBackLabel: string;
  motif: 'classic' | 'golden' | 'moon' | 'obsidian' | 'geometry';
  frameStyle: 'heritage' | 'sanctuary' | 'veil' | 'obsidian' | 'geometry';
  patternStyle: 'compass' | 'sunburst' | 'phases' | 'facets' | 'lattice';
  textureLabel: string;
  isPremium?: boolean;
  imageMap?: Record<string, string | number | any>; // cardId → URI string (remote) OR require() result (local)
}

export interface TarotSpread {
  id: string;
  name: string;
  description: string;
  slots: {
    label: string;
    description: string;
  }[];
}
