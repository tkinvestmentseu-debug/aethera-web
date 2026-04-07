// Public domain Rider-Waite-Smith tarot card images — local assets
// Originally illustrated by Pamela Colman Smith (1909), published by Rider Company.
// Public domain in the US and EU (published >70 years ago).
// Source: sacred-texts.com (pkt/img/) — downloaded locally for offline use.
//
// File naming on the server:
//   Major Arcana: ar00–ar21
//   Suit pips 2-10: cu02–cu10, wa02–wa10, sw02–sw10, pe02–pe10
//   Aces:   cuac, waac, swac, peac
//   Pages:  cupa, wapa, swpa, pepa
//   Knights: cukn, wakn, swkn, pekn
//   Queens: cuqu, waqu, swqu, pequ
//   Kings:  cuki, waki, swki, peki

export const RIDER_WAITE_IMAGE_MAP: Record<string, any> = {
  // ── Major Arcana (0–21) ────────────────────────────────────────────────────
  '0':  require('../../../../assets/tarot/ar00.jpg'),
  '1':  require('../../../../assets/tarot/ar01.jpg'),
  '2':  require('../../../../assets/tarot/ar02.jpg'),
  '3':  require('../../../../assets/tarot/ar03.jpg'),
  '4':  require('../../../../assets/tarot/ar04.jpg'),
  '5':  require('../../../../assets/tarot/ar05.jpg'),
  '6':  require('../../../../assets/tarot/ar06.jpg'),
  '7':  require('../../../../assets/tarot/ar07.jpg'),
  '8':  require('../../../../assets/tarot/ar08.jpg'),
  '9':  require('../../../../assets/tarot/ar09.jpg'),
  '10': require('../../../../assets/tarot/ar10.jpg'),
  '11': require('../../../../assets/tarot/ar11.jpg'),
  '12': require('../../../../assets/tarot/ar12.jpg'),
  '13': require('../../../../assets/tarot/ar13.jpg'),
  '14': require('../../../../assets/tarot/ar14.jpg'),
  '15': require('../../../../assets/tarot/ar15.jpg'),
  '16': require('../../../../assets/tarot/ar16.jpg'),
  '17': require('../../../../assets/tarot/ar17.jpg'),
  '18': require('../../../../assets/tarot/ar18.jpg'),
  '19': require('../../../../assets/tarot/ar19.jpg'),
  '20': require('../../../../assets/tarot/ar20.jpg'),
  '21': require('../../../../assets/tarot/ar21.jpg'),

  // ── Cups (c1–c14) ─────────────────────────────────────────────────────────
  'c1':  require('../../../../assets/tarot/cuac.jpg'), // Ace
  'c2':  require('../../../../assets/tarot/cu02.jpg'),
  'c3':  require('../../../../assets/tarot/cu03.jpg'),
  'c4':  require('../../../../assets/tarot/cu04.jpg'),
  'c5':  require('../../../../assets/tarot/cu05.jpg'),
  'c6':  require('../../../../assets/tarot/cu06.jpg'),
  'c7':  require('../../../../assets/tarot/cu07.jpg'),
  'c8':  require('../../../../assets/tarot/cu08.jpg'),
  'c9':  require('../../../../assets/tarot/cu09.jpg'),
  'c10': require('../../../../assets/tarot/cu10.jpg'),
  'c11': require('../../../../assets/tarot/cupa.jpg'), // Page
  'c12': require('../../../../assets/tarot/cukn.jpg'), // Knight
  'c13': require('../../../../assets/tarot/cuqu.jpg'), // Queen
  'c14': require('../../../../assets/tarot/cuki.jpg'), // King

  // ── Wands (w1–w14) ────────────────────────────────────────────────────────
  'w1':  require('../../../../assets/tarot/waac.jpg'), // Ace
  'w2':  require('../../../../assets/tarot/wa02.jpg'),
  'w3':  require('../../../../assets/tarot/wa03.jpg'),
  'w4':  require('../../../../assets/tarot/wa04.jpg'),
  'w5':  require('../../../../assets/tarot/wa05.jpg'),
  'w6':  require('../../../../assets/tarot/wa06.jpg'),
  'w7':  require('../../../../assets/tarot/wa07.jpg'),
  'w8':  require('../../../../assets/tarot/wa08.jpg'),
  'w9':  require('../../../../assets/tarot/wa09.jpg'),
  'w10': require('../../../../assets/tarot/wa10.jpg'),
  'w11': require('../../../../assets/tarot/wapa.jpg'), // Page
  'w12': require('../../../../assets/tarot/wakn.jpg'), // Knight
  'w13': require('../../../../assets/tarot/waqu.jpg'), // Queen
  'w14': require('../../../../assets/tarot/waki.jpg'), // King

  // ── Swords (s1–s14) ───────────────────────────────────────────────────────
  's1':  require('../../../../assets/tarot/swac.jpg'), // Ace
  's2':  require('../../../../assets/tarot/sw02.jpg'),
  's3':  require('../../../../assets/tarot/sw03.jpg'),
  's4':  require('../../../../assets/tarot/sw04.jpg'),
  's5':  require('../../../../assets/tarot/sw05.jpg'),
  's6':  require('../../../../assets/tarot/sw06.jpg'),
  's7':  require('../../../../assets/tarot/sw07.jpg'),
  's8':  require('../../../../assets/tarot/sw08.jpg'),
  's9':  require('../../../../assets/tarot/sw09.jpg'),
  's10': require('../../../../assets/tarot/sw10.jpg'),
  's11': require('../../../../assets/tarot/swpa.jpg'), // Page
  's12': require('../../../../assets/tarot/swkn.jpg'), // Knight
  's13': require('../../../../assets/tarot/swqu.jpg'), // Queen
  's14': require('../../../../assets/tarot/swki.jpg'), // King

  // ── Pentacles (p1–p14) ────────────────────────────────────────────────────
  'p1':  require('../../../../assets/tarot/peac.jpg'), // Ace
  'p2':  require('../../../../assets/tarot/pe02.jpg'),
  'p3':  require('../../../../assets/tarot/pe03.jpg'),
  'p4':  require('../../../../assets/tarot/pe04.jpg'),
  'p5':  require('../../../../assets/tarot/pe05.jpg'),
  'p6':  require('../../../../assets/tarot/pe06.jpg'),
  'p7':  require('../../../../assets/tarot/pe07.jpg'),
  'p8':  require('../../../../assets/tarot/pe08.jpg'),
  'p9':  require('../../../../assets/tarot/pe09.jpg'),
  'p10': require('../../../../assets/tarot/pe10.jpg'),
  'p11': require('../../../../assets/tarot/pepa.jpg'), // Page
  'p12': require('../../../../assets/tarot/pekn.jpg'), // Knight
  'p13': require('../../../../assets/tarot/pequ.jpg'), // Queen
  'p14': require('../../../../assets/tarot/peki.jpg'), // King
};
