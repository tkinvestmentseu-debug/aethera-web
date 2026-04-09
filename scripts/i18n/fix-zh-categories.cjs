'use strict';
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../src/core/i18n/zh.json');
const zh = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Fix rituals.categories (was set to a string "类别" by deepMerge collision)
zh.rituals.categories = {
  morning: '早晨',
  evening: '夜晚',
  meditation: '冥想',
  energy: '能量',
  Cleansing: '净化',
  CleansingDesc: '释放重负。能量净化空间和身体的仪式。',
  Love: '爱情',
  LoveDesc: '敞开你的心。吸引、强化和庆祝关系的修行。',
  Manifestation: '显化',
  ManifestationDesc: '将意图转化为现实。焦点和创造的仪式。',
  Protection: '保护',
  ProtectionDesc: '强化你的界限。强化你能量护盾的仪式。',
  Grounding: '接地',
  GroundingDesc: '回归身体和大地。锚定和稳定修行。'
};

// Fix affirmations.categories (was set to a string "类别")
zh.affirmations.categories = {
  love: '爱情',
  abundance: '丰盛',
  healing: '疗愈',
  strength: '力量',
  peace: '平静',
  transformation: '转化',
  vision: '愿景',
  gratitude: '感恩',
  confidence: '自信',
  protection: '保护'
};

fs.writeFileSync(filePath, JSON.stringify(zh, null, 2) + '\n', 'utf8');
console.log('Fixed zh.json: rituals.categories and affirmations.categories now objects');
