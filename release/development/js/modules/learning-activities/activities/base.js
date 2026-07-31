/**
 * base.js — shared helpers for every activity renderer. Pure DOM, offline.
 *
 * Renderer contract (each activity default-exports a function):
 *   renderer(container, item, api) -> { hint(), getState(), setState(s), destroy() }
 *   api = { complete(stars 0..3), progress(0..1), mistake(), colors, params }
 *
 * No engine coupling; activities only receive the ContentItem + a small api.
 */

/* ------------------------------------------------------------------ DOM h() */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'on' && typeof v === 'object') for (const [ev, fn] of Object.entries(v)) el.addEventListener(ev, fn);
    else if (k === 'dataset' && typeof v === 'object') Object.assign(el.dataset, v);
    else if (k in el && k !== 'list') { try { el[k] = v; } catch (_) { el.setAttribute(k, v); } }
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) { if (c == null || c === false) continue; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); }
  return el;
}

/* --------------------------------------------------------------- utilities */
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
export const arrEq = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Stars from performance: fewer mistakes/hints → more stars (1..3). */
export function starsFor({ mistakes = 0, hints = 0 } = {}) {
  const penalty = mistakes + hints;
  if (penalty === 0) return 3;
  if (penalty <= 2) return 2;
  return 1;
}

/* ----------------------------------------------------------------- effects */
export function pop(el) { el.classList.remove('la-pop'); void el.offsetWidth; el.classList.add('la-pop'); }
export function shake(el) { el.classList.remove('la-shake'); void el.offsetWidth; el.classList.add('la-shake'); }

/** Tiny confetti burst inside a positioned container (offline, canvas-free). */
export function celebrate(host) {
  const box = h('div', { class: 'la-confetti' });
  const colors = ['#ff6b9d', '#5b6bff', '#ffb020', '#3ec98a', '#8b5cf6'];
  for (let i = 0; i < 24; i++) {
    const p = h('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random() * 0.25) + 's';
    p.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  host.appendChild(box);
  setTimeout(() => box.remove(), 1400);
}

/* ------------------------------------------------------- pointer position */
export function point(e) {
  const t = e.touches?.[0] || e.changedTouches?.[0] || e;
  return { x: t.clientX, y: t.clientY };
}

/**
 * DragController — reusable pointer drag & drop for touch + mouse.
 * Sources carry class `la-drag`; drop targets carry class `la-drop`.
 * On release the element under the pointer that has `.la-drop` is offered to
 * onDrop(sourceEl, dropEl); return true to accept (source is hidden/locked).
 *
 *   const dc = new DragController(root, { onDrop });  dc.arm(sourceEl);
 */
export class DragController {
  constructor(root, { onDrop, onStart, onEnd } = {}) {
    this.root = root; this.onDrop = onDrop; this.onStart = onStart; this.onEnd = onEnd;
    this._src = null; this._ghost = null; this._dx = 0; this._dy = 0;
    this._move = this._move.bind(this); this._up = this._up.bind(this);
  }
  arm(el) {
    el.classList.add('la-drag');
    el.style.touchAction = 'none';
    el.addEventListener('pointerdown', (e) => this._down(e, el));
  }
  _down(e, el) {
    if (el.dataset.locked === '1') return;
    e.preventDefault();
    this._src = el;
    const r = el.getBoundingClientRect();
    const p = point(e);
    this._dx = p.x - r.left; this._dy = p.y - r.top;
    const g = el.cloneNode(true);
    g.classList.add('la-ghost'); g.classList.remove('la-drag');
    g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
    g.style.left = r.left + 'px'; g.style.top = r.top + 'px';
    document.body.appendChild(g);
    this._ghost = g;
    el.classList.add('la-dragging');
    window.addEventListener('pointermove', this._move);
    window.addEventListener('pointerup', this._up);
    this.onStart?.(el);
  }
  _move(e) {
    if (!this._ghost) return;
    const p = point(e);
    this._ghost.style.left = (p.x - this._dx) + 'px';
    this._ghost.style.top = (p.y - this._dy) + 'px';
    const t = this._targetUnder(p);
    this.root.querySelectorAll('.la-drop.is-over').forEach((n) => n.classList.remove('is-over'));
    if (t) t.classList.add('is-over');
  }
  _up(e) {
    window.removeEventListener('pointermove', this._move);
    window.removeEventListener('pointerup', this._up);
    const p = point(e);
    const t = this._targetUnder(p);
    this.root.querySelectorAll('.la-drop.is-over').forEach((n) => n.classList.remove('is-over'));
    const src = this._src;
    if (this._ghost) { this._ghost.remove(); this._ghost = null; }
    if (src) src.classList.remove('la-dragging');
    let accepted = false;
    if (src && t && this.onDrop) accepted = !!this.onDrop(src, t);
    if (!accepted && src) pop(src);
    this._src = null;
    this.onEnd?.(accepted);
  }
  _targetUnder(p) {
    const before = this._ghost ? this._ghost.style.pointerEvents : null;
    if (this._ghost) this._ghost.style.pointerEvents = 'none';
    let node = document.elementFromPoint(p.x, p.y);
    if (this._ghost) this._ghost.style.pointerEvents = before;
    while (node && node !== document.body) { if (node.classList?.contains('la-drop')) return node; node = node.parentElement; }
    return null;
  }
}

/* ------------------------------------------------------ shared UI fragments */
export function prompt(text) { return h('div', { class: 'la-prompt', text }); }
export function board(cls = '') { return h('div', { class: `la-board ${cls}` }); }
