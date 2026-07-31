/**
 * match-shadow — drag each picture onto its matching shadow.
 * params: { pairs:[{id, emoji}] }
 */
import { h, prompt, shuffle, pop, shake, celebrate, starsFor, DragController } from './base.js';

export default function matchShadow(container, item, api) {
  const pairs = api.params.pairs || [];
  const total = pairs.length;
  let matched = 0, mistakes = 0, hints = 0, done = false;

  const wrap = h('div', { class: 'la-match' });
  wrap.appendChild(prompt('اسحب كل صورة إلى ظِلّها'));

  const shadows = h('div', { class: 'la-match__row la-match__row--targets' });
  const tiles = h('div', { class: 'la-match__row la-match__row--sources' });

  shuffle(pairs).forEach((pr) => {
    const slot = h('div', { class: 'la-drop la-match__slot', dataset: { id: pr.id } },
      [h('span', { class: 'la-match__shadow', text: pr.emoji })]);
    shadows.appendChild(slot);
  });
  const tileEls = {};
  shuffle(pairs).forEach((pr) => {
    const t = h('div', { class: 'la-match__tile', dataset: { id: pr.id }, text: pr.emoji });
    tiles.appendChild(t); tileEls[pr.id] = t;
  });

  const dc = new DragController(wrap, {
    onDrop(src, drop) {
      if (src.dataset.id === drop.dataset.id && drop.dataset.done !== '1') {
        drop.dataset.done = '1'; drop.classList.add('is-filled');
        drop.querySelector('.la-match__shadow').textContent = src.dataset.emoji || tileEls[src.dataset.id].textContent;
        drop.querySelector('.la-match__shadow').classList.add('is-real');
        src.dataset.locked = '1'; src.classList.add('is-used'); src.style.visibility = 'hidden';
        pop(drop); matched++; api.progress(matched / total);
        if (matched === total) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); }
        return true;
      }
      mistakes++; shake(drop); return false;
    },
  });
  Object.values(tileEls).forEach((t) => dc.arm(t));

  wrap.appendChild(shadows); wrap.appendChild(tiles);
  container.appendChild(wrap);

  return {
    hint() { const left = pairs.find((pr) => tileEls[pr.id].dataset.locked !== '1'); if (left) { hints++; pop(tileEls[left.id]); } },
    getState() { return { matched, mistakes, done }; },
    setState() {},
    destroy() { wrap.remove(); },
  };
}
