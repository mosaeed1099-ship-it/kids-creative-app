/**
 * util.js — self-contained helpers for the Print Center (offline).
 * Store (namespaced localStorage + memory fallback), Emitter, h, and byte
 * helpers used by the PDF/ZIP builders.
 */
export class Store {
  constructor(ns = 'kcs') { this.ns = ns; this._mem = {}; this._ok = this._probe(); }
  _probe() { try { localStorage.setItem('__kcs_pc__', '1'); localStorage.removeItem('__kcs_pc__'); return true; } catch (_) { return false; } }
  _k(k) { return `${this.ns}:${k}`; }
  get(k, fb = null) { try { if (this._ok) { const v = localStorage.getItem(this._k(k)); return v == null ? fb : JSON.parse(v); } return k in this._mem ? this._mem[k] : fb; } catch (_) { return fb; } }
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

/** Latin1 string → bytes. */
export function strBytes(s) { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff; return a; }

/** data:...;base64,XXXX → Uint8Array. */
export function dataURLtoBytes(dataUrl) {
  const b64 = dataUrl.split(',')[1];
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
