/**
 * pattern-completion — what comes next? tap the option that continues the pattern.
 * params: { sequence:[emoji...], options:[emoji...], answer }
 */
import { h, prompt, shuffle, pop, shake, celebrate, starsFor } from './base.js';

export default function patternCompletion(container, item, api) {
  const p = api.params;
  let mistakes = 0, hints = 0, done = false;

  const wrap = h('div', { class: 'la-pattern' });
  wrap.appendChild(prompt('ما الذي يكمل النمط؟'));

  const seq = h('div', { class: 'la-pattern__seq' });
  p.sequence.forEach((em) => seq.appendChild(h('div', { class: 'la-pattern__cell', text: em })));
  const qCell = h('div', { class: 'la-pattern__cell la-pattern__cell--q', text: '؟' });
  seq.appendChild(qCell);
  wrap.appendChild(seq);

  const opts = h('div', { class: 'la-pattern__opts' });
  const optEls = [];
  shuffle(p.options).forEach((em) => {
    const b = h('button', { class: 'la-pattern__opt', text: em });
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); choose(em, b); });
    opts.appendChild(b); optEls.push(b);
  });
  wrap.appendChild(opts);
  container.appendChild(wrap);

  function choose(em, b) {
    if (done) return;
    if (em === p.answer) {
      done = true; qCell.textContent = em; qCell.classList.add('is-right'); pop(qCell);
      b.classList.add('is-right'); optEls.forEach((o) => (o.dataset.locked = '1'));
      api.progress(1); celebrate(wrap); setTimeout(() => api.complete(starsFor({ mistakes, hints })), 600);
    } else { mistakes++; shake(b); b.classList.add('is-wrong'); setTimeout(() => b.classList.remove('is-wrong'), 500); }
  }

  return {
    hint() { if (done) return; hints++; const good = optEls.find((o) => o.textContent === p.answer); if (good) pop(good); },
    getState() { return { done, mistakes }; },
    setState() {},
    destroy() { wrap.remove(); },
  };
}
