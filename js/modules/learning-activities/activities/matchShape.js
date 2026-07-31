/**
 * match-shape — drag each colored shape into its matching outline.
 * params: { shapes:[{id, shape, color}] }   shape ∈ circle|square|triangle|star|heart
 */
import { h, prompt, shuffle, pop, shake, celebrate, starsFor, DragController } from './base.js';

const PATH = {
  circle: '<circle cx="50" cy="50" r="40" />',
  square: '<rect x="12" y="12" width="76" height="76" rx="8" />',
  triangle: '<polygon points="50,10 92,88 8,88" />',
  star: '<polygon points="50,6 61,38 95,38 68,59 78,92 50,72 22,92 32,59 5,38 39,38" />',
  heart: '<path d="M50 86 C10 56 12 22 34 22 C46 22 50 34 50 34 C50 34 54 22 66 22 C88 22 90 56 50 86 Z" />',
};
function shapeSVG(shape, { fill, outline } = {}) {
  const style = outline
    ? 'fill:none;stroke:#c9cce6;stroke-width:5;stroke-dasharray:7 6;'
    : `fill:${fill};stroke:rgba(0,0,0,.12);stroke-width:3;`;
  return `<svg viewBox="0 0 100 100" style="${style}">${PATH[shape] || PATH.circle}</svg>`;
}

export default function matchShape(container, item, api) {
  const shapes = api.params.shapes || [];
  const total = shapes.length;
  let matched = 0, mistakes = 0, hints = 0, done = false;

  const wrap = h('div', { class: 'la-match' });
  wrap.appendChild(prompt('اسحب كل شكل إلى مكانه'));

  const slots = h('div', { class: 'la-match__row la-match__row--targets' });
  const tray = h('div', { class: 'la-match__row la-match__row--sources' });

  shuffle(shapes).forEach((s) => {
    const slot = h('div', { class: 'la-drop la-match__slot', dataset: { id: s.id, color: s.color }, html: shapeSVG(s.shape, { outline: true }) });
    slot.dataset.shape = s.shape;
    slots.appendChild(slot);
  });
  const tileEls = {};
  shuffle(shapes).forEach((s) => {
    const t = h('div', { class: 'la-match__tile la-match__tile--shape', dataset: { id: s.id }, html: shapeSVG(s.shape, { fill: s.color }) });
    tray.appendChild(t); tileEls[s.id] = t;
  });

  const dc = new DragController(wrap, {
    onDrop(src, drop) {
      if (src.dataset.id === drop.dataset.id && drop.dataset.done !== '1') {
        drop.dataset.done = '1'; drop.classList.add('is-filled');
        drop.innerHTML = tileEls[src.dataset.id].innerHTML;
        src.dataset.locked = '1'; src.style.visibility = 'hidden';
        pop(drop); matched++; api.progress(matched / total);
        if (matched === total) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); }
        return true;
      }
      mistakes++; shake(drop); return false;
    },
  });
  Object.values(tileEls).forEach((t) => dc.arm(t));

  wrap.appendChild(slots); wrap.appendChild(tray);
  container.appendChild(wrap);

  return {
    hint() { const left = shapes.find((s) => tileEls[s.id].dataset.locked !== '1'); if (left) { hints++; pop(tileEls[left.id]); } },
    getState() { return { matched, mistakes, done }; },
    setState() {},
    destroy() { wrap.remove(); },
  };
}
