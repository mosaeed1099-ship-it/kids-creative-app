/**
 * Storage.js — offline persistence (localStorage): a rolling "current" slot for
 * autosave + continue-editing, plus a named library of saved story books (with
 * cover thumbnails) the child can reopen.
 */
const CUR = 'kcs.story.current.v1';
const LIB = 'kcs.story.library.v1';

const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export default class Storage {
  saveAuto(app) { return write(CUR, { data: app.story.serialize(), updated: Date.now() }); }
  loadCurrent() { return read(CUR, null)?.data || null; }
  clearCurrent() { try { localStorage.removeItem(CUR); } catch { /* ignore */ } }

  list() { return read(LIB, []); }
  saveToLibrary(app, thumb) {
    const entry = { id: app.story.id, title: app.story.meta.title || 'قصتي', thumb: thumb || null, updated: Date.now(), data: app.story.serialize() };
    const next = [entry, ...this.list().filter((e) => e.id !== entry.id)].slice(0, 20);
    return write(LIB, next) ? entry : null;
  }
  open(id) { return this.list().find((e) => e.id === id)?.data || null; }
  remove(id) { write(LIB, this.list().filter((e) => e.id !== id)); }
}
