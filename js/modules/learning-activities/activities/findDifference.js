/**
 * find-difference — two scenes; tap the spots that differ in the second one.
 * params: { cols, rows, scene:[emoji...], differences:[{i, to}] }
 */
import { h, prompt, pop, shake, celebrate, starsFor } from './base.js';

export default function findDifference(container, item, api) {
  const p = api.params;
  const sceneA = p.scene.slice();
  const sceneB = p.scene.slice();
  const diffIdx = new Set(p.differences.map((d) => d.i));
  p.differences.forEach((d) => { sceneB[d.i] = d.to; });
  const total = p.differences.length;
  let found = 0, mistakes = 0, hints = 0, done = false;

  const wrap = h('div', { class: 'la-diff' });
  wrap.appendChild(prompt('اكتشف ' + total + ' اختلافات — المس مكانها في الصورة الثانية'));

  const grid = (arr, interactive) => {
    const g = h('div', { class: 'la-diff__scene', style: { gridTemplateColumns: `repeat(${p.cols}, 1fr)` } });
    arr.forEach((em, i) => {
      const cell = h('div', { class: 'la-diff__cell', text: em, dataset: { i } });
      if (interactive) cell.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i, cell); });
      g.appendChild(cell);
    });
    return g;
  };
  function tap(i, cell) {
    if (done || cell.dataset.found === '1') return;
    if (diffIdx.has(i)) {
      cell.dataset.found = '1'; cell.classList.add('is-found'); pop(cell);
      found++; api.progress(found / total);
      if (found === total) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); }
    } else { mistakes++; shake(cell); }
  }

  const boards = h('div', { class: 'la-diff__boards' });
  boards.appendChild(h('div', { class: 'la-diff__panel' }, [h('div', { class: 'la-diff__tag', text: 'الأصلية' }), grid(sceneA, false)]));
  const bGrid = grid(sceneB, true);
  boards.appendChild(h('div', { class: 'la-diff__panel' }, [h('div', { class: 'la-diff__tag', text: 'ابحث هنا' }), bGrid]));
  wrap.appendChild(boards);
  container.appendChild(wrap);

  return {
    hint() {
      if (done) return; hints++;
      const hit = [...diffIdx].find((i) => bGrid.querySelector(`[data-i="${i}"]`).dataset.found !== '1');
      if (hit != null) { const c = bGrid.querySelector(`[data-i="${hit}"]`); c.classList.add('is-hinted'); setTimeout(() => c.classList.remove('is-hinted'), 900); }
    },
    getState() { return { found, mistakes, done }; },
    setState() {},
    destroy() { wrap.remove(); },
  };
}
