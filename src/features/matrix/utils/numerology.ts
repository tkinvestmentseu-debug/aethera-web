// src/features/matrix/utils/numerology.ts
import i18n from '../../../core/i18n';

export const reduceTo22 = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 1;
  if (num <= 22) return num;
  const sum = String(Math.round(Math.abs(num))).split('').reduce((acc, digit) => acc + parseInt(digit, 10), 0);
  return reduceTo22(sum);
};

export const calculateMatrix = (birthDate: string) => {
  const date = new Date(birthDate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // 1. Lewo (Osobowość) - Dzień urodzenia
  const left = reduceTo22(day);

  // 2. Góra (Duchowość) - Miesiąc urodzenia
  const top = reduceTo22(month);

  // 3. Prawo (Finanse i Relacje) - Rok urodzenia
  const yearSum = String(year).split('').reduce((acc, d) => acc + parseInt(d), 0);
  const right = reduceTo22(yearSum);

  // 4. Dół (Karma) - Suma Lewo + Góra + Prawo
  const bottom = reduceTo22(left + top + right);

  // 5. Centrum (Komfort duszy) - Suma Lewo + Góra + Prawo + Dół
  const center = reduceTo22(left + top + right + bottom);

  // 6. Linia Relacji i Pieniędzy (Połączenie punktu Bottom i Right)
  const relationship = reduceTo22(bottom + right);
  const money = reduceTo22(relationship + right);

  // Liczba Drogi Życia (Suma wszystkich cyfr daty)
  const fullSum = String(day) + String(month) + String(year);
  const lifePath = String(fullSum).split('').reduce((acc, d) => acc + parseInt(d), 0);

  return { left, top, right, bottom, center, relationship, money, lifePath: reduceTo22(lifePath) };
};

export const calculateCompatibility = (userDate: string, partnerDate: string) => {
  const m1 = calculateMatrix(userDate);
  const m2 = calculateMatrix(partnerDate);

  // Wspólna matryca to suma energii obu osób zredukowana do 22
  return {
    top: reduceTo22(m1.top + m2.top),
    bottom: reduceTo22(m1.bottom + m2.bottom),
    left: reduceTo22(m1.left + m2.left),
    right: reduceTo22(m1.right + m2.right),
    center: reduceTo22(m1.center + m2.center),
  };
};

export const getEnergyMeaning = (energy: number) => {
  return i18n.t(`matrix:energyMeanings.${energy}`, {
    defaultValue: i18n.t('matrix:energyMeanings.fallback'),
  });
};
