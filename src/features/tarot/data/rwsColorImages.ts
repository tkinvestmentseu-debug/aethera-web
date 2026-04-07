// Rider-Waite-Smith — Edycja Cyfrowa Kolor CC0
// Source: yunruse/tarot (github.com/yunruse/tarot) — CC0 Public Domain
// 300×527px PNG images, digital color processing
// Keys match app internal card IDs exactly.

const BASE = 'https://media.githubusercontent.com/media/yunruse/tarot/gh-pages/cards/color/';

const MAJOR = Object.fromEntries(
  Array.from({ length: 22 }, (_, i) => [`${i}`, `${BASE}${i}.jpg`])
);
const CUPS    = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`c${i + 1}`, `${BASE}c${i + 1}.jpg`]));
const WANDS   = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`w${i + 1}`, `${BASE}w${i + 1}.jpg`]));
const SWORDS  = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`s${i + 1}`, `${BASE}s${i + 1}.jpg`]));
const PENTS   = Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`p${i + 1}`, `${BASE}p${i + 1}.jpg`]));

export const RWS_COLOR_IMAGE_MAP: Record<string, string> = {
  ...MAJOR, ...CUPS, ...WANDS, ...SWORDS, ...PENTS,
};
