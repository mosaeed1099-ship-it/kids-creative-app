/**
 * Storage.js — offline persistence in localStorage:
 *   • autosave  a single rolling slot restored automatically on open
 *   • gallery   named saves (with thumbnails) the child can reopen
 *
 * Documents serialise to compact JSON (mostly vector marks), so saves are small.
 * Every write is wrapped so private-mode / quota errors never crash the studio.
 */
import { thumbnail } from './exportImage.js';

const AUTOSAVE = 'kcs.freedraw.autosave.v1';
const GALLERY = 'kcs.freedraw.gallery.v1';
const MAX_ITEMS = 16;

const read = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
};

export default class Storage {
  // ---- autosave ----
  saveAuto(doc) { return write(AUTOSAVE, { data: doc.serialize(), updated: Date.now() }); }
  hasAuto() { return !!read(AUTOSAVE, null); }
  loadAuto() { return read(AUTOSAVE, null)?.data || null; }
  clearAuto() { try { localStorage.removeItem(AUTOSAVE); } catch { /* ignore */ } }

  // ---- named gallery ----
  list() { return read(GALLERY, []); }

  save(app, title) {
    const items = this.list();
    const entry = {
      id: `d${Date.now().toString(36)}`,
      title: (title || 'رسمة').slice(0, 40),
      thumb: safeThumb(app),
      data: app.doc.serialize(),
      updated: Date.now(),
    };
    const next = [entry, ...items].slice(0, MAX_ITEMS);
    const ok = write(GALLERY, next);
    return ok ? entry : null;
  }

  open(id) { return this.list().find((e) => e.id === id)?.data || null; }

  remove(id) { write(GALLERY, this.list().filter((e) => e.id !== id)); }
}

function safeThumb(app) {
  try { return thumbnail(app); } catch { return null; }
}
