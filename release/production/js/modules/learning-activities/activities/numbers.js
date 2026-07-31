/**
 * numbers — two modes:
 *   count: show N objects, tap the right number.  params { mode:'count', emoji, count, options:[], answer }
 *   order: tap the numbers from smallest to largest. params { mode:'order', numbers:[] }
 */
import { h, prompt, shuffle, pop, shake, celebrate, starsFor } from './base.js';

export default function numbers(container, item, api) {
  const p = api.params;
  return p.mode === 'order' ? orderMode(container, p, api) : countMode(container, p, api);
}

function countMode(container, p, api) {
  let mistakes = 0, hints = 0, done = false;
  const wrap = h('div', { class: 'la-num' });
  wrap.appendChild(prompt('كم عدد الأشياء؟'));
  const objs = h('div', { class: 'la-num__objs' });
  for (let i = 0; i < p.count; i++) objs.appendChild(h('span', { class: 'la-num__obj', text: p.emoji }));
  wrap.appendChild(objs);
  const opts = h('div', { class: 'la-num__opts' });
  const els = [];
  shuffle(p.options).forEach((n) => {
    const b = h('button', { class: 'la-num__opt', text: String(n) });
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (done) return; if (n === p.answer) { done = true; b.classList.add('is-right'); els.forEach((x) => x.dataset.locked = '1'); api.progress(1); celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); } else { mistakes++; shake(b); } });
    opts.appendChild(b); els.push(b);
  });
  wrap.appendChild(opts);
  container.appendChild(wrap);
  return { hint() { if (!done) { hints++; const g = els.find((x) => x.textContent === String(p.answer)); if (g) pop(g); } }, getState() { return { done, mistakes }; }, setState() {}, destroy() { wrap.remove(); } };
}

function orderMode(container, p, api) {
  const sorted = p.numbers.slice().sort((a, b) => a - b);
  let next = 0, mistakes = 0, hints = 0, done = false;
  const wrap = h('div', { class: 'la-num' });
  wrap.appendChild(prompt('المس الأرقام من الأصغر إلى الأكبر'));
  const row = h('div', { class: 'la-num__tiles' });
  const els = {};
  shuffle(p.numbers).forEach((n) => {
    const b = h('button', { class: 'la-num__tile', text: String(n), dataset: { n } });
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(n, b); });
    row.appendChild(b); els[n] = b;
  });
  wrap.appendChild(row);
  container.appendChild(wrap);
  function tap(n, b) {
    if (done) return;
    if (n === sorted[next]) { b.classList.add('is-done'); b.dataset.locked = '1'; pop(b); next++; api.progress(next / sorted.length); if (next === sorted.length) { done = true; celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600); } }
    else { mistakes++; shake(b); }
  }
  return { hint() { if (!done) { hints++; pop(els[sorted[next]]); } }, getState() { return { next, done, mistakes }; }, setState() {}, destroy() { wrap.remove(); } };
}
