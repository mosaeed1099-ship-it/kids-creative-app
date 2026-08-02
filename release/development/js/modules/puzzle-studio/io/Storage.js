/**
 * Storage.js — offline persistence (localStorage): a rolling autosave slot for
 * the current puzzle (restored on open) plus per-image progress keyed by
 * image+grid, so returning to an image resumes where the child left off.
 */
const AUTO = 'kcs.puzzle.autosave.v1';
const PROG = 'kcs.puzzle.progress.v1';

const read = (k, f) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

export default class Storage {
  saveAuto(app) {
    if (!app.model?.item) return;
    const state = app.model.serialize();
    write(AUTO, { data: state, updated: Date.now() });
    const map = read(PROG, {});
    map[app.progressKey()] = state.pieces;
    write(PROG, map);
  }
  loadAuto() { return read(AUTO, null)?.data || null; }
  loadProgress(key) { return read(PROG, {})[key] || null; }
  clearProgress(key) { const m = read(PROG, {}); delete m[key]; write(PROG, m); }
  clearAuto() { try { localStorage.removeItem(AUTO); } catch { /* ignore */ } }
}
