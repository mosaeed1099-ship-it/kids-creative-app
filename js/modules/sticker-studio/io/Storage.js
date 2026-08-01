/**
 * Storage.js — offline persistence (localStorage): a rolling autosave slot
 * restored on open, plus a named gallery (with thumbnails) the child can reopen.
 * Scenes serialise to compact JSON (sticker id + transform), so saves are tiny.
 */
import { thumbnail } from './exportImage.js';

const AUTO = 'kcs.stickers.autosave.v1';
const GALLERY = 'kcs.stickers.gallery.v1';
const MAX = 16;

const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export default class Storage {
  saveAuto(app) { return write(AUTO, { data: app.serializeScene(), updated: Date.now() }); }
  hasAuto() { return !!read(AUTO, null); }
  loadAuto() { return read(AUTO, null)?.data || null; }
  clearAuto() { try { localStorage.removeItem(AUTO); } catch { /* ignore */ } }

  list() { return read(GALLERY, []); }
  save(app, title) {
    const entry = {
      id: `s${Date.now().toString(36)}`,
      title: (title || 'ملصقاتي').slice(0, 40),
      thumb: safeThumb(app),
      data: app.serializeScene(),
      updated: Date.now(),
    };
    return write(GALLERY, [entry, ...this.list()].slice(0, MAX)) ? entry : null;
  }
  open(id) { return this.list().find((e) => e.id === id)?.data || null; }
  remove(id) { write(GALLERY, this.list().filter((e) => e.id !== id)); }
}

function safeThumb(app) { try { return thumbnail(app); } catch { return null; } }
