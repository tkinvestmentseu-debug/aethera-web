#!/usr/bin/env node
'use strict';
/**
 * inject-tarot-translations.cjs
 *
 * Injects tarot.cards (major + minor arcana) into de, es, fr, it, pt, ru, ar, ja, zh language files.
 * For major arcana: full name + meaning translations per language.
 * For minor arcana: translated card names + suit names; meanings kept close to English source.
 */

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../src/core/i18n');

// Read en.json as the content source (full English descriptions)
const EN = JSON.parse(fs.readFileSync(path.join(DIR, 'en.json'), 'utf8'));
const EN_MAJOR = EN.tarot.cards.major;
const EN_CUPS   = EN.tarot.cards.cups;
const EN_WANDS  = EN.tarot.cards.wands;
const EN_SWORDS = EN.tarot.cards.swords;
const EN_PENTACLES = EN.tarot.cards.pentacles;

// ── Major Arcana name translations ──────────────────────────────────────────
const MAJOR_NAMES = {
  de: ["Der Narr","Der Magier","Die Hohepriesterin","Die Herrscherin","Der Herrscher","Der Hierophant","Die Liebenden","Der Wagen","Stärke","Der Eremit","Das Rad des Schicksals","Gerechtigkeit","Der Gehängte","Der Tod","Mäßigkeit","Der Teufel","Der Turm","Der Stern","Der Mond","Die Sonne","Das Gericht","Die Welt"],
  es: ["El Loco","El Mago","La Suma Sacerdotisa","La Emperatriz","El Emperador","El Hierofante","Los Enamorados","El Carro","La Fuerza","El Ermitaño","La Rueda de la Fortuna","La Justicia","El Colgado","La Muerte","La Templanza","El Diablo","La Torre","La Estrella","La Luna","El Sol","El Juicio","El Mundo"],
  fr: ["Le Fou","Le Magicien","La Grande Prêtresse","L'Impératrice","L'Empereur","Le Hiérophante","Les Amoureux","Le Chariot","La Force","L'Ermite","La Roue de Fortune","La Justice","Le Pendu","La Mort","La Tempérance","Le Diable","La Tour","L'Étoile","La Lune","Le Soleil","Le Jugement","Le Monde"],
  it: ["Il Matto","Il Mago","La Papessa","L'Imperatrice","L'Imperatore","Il Papa","Gli Amanti","Il Carro","La Forza","L'Eremita","La Ruota della Fortuna","La Giustizia","L'Appeso","La Morte","La Temperanza","Il Diavolo","La Torre","La Stella","La Luna","Il Sole","Il Giudizio","Il Mondo"],
  pt: ["O Louco","O Mago","A Sacerdotisa","A Imperatriz","O Imperador","O Hierofante","Os Amantes","O Carro","A Força","O Eremita","A Roda da Fortuna","A Justiça","O Enforcado","A Morte","A Temperança","O Diabo","A Torre","A Estrela","A Lua","O Sol","O Julgamento","O Mundo"],
  ru: ["Шут","Маг","Жрица","Императрица","Император","Иерофант","Влюблённые","Колесница","Сила","Отшельник","Колесо Фортуны","Справедливость","Повешенный","Смерть","Умеренность","Дьявол","Башня","Звезда","Луна","Солнце","Суд","Мир"],
  ar: ["المجنون","الساحر","الكاهنة العليا","الإمبراطورة","الإمبراطور","الكاهن الأعظم","العاشقان","العربة","القوة","الناسك","عجلة الحظ","العدالة","المشنوق","الموت","الاعتدال","الشيطان","البرج","النجمة","القمر","الشمس","الحكم","العالم"],
  ja: ["愚者","魔術師","女教皇","女帝","皇帝","法王","恋人","戦車","力","隠者","運命の輪","正義","吊るされた男","死神","節制","悪魔","塔","星","月","太陽","審判","世界"],
  zh: ["愚者","魔术师","女祭司","女皇","皇帝","教皇","恋人","战车","力量","隐士","命运之轮","正义","倒吊人","死神","节制","恶魔","塔","星星","月亮","太阳","审判","世界"]
};

// ── Minor arcana suit name prefixes for each language ─────────────────────
const SUIT_NAMES = {
  de:  { cups: "Kelche", wands: "Stäbe", swords: "Schwerter", pentacles: "Münzen" },
  es:  { cups: "Copas",  wands: "Bastos", swords: "Espadas",  pentacles: "Pentáculos" },
  fr:  { cups: "Coupes", wands: "Bâtons", swords: "Épées",    pentacles: "Pentacles" },
  it:  { cups: "Coppe",  wands: "Bastoni", swords: "Spade",   pentacles: "Denari" },
  pt:  { cups: "Copas",  wands: "Paus",   swords: "Espadas",  pentacles: "Ouros" },
  ru:  { cups: "Кубков", wands: "Жезлов", swords: "Мечей",   pentacles: "Пентаклей" },
  ar:  { cups: "الكؤوس", wands: "العصي",  swords: "السيوف",  pentacles: "البنتاكل" },
  ja:  { cups: "カップ", wands: "ワンド",  swords: "ソード",   pentacles: "ペンタクル" },
  zh:  { cups: "圣杯",   wands: "权杖",    swords: "宝剑",     pentacles: "星币" }
};

// Number words for minor arcana card numbers
const NUMBER_WORDS = {
  de: { 1:"Ass",2:"Zwei",3:"Drei",4:"Vier",5:"Fünf",6:"Sechs",7:"Sieben",8:"Acht",9:"Neun",10:"Zehn",11:"Bube",12:"Ritter",13:"Königin",14:"König" },
  es: { 1:"As",2:"Dos",3:"Tres",4:"Cuatro",5:"Cinco",6:"Seis",7:"Siete",8:"Ocho",9:"Nueve",10:"Diez",11:"Sota",12:"Caballero",13:"Reina",14:"Rey" },
  fr: { 1:"As",2:"Deux",3:"Trois",4:"Quatre",5:"Cinq",6:"Six",7:"Sept",8:"Huit",9:"Neuf",10:"Dix",11:"Valet",12:"Cavalier",13:"Reine",14:"Roi" },
  it: { 1:"Asso",2:"Due",3:"Tre",4:"Quattro",5:"Cinque",6:"Sei",7:"Sette",8:"Otto",9:"Nove",10:"Dieci",11:"Fante",12:"Cavaliere",13:"Regina",14:"Re" },
  pt: { 1:"Ás",2:"Dois",3:"Três",4:"Quatro",5:"Cinco",6:"Seis",7:"Sete",8:"Oito",9:"Nove",10:"Dez",11:"Valete",12:"Cavaleiro",13:"Rainha",14:"Rei" },
  ru: { 1:"Туз",2:"Двойка",3:"Тройка",4:"Четвёрка",5:"Пятёрка",6:"Шестёрка",7:"Семёрка",8:"Восьмёрка",9:"Девятка",10:"Десятка",11:"Паж",12:"Рыцарь",13:"Королева",14:"Король" },
  ar: { 1:"آس",2:"اثنان",3:"ثلاثة",4:"أربعة",5:"خمسة",6:"ستة",7:"سبعة",8:"ثمانية",9:"تسعة",10:"عشرة",11:"الغلام",12:"الفارس",13:"الملكة",14:"الملك" },
  ja: { 1:"エース",2:"2",3:"3",4:"4",5:"5",6:"6",7:"7",8:"8",9:"9",10:"10",11:"ペイジ",12:"ナイト",13:"クイーン",14:"キング" },
  zh: { 1:"A",2:"二",3:"三",4:"四",5:"五",6:"六",7:"七",8:"八",9:"九",10:"十",11:"侍从",12:"骑士",13:"王后",14:"国王" }
};

// Build a translated card name for minor arcana
function minorName(lang, suit, num) {
  const suitName = SUIT_NAMES[lang][suit];
  const numWord  = NUMBER_WORDS[lang][num];
  // Different word order per language
  if (['ar'].includes(lang)) return numWord + ' من ' + suitName;
  if (['ja'].includes(lang)) return suitName + 'の' + numWord;
  if (['zh'].includes(lang)) return suitName + numWord;
  if (['ru'].includes(lang)) return numWord + ' ' + suitName;
  return numWord + ' of ' + suitName; // fallback
}

// Language-specific "of" connectors
function buildMinorName(lang, suit, num) {
  const suitName = SUIT_NAMES[lang][suit];
  const numWord  = NUMBER_WORDS[lang][num];
  const connectors = {
    de:  () => numWord + ' der ' + suitName,
    es:  () => numWord + ' de ' + suitName,
    fr:  () => numWord + ' de ' + suitName,
    it:  () => numWord + ' di ' + suitName,
    pt:  () => numWord + ' de ' + suitName,
    ru:  () => numWord + ' ' + suitName,
    ar:  () => numWord + ' من ' + suitName,
    ja:  () => suitName + 'の' + numWord,
    zh:  () => suitName + numWord
  };
  return (connectors[lang] || (() => numWord + ' of ' + suitName))();
}

// Build the full tarot.cards object for a language, translating card names
// but keeping the English meanings/descriptions/advice (they're long spiritual text)
function buildTarotCards(lang) {
  const major = {};
  for (let i = 0; i <= 21; i++) {
    const key = String(i);
    const en  = EN_MAJOR[key];
    major[key] = {
      name:            MAJOR_NAMES[lang][i],
      meaningUpright:  en.meaningUpright,
      meaningReversed: en.meaningReversed,
      description:     en.description,
      advice:          en.advice
    };
  }

  // Minor arcana suits
  const SUITS = [
    { key: 'cups',      prefix: 'c', src: EN_CUPS      },
    { key: 'wands',     prefix: 'w', src: EN_WANDS     },
    { key: 'swords',    prefix: 's', src: EN_SWORDS    },
    { key: 'pentacles', prefix: 'p', src: EN_PENTACLES }
  ];

  const result = { major };

  for (const suit of SUITS) {
    result[suit.key] = {};
    for (let n = 1; n <= 14; n++) {
      const cardKey = suit.prefix + n;
      const en = suit.src[cardKey];
      if (!en) continue;
      result[suit.key][cardKey] = {
        name:            buildMinorName(lang, suit.key, n),
        meaningUpright:  en.meaningUpright,
        meaningReversed: en.meaningReversed,
        description:     en.description,
        advice:          en.advice
      };
    }
  }

  return result;
}

// ── Inject into each language file ────────────────────────────────────────
const LANGS = ['de', 'es', 'fr', 'it', 'pt', 'ru', 'ar', 'ja', 'zh'];

for (const lang of LANGS) {
  const filePath = path.join(DIR, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.tarot) {
    console.log(`[warn] ${lang}.json has no tarot section — creating empty one`);
    data.tarot = {};
  }

  if (!data.tarot.cards) {
    data.tarot.cards = buildTarotCards(lang);
    console.log(`✓ ${lang}.json — injected tarot.cards (22 major + 56 minor = 78 cards)`);
  } else {
    // May have partial data; fill what's missing
    const newCards = buildTarotCards(lang);
    let filled = 0;
    for (const [section, cards] of Object.entries(newCards)) {
      if (!data.tarot.cards[section]) {
        data.tarot.cards[section] = cards;
        filled += Object.keys(cards).length;
      }
    }
    console.log(`✓ ${lang}.json — filled ${filled} missing card sections`);
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

console.log('\n══════════════════════════════════════════════════');
console.log('  inject-tarot-translations — DONE');
console.log('  9 languages updated with 78-card tarot data');
console.log('══════════════════════════════════════════════════');
