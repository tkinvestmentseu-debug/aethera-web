export interface ChineseZodiacSign {
  id: string;
  nameKey: string;
  years: number[];
  element: string;
  descriptionKey: string;
  luckyNumbers: number[];
  luckyColors: string[];
}

export const CHINESE_ZODIAC: ChineseZodiacSign[] = [
  { id: 'rat', nameKey: 'chinese.rat', years: [1924, 1936, 1948, 1960, 1972, 1984, 1996, 2008, 2020, 2032], element: 'Water', descriptionKey: 'chinese.ratDesc', luckyNumbers: [2, 3], luckyColors: ['blue', 'gold', 'green'] },
  { id: 'ox', nameKey: 'chinese.ox', years: [1925, 1937, 1949, 1961, 1973, 1985, 1997, 2009, 2021, 2033], element: 'Earth', descriptionKey: 'chinese.oxDesc', luckyNumbers: [1, 4], luckyColors: ['white', 'yellow', 'green'] },
  { id: 'tiger', nameKey: 'chinese.tiger', years: [1926, 1938, 1950, 1962, 1974, 1986, 1998, 2010, 2022, 2034], element: 'Wood', descriptionKey: 'chinese.tigerDesc', luckyNumbers: [1, 3, 4], luckyColors: ['blue', 'gray', 'orange'] },
  { id: 'rabbit', nameKey: 'chinese.rabbit', years: [1927, 1939, 1951, 1963, 1975, 1987, 1999, 2011, 2023, 2035], element: 'Wood', descriptionKey: 'chinese.rabbitDesc', luckyNumbers: [3, 4, 6], luckyColors: ['red', 'pink', 'purple', 'blue'] },
  { id: 'dragon', nameKey: 'chinese.dragon', years: [1928, 1940, 1952, 1964, 1976, 1988, 2000, 2012, 2024, 2036], element: 'Earth', descriptionKey: 'chinese.dragonDesc', luckyNumbers: [1, 6, 7], luckyColors: ['gold', 'silver', 'gray'] },
  { id: 'snake', nameKey: 'chinese.snake', years: [1929, 1941, 1953, 1965, 1977, 1989, 2001, 2013, 2025, 2037], element: 'Fire', descriptionKey: 'chinese.snakeDesc', luckyNumbers: [2, 8, 9], luckyColors: ['black', 'red', 'yellow'] },
  { id: 'horse', nameKey: 'chinese.horse', years: [1930, 1942, 1954, 1966, 1978, 1990, 2002, 2014, 2026, 2038], element: 'Fire', descriptionKey: 'chinese.horseDesc', luckyNumbers: [2, 3, 7], luckyColors: ['yellow', 'green'] },
  { id: 'goat', nameKey: 'chinese.goat', years: [1931, 1943, 1955, 1967, 1979, 1991, 2003, 2015, 2027, 2039], element: 'Earth', descriptionKey: 'chinese.goatDesc', luckyNumbers: [2, 7], luckyColors: ['brown', 'red', 'purple'] },
  { id: 'monkey', nameKey: 'chinese.monkey', years: [1932, 1944, 1956, 1968, 1980, 1992, 2004, 2016, 2028, 2040], element: 'Metal', descriptionKey: 'chinese.monkeyDesc', luckyNumbers: [4, 9], luckyColors: ['white', 'blue', 'gold'] },
  { id: 'rooster', nameKey: 'chinese.rooster', years: [1933, 1945, 1957, 1969, 1981, 1993, 2005, 2017, 2029, 2041], element: 'Metal', descriptionKey: 'chinese.roosterDesc', luckyNumbers: [5, 7, 8], luckyColors: ['gold', 'brown', 'yellow'] },
  { id: 'dog', nameKey: 'chinese.dog', years: [1934, 1946, 1958, 1970, 1982, 1994, 2006, 2018, 2030, 2042], element: 'Earth', descriptionKey: 'chinese.dogDesc', luckyNumbers: [3, 4, 9], luckyColors: ['red', 'green', 'purple'] },
  { id: 'pig', nameKey: 'chinese.pig', years: [1935, 1947, 1959, 1971, 1983, 1995, 2007, 2019, 2031, 2043], element: 'Water', descriptionKey: 'chinese.pigDesc', luckyNumbers: [2, 5, 8], luckyColors: ['yellow', 'gray', 'brown', 'gold'] }
];

export const getChineseZodiac = (birthDate: string): ChineseZodiacSign | null => {
  const year = new Date(birthDate).getFullYear();
  return CHINESE_ZODIAC.find(sign => sign.years.includes(year)) || null;
};
