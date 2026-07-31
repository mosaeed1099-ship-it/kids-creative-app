/**
 * _gen.mjs — offline generator for the Learning-Activities content pack.
 * Produces catalog.json + activities.pack.json (Content-Engine items whose
 * `assetType` is "activity" and whose `data` carries {type, params}).
 * Run: node _gen.mjs   (dev-time only; not shipped/executed at runtime)
 */
import { writeFileSync } from 'node:fs';

const AR = (ar) => ({ ar, en: ar });

// ---- categories -----------------------------------------------------------
const categories = [
  { id: 'cat-logic',    title: AR('منطق وتفكير'), icon: '🧩', order: 1 },
  { id: 'cat-numbers',  title: AR('أرقام'),        icon: '🔢', order: 2 },
  { id: 'cat-letters',  title: AR('حروف'),         icon: '🔤', order: 3 },
  { id: 'cat-focus',    title: AR('تركيز'),        icon: '🔍', order: 4 },
].map((c) => ({ ...c, packId: 'activities' }));

const items = [];
const add = (o) => { items.push({ ...o, packId: 'activities', languages: ['ar', 'en'], license: { type: 'original' }, order: items.length + 1 }); };

// Solvable cell-blocking maze: start all open, add walls only if start→end stays connected.
function reachable(cols, rows, walls, start, end) {
  const W = new Set(walls.map(([r, c]) => r + ',' + c));
  const inb = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols;
  const nb = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => inb(a, b) && !W.has(a + ',' + b));
  const q = [start.slice()]; const seen = new Set([start.join(',')]);
  while (q.length) { const [r, c] = q.shift(); if (r === end[0] && c === end[1]) return true; for (const [a, b] of nb(r, c)) { const k = a + ',' + b; if (!seen.has(k)) { seen.add(k); q.push([a, b]); } } }
  return false;
}
function makeMaze(cols, rows, start, end, density = 0.32) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (!(r === start[0] && c === start[1]) && !(r === end[0] && c === end[1])) cells.push([r, c]);
  // shuffle candidates
  for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
  const walls = []; const target = Math.floor(cols * rows * density);
  for (const cell of cells) { if (walls.length >= target) break; walls.push(cell); if (!reachable(cols, rows, walls, start, end)) walls.pop(); }
  return walls;
}

// ---------------------------------------------------------------- connect dots
add({
  id: 'act-dots-star', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('وصّل النقاط — نجمة'), tags: ['dots', 'shapes'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '⭐' },
  data: { type: 'connect-dots', params: {
    reveal: '⭐',
    points: [ {x:50,y:8},{x:61,y:38},{x:92,y:38},{x:67,y:58},{x:76,y:90},{x:50,y:70},{x:24,y:90},{x:33,y:58},{x:8,y:38},{x:39,y:38} ],
  } },
});
add({
  id: 'act-dots-house', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('وصّل النقاط — منزل'), tags: ['dots', 'shapes'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🏠' },
  data: { type: 'connect-dots', params: {
    reveal: '🏠',
    points: [ {x:20,y:50},{x:20,y:88},{x:80,y:88},{x:80,y:50},{x:88,y:50},{x:50,y:14},{x:12,y:50} ],
  } },
});

// ---------------------------------------------------------------- maze
add({
  id: 'act-maze-1', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('المتاهة — ساعد الأرنب'), tags: ['maze'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🐰' },
  data: { type: 'maze', params: {
    cols: 6, rows: 6, start: [0, 0], end: [5, 5], hero: '🐰', goal: '🥕',
    walls: makeMaze(6, 6, [0, 0], [5, 5], 0.3),
  } },
});
add({
  id: 'act-maze-2', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('المتاهة — النحلة والزهرة'), tags: ['maze'],
  ageGroup: 'child', difficulty: 'hard',
  thumbnail: { type: 'emoji', value: '🐝' },
  data: { type: 'maze', params: {
    cols: 7, rows: 7, start: [0, 0], end: [6, 6], hero: '🐝', goal: '🌸',
    walls: makeMaze(7, 7, [0, 0], [6, 6], 0.34),
  } },
});

// ---------------------------------------------------------------- match shadow
add({
  id: 'act-shadow-animals', assetType: 'activity', categoryId: 'cat-focus',
  title: AR('طابق الظل — حيوانات'), tags: ['match', 'shadow'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🦁' },
  data: { type: 'match-shadow', params: { pairs: [
    { id: 'lion', emoji: '🦁' }, { id: 'elephant', emoji: '🐘' },
    { id: 'giraffe', emoji: '🦒' }, { id: 'turtle', emoji: '🐢' },
  ] } },
});
add({
  id: 'act-shadow-fruit', assetType: 'activity', categoryId: 'cat-focus',
  title: AR('طابق الظل — فواكه'), tags: ['match', 'shadow'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🍎' },
  data: { type: 'match-shadow', params: { pairs: [
    { id: 'apple', emoji: '🍎' }, { id: 'banana', emoji: '🍌' },
    { id: 'grapes', emoji: '🍇' }, { id: 'straw', emoji: '🍓' }, { id: 'water', emoji: '🍉' },
  ] } },
});

// ---------------------------------------------------------------- match shape
add({
  id: 'act-shape-1', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('طابق الشكل'), tags: ['match', 'shapes'],
  ageGroup: 'toddler', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🔷' },
  data: { type: 'match-shape', params: { shapes: [
    { id: 'circle', shape: 'circle', color: '#ff6b9d' },
    { id: 'square', shape: 'square', color: '#5b6bff' },
    { id: 'triangle', shape: 'triangle', color: '#3ec98a' },
    { id: 'star', shape: 'star', color: '#ffb020' },
  ] } },
});

// ---------------------------------------------------------------- find difference
add({
  id: 'act-diff-park', assetType: 'activity', categoryId: 'cat-focus',
  title: AR('اكتشف الفرق — الحديقة'), tags: ['difference'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🔍' },
  data: { type: 'find-difference', params: {
    // grid of emojis; sceneB differs at listed indices (new emoji)
    cols: 4, rows: 3,
    scene: ['🌳','🌸','🦋','☁️','🐦','🌷','🍄','🌞','🐞','🌿','🐝','🏵️'],
    differences: [ { i: 2, to: '🐛' }, { i: 5, to: '🌼' }, { i: 8, to: '🐜' } ],
  } },
});

// ---------------------------------------------------------------- pattern completion
add({
  id: 'act-pattern-shapes', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('أكمل النمط — أشكال'), tags: ['pattern'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🔺' },
  data: { type: 'pattern-completion', params: {
    sequence: ['🔴','🔵','🔴','🔵','🔴'], options: ['🔵','🟡','🔴'], answer: '🔵',
  } },
});
add({
  id: 'act-pattern-fruit', assetType: 'activity', categoryId: 'cat-logic',
  title: AR('أكمل النمط — فواكه'), tags: ['pattern'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🍎' },
  data: { type: 'pattern-completion', params: {
    sequence: ['🍎','🍎','🍌','🍎','🍎'], options: ['🍇','🍌','🍎'], answer: '🍌',
  } },
});

// ---------------------------------------------------------------- numbers
add({
  id: 'act-num-count', assetType: 'activity', categoryId: 'cat-numbers',
  title: AR('عُدّ الأشياء'), tags: ['numbers', 'count'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🍏' },
  data: { type: 'numbers', params: {
    mode: 'count', emoji: '🍏', count: 4, options: [3, 4, 5, 6], answer: 4,
  } },
});
add({
  id: 'act-num-order', assetType: 'activity', categoryId: 'cat-numbers',
  title: AR('رتّب الأرقام'), tags: ['numbers', 'order'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🔢' },
  data: { type: 'numbers', params: { mode: 'order', numbers: [1, 2, 3, 4, 5] } },
});

// ---------------------------------------------------------------- alphabet
add({
  id: 'act-alpha-order', assetType: 'activity', categoryId: 'cat-letters',
  title: AR('رتّب الحروف'), tags: ['letters', 'order'],
  ageGroup: 'child', difficulty: 'medium',
  thumbnail: { type: 'emoji', value: '🔤' },
  data: { type: 'alphabet', params: { mode: 'order', letters: ['أ', 'ب', 'ت', 'ث', 'ج'] } },
});
add({
  id: 'act-alpha-match', assetType: 'activity', categoryId: 'cat-letters',
  title: AR('الحرف والصورة'), tags: ['letters', 'match'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🅰️' },
  data: { type: 'alphabet', params: { mode: 'match', pairs: [
    { letter: 'أ', emoji: '🦁', word: 'أسد' },
    { letter: 'ب', emoji: '🦆', word: 'بطة' },
    { letter: 'ت', emoji: '🍎', word: 'تفاحة' },
  ] } },
});

// ---------------------------------------------------------------- puzzle
add({
  id: 'act-puzzle-cat', assetType: 'activity', categoryId: 'cat-focus',
  title: AR('لغز الصورة — قطة'), tags: ['puzzle'],
  ageGroup: 'preschool', difficulty: 'easy',
  thumbnail: { type: 'emoji', value: '🐱' },
  data: { type: 'puzzle', params: { emoji: '🐱', cols: 2, rows: 2 } },
});
add({
  id: 'act-puzzle-rocket', assetType: 'activity', categoryId: 'cat-focus',
  title: AR('لغز الصورة — صاروخ'), tags: ['puzzle'],
  ageGroup: 'child', difficulty: 'hard',
  thumbnail: { type: 'emoji', value: '🚀' },
  data: { type: 'puzzle', params: { emoji: '🚀', cols: 3, rows: 3 } },
});

// ---- write ----------------------------------------------------------------
const pack = {
  id: 'activities',
  title: AR('أنشطة تعليمية'),
  thumbnail: { type: 'emoji', value: '🎯' },
  languages: ['ar', 'en'],
  license: { type: 'original' },
  version: 1,
  categories,
  items,
};
const catalog = {
  version: 1,
  title: AR('أنشطة تعليمية'),
  packs: [{
    id: 'activities', title: AR('أنشطة تعليمية'), url: 'activities.pack.json',
    thumbnail: { type: 'emoji', value: '🎯' }, languages: ['ar', 'en'], order: 1,
  }],
};

writeFileSync(new URL('./activities.pack.json', import.meta.url), JSON.stringify(pack, null, 2));
writeFileSync(new URL('./catalog.json', import.meta.url), JSON.stringify(catalog, null, 2));
console.log('wrote', items.length, 'items across', categories.length, 'categories');
