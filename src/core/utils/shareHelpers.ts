// src/core/utils/shareHelpers.ts
// Gotowe funkcje share dla ekranów: ReadingDetail, Numerology, Matrix, Horoscope

import { Share } from 'react-native';

const APP_TAG = '\n\n✦ Aethera App';

export async function shareReading(params: {
  cardName: string;
  position?: string;
  interpretation: string;
}): Promise<void> {
  await Share.share({
    message:
      `✦ Mój odczyt tarota\n` +
      (params.position ? `Pozycja: ${params.position}\n` : '') +
      `Karta: ${params.cardName}\n\n` +
      `${params.interpretation.slice(0, 300)}...` +
      APP_TAG,
  });
}

export async function shareNumerology(params: {
  lifePath: number;
  destiny?: number;
  soul?: number;
  description?: string;
}): Promise<void> {
  const lines = [
    `✦ Moje Liczby Życia`,
    `Liczba Drogi Życia: ${params.lifePath}`,
  ];
  if (params.destiny) lines.push(`Liczba Przeznaczenia: ${params.destiny}`);
  if (params.soul)    lines.push(`Liczba Duszy: ${params.soul}`);
  if (params.description) lines.push(`\n${params.description.slice(0, 200)}...`);
  lines.push(APP_TAG);
  await Share.share({ message: lines.join('\n') });
}

export async function shareMatrix(params: {
  name: string;
  date: string;
  coreNumbers: Record<string, number>;
  summary?: string;
}): Promise<void> {
  const nums = Object.entries(params.coreNumbers)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
  await Share.share({
    message:
      `✦ Moja Matryca Przeznaczenia\n` +
      `${params.name} · ${params.date}\n\n` +
      `${nums}\n` +
      (params.summary ? `\n${params.summary.slice(0, 200)}...` : '') +
      APP_TAG,
  });
}

export async function shareHoroscope(params: {
  sign: string;
  date: string;
  prediction: string;
}): Promise<void> {
  await Share.share({
    message:
      `✦ Mój Horoskop — ${params.sign}\n` +
      `${params.date}\n\n` +
      `${params.prediction.slice(0, 400)}...` +
      APP_TAG,
  });
}

// -------------------------------------------------------
// UŻYCIE w ekranach — przykłady:
//
// ReadingDetailScreen:
//   import { shareReading } from '../core/utils/shareHelpers';
//   <Pressable onPress={() => shareReading({ cardName, position, interpretation })}>
//     <Share2 ... />
//   </Pressable>
//
// NumerologyScreen:
//   import { shareNumerology } from '../core/utils/shareHelpers';
//   <Pressable onPress={() => shareNumerology({ lifePath, destiny, soul })}>
//
// MatrixScreen:
//   import { shareMatrix } from '../core/utils/shareHelpers';
//
// HoroscopeScreen:
//   import { shareHoroscope } from '../core/utils/shareHelpers';
// -------------------------------------------------------
