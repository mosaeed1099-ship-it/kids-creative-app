/**
 * alphabet — two modes:
 *   order: tap the Arabic letters in order.  params { mode:'order', letters:[] }
 *   match: drag each picture to its starting letter. params { mode:'match', pairs:[{letter,emoji,word}] }
 */
import { h, prompt, shuffle, pop, shake, celebrate, starsFor, DragController } from './base.js';

export default function alphabet(container, item, api) {
  const p = api.params;
  return p.mode === 'match' ? matchMode(container, p, api) : orderMode(container, p, api);
}

function orderMode(container, p, api) {
  const order = p.letters.slice();
  let next = 0, mistakes = 0, hints = 0, done = false;
  const wrap = h('div', { class: 'la-alpha' });
  wrap.appendChild(prompt('المس الحروف بالترتيب الصحيح'));
  const row = h('div', { class: 'la-alpha__row' });
  const els = {};
  shuffle(order).forEach((l) => {
    const b = h('button', { class: 'la-alpha__tile', text: l, dataset: { l } });
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(l, b); });
    row.appendChild(b); els[l] = b;
  });
  wrap.appendChild(row);
  container.appendChild(wrap);
  function tap(l, b) {
    if (done) return;
    if (l === order[next]) { b.classList.add('is-done'); b.dataset.locked = '1'; pop(b); next++; api.progress(next / order.length); if (next === order.length) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); } }
    else { mistakes++; shake(b); }
  }
  return { hint() { if (!done) { hints++; pop(els[order[next]]); } }, getState() { return { next, done, mistakes }; }, setState() {}, destroy() { wrap.remove(); } };
}

function matchMode(container, p, api) {
  const pairs = p.pairs || [];
  const total = pairs.length;
  let matched = 0, mistakes = 0, hints = 0, done = false;
  const wrap = h('div', { class: 'la-match' });
  wrap.appendChild(prompt('اسحب كل صورة إلى حرفها الأول'));
  const letters = h('div', { class: 'la-match__row la-match__row--targets' });
  const pics = h('div', { class: 'la-match__row la-match__row--sources' });
  shuffle(pairs).forEach((pr) => {
    const slot = h('div', { class: 'la-drop la-alpha__slot', dataset: { id: pr.letter } }, [h('span', { class: 'la-alpha__slotL', text: pr.letter })]);
    letters.appendChild(slot);
  });
  const tileEls = {};
  shuffle(pairs).forEach((pr) => {
    const t = h('div', { class: 'la-match__tile', dataset: { id: pr.letter, word: pr.word }, text: pr.emoji });
    pics.appendChild(t); tileEls[pr.letter] = t;
  });
  const dc = new DragController(wrap, {
    onDrop(src, drop) {
      if (src.dataset.id === drop.dataset.id && drop.dataset.done !== '1') {
        drop.dataset.done = '1'; drop.classList.add('is-filled');
        drop.appendChild(h('span', { class: 'la-alpha__word', text: (src.dataset.word || '') + ' ' + src.textContent }));
        src.dataset.locked = '1'; src.style.visibility = 'hidden'; pop(drop);
        matched++; api.progress(matched / total);
        if (matched === total) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); }
        return true;
      }
      mistakes++; shake(drop); return false;
    },
  });
  Object.values(tileEls).forEach((t) => dc.arm(t));
  wrap.appendChild(letters); wrap.appendChild(pics);
  container.appendChild(wrap);
  return { hint() { const left = pairs.find((pr) => tileEls[pr.letter].dataset.locked !== '1'); if (left) { hints++; pop(tileEls[left.letter]); } }, getState() { return { matched, done, mistakes }; }, setState() {}, destroy() { wrap.remove(); } };
}
