/**
 * connect-dots — tap the numbered dots in order to draw the picture.
 * params: { points:[{x,y}], reveal?:emoji }  (x,y in 0..100)
 */
import { h, prompt, pop, shake, starsFor } from './base.js';

export default function connectDots(container, item, api) {
  const p = api.params;
  const pts = p.points || [];
  const N = pts.length;
  let next = 0, mistakes = 0, hints = 0, done = false;

  const wrap = h('div', { class: 'la-dots' });
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('class', 'la-dots__svg');

  const path = document.createElementNS(ns, 'polyline');
  path.setAttribute('class', 'la-dots__line');
  path.setAttribute('points', '');
  svg.appendChild(path);

  const reveal = document.createElementNS(ns, 'text');
  reveal.setAttribute('x', '50'); reveal.setAttribute('y', '56');
  reveal.setAttribute('text-anchor', 'middle');
  reveal.setAttribute('class', 'la-dots__reveal');
  reveal.textContent = p.reveal || '';
  svg.appendChild(reveal);

  const dotEls = [];
  pts.forEach((pt, i) => {
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('class', 'la-dots__dot');
    g.dataset.i = String(i);
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', pt.x); c.setAttribute('cy', pt.y); c.setAttribute('r', '4.6');
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', pt.x); t.setAttribute('y', pt.y + 1.6);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('class', 'la-dots__num');
    t.textContent = String(i + 1);
    g.appendChild(c); g.appendChild(t);
    g.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
    svg.appendChild(g); dotEls.push(g);
  });
  dotEls[0]?.classList.add('is-next');

  const line = [];
  function tap(i) {
    if (done) return;
    if (i !== next) { mistakes++; shake(dotEls[i]); return; }
    dotEls[i].classList.remove('is-next'); dotEls[i].classList.add('is-done'); pop(dotEls[i]);
    line.push(`${pts[i].x},${pts[i].y}`);
    path.setAttribute('points', line.join(' '));
    next++;
    api.progress(next / N);
    if (next < N) dotEls[next].classList.add('is-next');
    else finish();
  }
  function finish() {
    done = true;
    // close the shape back to the first point
    line.push(`${pts[0].x},${pts[0].y}`);
    path.setAttribute('points', line.join(' '));
    svg.classList.add('is-complete');
    setTimeout(() => api.complete(starsFor({ mistakes, hints })), 500);
  }

  wrap.appendChild(prompt('المس النقاط بالترتيب من 1 إلى ' + N));
  wrap.appendChild(svg);
  container.appendChild(wrap);

  return {
    hint() { if (!done) { hints++; pop(dotEls[next]); } },
    getState() { return { next, mistakes, done }; },
    setState(s) { if (!s) return; for (let i = 0; i < (s.next || 0) && i < N; i++) tap(i); },
    destroy() { wrap.remove(); },
  };
}
