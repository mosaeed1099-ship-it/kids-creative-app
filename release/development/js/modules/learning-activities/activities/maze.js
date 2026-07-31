/**
 * maze — move the hero to the goal through open cells.
 * params: { cols, rows, walls:[[r,c]], start:[r,c], end:[r,c], hero?, goal? }
 * Tap an adjacent open cell (or use arrow keys) to move.
 */
import { h, prompt, shake, pop, starsFor } from './base.js';

export default function maze(container, item, api) {
  const p = api.params;
  const { cols, rows } = p;
  const wallSet = new Set((p.walls || []).map(([r, c]) => r + ',' + c));
  const end = p.end;
  let pos = p.start.slice();
  let mistakes = 0, hints = 0, done = false;
  const isWall = (r, c) => wallSet.has(r + ',' + c);
  const inb = (r, c) => r >= 0 && c >= 0 && r < rows && c < cols;

  const wrap = h('div', { class: 'la-maze' });
  wrap.appendChild(prompt('اوصل ' + (p.hero || '🐰') + ' إلى ' + (p.goal || '🎯')));
  const gridEl = h('div', { class: 'la-maze__grid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
  gridEl.setAttribute('tabindex', '0');
  const cellEls = {};
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const wall = isWall(r, c);
    const cell = h('button', { class: 'la-maze__cell' + (wall ? ' is-wall' : ''), dataset: { r, c } });
    if (r === end[0] && c === end[1]) cell.appendChild(h('span', { class: 'la-maze__goal', text: p.goal || '🎯' }));
    if (!wall) cell.addEventListener('pointerdown', (e) => { e.preventDefault(); go(r, c); });
    gridEl.appendChild(cell); cellEls[r + ',' + c] = cell;
  }
  const hero = h('span', { class: 'la-maze__hero', text: p.hero || '🐰' });

  function place() {
    cellEls[pos[0] + ',' + pos[1]].appendChild(hero); pop(hero);
    Object.entries(cellEls).forEach(([k, el]) => el.classList.remove('is-reach'));
    neighbors(pos[0], pos[1]).forEach(([r, c]) => cellEls[r + ',' + c].classList.add('is-reach'));
  }
  function neighbors(r, c) {
    return [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => inb(a, b) && !isWall(a, b));
  }
  function go(r, c) {
    if (done) return;
    const adj = Math.abs(r - pos[0]) + Math.abs(c - pos[1]) === 1;
    if (!adj || isWall(r, c)) { mistakes++; shake(cellEls[r + ',' + c]); return; }
    cellEls[pos[0] + ',' + pos[1]].classList.add('is-trail');
    pos = [r, c]; place();
    if (r === end[0] && c === end[1]) finish();
  }
  function finish() { done = true; pop(hero); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 400); }

  function bfsNext() {
    const q = [pos.slice()]; const seen = new Set([pos.join(',')]); const prev = {};
    while (q.length) {
      const [r, c] = q.shift();
      if (r === end[0] && c === end[1]) {
        let cur = r + ',' + c; const path = [];
        while (prev[cur]) { path.push(cur); cur = prev[cur]; }
        return path.length ? path[path.length - 1].split(',').map(Number) : null;
      }
      for (const [a, b] of neighbors(r, c)) { const k = a + ',' + b; if (!seen.has(k)) { seen.add(k); prev[k] = r + ',' + c; q.push([a, b]); } }
    }
    return null;
  }

  gridEl.addEventListener('keydown', (e) => {
    const map = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const d = map[e.key]; if (!d) return; e.preventDefault(); go(pos[0] + d[0], pos[1] + d[1]);
  });

  wrap.appendChild(gridEl);
  container.appendChild(wrap);
  place();

  return {
    hint() {
      if (done) return; hints++;
      const nx = bfsNext(); if (nx) { const el = cellEls[nx[0] + ',' + nx[1]]; el.classList.add('is-hint'); setTimeout(() => el.classList.remove('is-hint'), 900); }
    },
    getState() { return { pos, mistakes, done }; },
    setState(s) { if (s?.pos) { pos = s.pos.slice(); place(); } },
    destroy() { wrap.remove(); },
  };
}
