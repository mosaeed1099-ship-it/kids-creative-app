/**
 * util.js — self-contained helpers for the Parent Dashboard module:
 *   Store   — namespaced localStorage with memory fallback (fully offline)
 *   Emitter — tiny pub/sub
 *   h       — element builder
 *   uid, todayKey — small helpers
 *
 * The whole module works offline with NO backend, accounts, or cloud.
 */
export class Store {
  constructor(namespace = 'kcs') { this.ns = namespace; this._mem = {}; this._ok = this._probe(); }
  _probe() { try { localStorage.setItem('__kcs_pd__', '1'); localStorage.removeItem('__kcs_pd__'); return true; } catch (_) { return false; } }
  _k(k) { return `${this.ns}:${k}`; }
  get(k, fb = null) {
    try { if (this._ok) { const v = localStorage.getItem(this._k(k)); return v == null ? fb : JSON.parse(v); } return k in this._mem ? this._mem[k] : fb; }
    catch (_) { return fb; }
  }
  set(k, v) { try { if (this._ok) { localStorage.setItem(this._k(k), JSON.stringify(v)); return true; } } catch (_) {} this._mem[k] = v; return false; }
  remove(k) { try { if (this._ok) localStorage.removeItem(this._k(k)); } catch (_) {} delete this._mem[k]; }
}

export class Emitter {
  constructor() { this._m = new Map(); }
  on(t, fn) { if (!this._m.has(t)) this._m.set(t, new Set()); this._m.get(t).add(fn); return () => this.off(t, fn); }
  off(t, fn) { this._m.get(t)?.delete(fn); }
  emit(t, p) { const s = this._m.get(t); if (s) for (const fn of [...s]) { try { fn(p); } catch (e) { console.error(e); } } }
}

export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'on') for (const [e, fn] of Object.entries(v)) el.addEventListener(e, fn);
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

export function uid(prefix = 'p') { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`; }

/** Local date key YYYY-MM-DD (offline, device local time). */
export function dayKey(d = new Date()) {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
