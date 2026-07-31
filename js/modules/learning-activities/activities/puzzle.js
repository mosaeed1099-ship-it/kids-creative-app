/**
 * puzzle — a picture cut into pieces; tap two pieces to swap until solved.
 * params: { emoji, cols, rows }  (image is drawn from the emoji, fully offline)
 */
import { h, prompt, shuffle, pop, celebrate, starsFor } from './base.js';

function emojiDataURL(emoji, size = 300) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#eef1ff'); g.addColorStop(1, '#ffe9f3');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  ctx.font = `${Math.floor(size * 0.7)}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(emoji, size / 2, size / 2 + size * 0.03);
  return cv.toDataURL('image/png');
}

export default function puzzle(container, item, api) {
  const p = api.params;
  const { cols, rows } = p; const n = cols * rows;
  const url = emojiDataURL(p.emoji);
  let mistakes = 0, hints = 0, done = false, sel = -1;

  // slots[position] = which correct-piece-index currently sits there
  let slots = shuffle([...Array(n).keys()]);
  if (slots.every((v, i) => v === i)) slots = slots.reverse(); // avoid pre-solved

  const wrap = h('div', { class: 'la-puzzle' });
  wrap.appendChild(prompt('بدّل القطع حتى تكتمل الصورة'));
  const grid = h('div', { class: 'la-puzzle__grid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${cols} / ${rows}` } });
  const tiles = [];
  for (let i = 0; i < n; i++) {
    const t = h('button', { class: 'la-puzzle__piece', dataset: { pos: i } });
    t.addEventListener('pointerdown', (e) => { e.preventDefault(); click(i); });
    grid.appendChild(t); tiles.push(t);
  }
  wrap.appendChild(grid);
  container.appendChild(wrap);
  paint();

  function paint() {
    for (let i = 0; i < n; i++) {
      const piece = slots[i];
      const r = Math.floor(piece / cols), c = piece % cols;
      const t = tiles[i];
      t.style.backgroundImage = `url(${url})`;
      t.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
      t.style.backgroundPosition = `${(c / (cols - 1 || 1)) * 100}% ${(r / (rows - 1 || 1)) * 100}%`;
      t.classList.toggle('is-right', piece === i);
      t.classList.toggle('is-sel', i === sel);
    }
    api.progress(slots.filter((v, i) => v === i).length / n);
  }
  function click(i) {
    if (done) return;
    if (sel === -1) { sel = i; paint(); return; }
    if (sel === i) { sel = -1; paint(); return; }
    [slots[sel], slots[i]] = [slots[i], slots[sel]];
    if (slots[i] !== i && slots[sel] !== sel) mistakes++;
    pop(tiles[i]); sel = -1; paint();
    if (slots.every((v, k) => v === k)) finish();
  }
  function finish() { done = true; tiles.forEach((t) => t.dataset.locked = '1'); celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); }

  return {
    hint() {
      if (done) return; hints++;
      const wrong = slots.findIndex((v, i) => v !== i);
      if (wrong >= 0) { const home = slots.indexOf(wrong); [tiles[wrong], tiles[home]].forEach((t) => { t.classList.add('is-hint'); setTimeout(() => t.classList.remove('is-hint'), 900); }); }
    },
    getState() { return { slots, mistakes, done }; },
    setState(s) { if (s?.slots) { slots = s.slots.slice(); paint(); } },
    destroy() { wrap.remove(); },
  };
}
