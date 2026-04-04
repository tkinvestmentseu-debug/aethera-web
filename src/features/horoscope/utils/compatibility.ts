import { ZodiacSign } from './astrology';

export interface CompatibilityResult {
  score: number;
  love: string;
  friendship: string;
  work: string;
}

export const getPartnerCompatibility = (s1: ZodiacSign, s2: ZodiacSign): CompatibilityResult => {
  // Prosta logika oparta na żywiołach (Ogień, Ziemia, Powietrze, Woda)
  const fire = ['Aries', 'Leo', 'Sagittarius'];
  const earth = ['Taurus', 'Virgo', 'Capricorn'];
  const air = ['Gemini', 'Libra', 'Aquarius'];
  const water = ['Cancer', 'Scorpio', 'Pisces'];

  const getElement = (s: ZodiacSign) => {
    if (fire.includes(s)) return 'fire';
    if (earth.includes(s)) return 'earth';
    if (air.includes(s)) return 'air';
    return 'water';
  };

  const e1 = getElement(s1);
  const e2 = getElement(s2);

  if (e1 === e2) return {
    score: 95,
    love: "compatibility.loveHigh",
    friendship: "compatibility.friendshipHigh",
    work: "compatibility.workHigh"
  };

  // Ogień + Powietrze, Ziemia + Woda (Harmonijne)
  if ((e1 === 'fire' && e2 === 'air') || (e1 === 'air' && e2 === 'fire') || 
      (e1 === 'earth' && e2 === 'water') || (e1 === 'water' && e2 === 'earth')) {
    return {
      score: 85,
      love: "compatibility.loveHarmonious",
      friendship: "compatibility.friendshipHarmonious",
      work: "compatibility.workHarmonious"
    };
  }

  return {
    score: 65,
    love: "compatibility.neutral",
    friendship: "compatibility.friendshipNeutral",
    work: "compatibility.workNeutral"
  };
};
