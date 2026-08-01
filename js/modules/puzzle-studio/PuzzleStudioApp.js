/**
 * PuzzleStudioApp.js — the Puzzle Studio controller.
 *
 * Composes the Canvas Engine (render/camera/input/export — public API only) and
 * the Content Engine (puzzle-image packs/search — public API only). Owns the
 * PuzzleModel (generation + jigsaw + grouping/snapping + solve), unlimited
 * history, progress storage, an optional timer, the celebration and the UI.
 * No engine/content logic is duplicated.
 */
import { CanvasEngine } from '../../engine/index.js';
import { ContentManager, Persist } from '../../content/index.js';
import { el } from '../../utils/dom.js';

import PuzzleModel from './puzzle/PuzzleModel.js';
import PieceTool from './interaction/PieceTool.js';
import History from './history/History.js';
import { moveOp } from './history/commands.js';
import Storage from './io/Storage.js';
import { exportPNG, exportJPG, printImage } from './io/exportImage.js';
import Celebration from './effects/Celebration.js';
import PuzzleUI from './ui/PuzzleUI.js';

export default class PuzzleStudioApp {
  constructor({ mount, ctx = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.ctx = ctx;
    this.timerEnabled = true;
    this._timer = { elapsed: 0, running: false, t0: 0, iv: 0 };
    this._disposers = [];
    this._autoFit = true;
  }

  get pageW() { return this.model?.pageW || 1000; }
  get pageH() { return this.model?.pageH || 800; }

  async mount() {
    this._injectCss();
    this.content = new ContentManager({
      base: new URL('./data/', import.meta.url).href,
      persist: new Persist('kcs.puzzle.content'),
    });
    await this.content.init({ catalog: 'catalog.json' });
    await this.content.loadAll();

    this.history = new History({ onChange: (s) => this.ui.setHistory(s.canUndo, s.canRedo) });
    this.storage = new Storage();

    this.ui = new PuzzleUI(this);
    this.root = this.ui.build();
    document.body.appendChild(this.root);
    this.celebration = new Celebration(this.ui.celebrateHost);

    this.engine = new CanvasEngine(this.ui.stage, { background: null, cameraControls: true, onDemand: true, maxDPR: 2 }).mount();
    this.model = new PuzzleModel(this);
    this.engine.tools.register(new PieceTool(this));
    this.engine.tools.activate('piece');
    this._wire();
    this._bindKeys();

    const auto = this.storage.loadAuto();
    if (auto) {
      const item = this.content.getContent(auto.itemId);
      if (item) await this.startPuzzle(item, auto.rows, auto.cols, auto.pieces);
      else this.ui.showSetup();
    } else {
      this.ui.showSetup();
    }
    // Test hook: only exposed when explicitly opted-in via ?e2e=1 (no-op in production).
    if (typeof location !== 'undefined' && new URLSearchParams(location.search).get('e2e')) window.__puzzle = this;
    return this;
  }

  _wire() {
    this._disposers.push(this.engine.events.on('camera:change', () => {
      this.ui.setZoom(this.zoomPercent);
      if (!this._fitting) this._autoFit = false;
    }));
    this._disposers.push(this.engine.events.on('resize', ({ w, h }) => { if (this._autoFit && !this._fitting && w > 40 && h > 40) this.fitPage(); }));
    if (this._cssLink) this._cssLink.addEventListener('load', () => { if (this._autoFit) requestAnimationFrame(() => this.fitPage()); });
    [120, 400].forEach((ms) => setTimeout(() => { if (this._autoFit) this.fitPage(); }, ms));
  }

  _injectCss() {
    const id = 'pz-styles';
    if (document.getElementById(id)) return;
    this._cssLink = el('link', { id, attrs: { rel: 'stylesheet', href: new URL('./styles/puzzle-studio.css', import.meta.url).href } });
    document.head.appendChild(this._cssLink);
  }

  destroy() {
    this._disposers.splice(0).forEach((d) => { try { d(); } catch { /* ignore */ } });
    window.removeEventListener('keydown', this._onKey);
    clearInterval(this._timer.iv);
    clearTimeout(this._saveTimer);
    this.engine?.destroy();
    if (this.root?.parentNode) this.root.remove();
    if (this._cssLink?.parentNode) this._cssLink.remove();
  }

  // ---------- puzzle lifecycle ----------
  progressKey() { return this.model?.item ? `${this.model.item.id}:${this.model.rows}x${this.model.cols}` : '?'; }

  async startPuzzle(item, rows, cols, restorePieces = null) {
    await this.model.generate(item, rows, cols);
    if (restorePieces) this.model.applyPieceState(restorePieces);
    else { const p = this.storage.loadProgress(this.progressKey()); if (p) this.model.applyPieceState(p); }
    this.history.clear();
    this.timerReset();
    this._solvedShown = this.model.isSolved();
    this._autoFit = true;
    this.ui.hideSetup();
    this.ui.setPuzzleActive(true);
    this.ui.updateProgress();
    this.fitPage();
    this.requestSave();
  }

  // ---------- interaction glue ----------
  hitTopPiece(world) { return [...this.model.pieces].sort((a, b) => b.zIndex - a.zIndex).find((p) => p.hitTest(world)) || null; }

  commitMove() {
    if (!this.beforeState) return;
    const after = this.model.serialize();
    if (JSON.stringify(after.pieces) !== JSON.stringify(this.beforeState.pieces)) {
      this.timerStartIfNeeded();
      this.history.push(moveOp(this, this.beforeState, after));
    }
    this.beforeState = null;
    this.requestSave();
    this.ui.updateProgress();
    if (this.model.isSolved()) this.onSolved();
  }

  afterHistory() { this.ui.updateProgress(); this.requestSave(); if (this.model.isSolved()) this.onSolved(); }

  onSolved() {
    if (this._solvedShown) return;
    this._solvedShown = true;
    this.timerStop();
    this.ui.updateProgress();
    this.celebration.play();
    this.ui.toast('🎉 أكملت اللغز!');
    this.storage.clearProgress(this.progressKey());
  }

  // ---------- controls ----------
  undo() { this.history.undo(); }
  redo() { this.history.redo(); }
  hint() { this.model.hint(); }

  reshuffle() {
    const before = this.model.serialize();
    let z = 5000;
    for (const p of this.model.pieces) {
      if (p.placed) continue;
      p.groupId = z; p.zIndex = 10 + (z - 5000); z++;
      p.x = this.model.rad + Math.random() * (this.pageW - this.model.cw - 2 * this.model.rad);
      p.y = this.model.rad + Math.random() * (this.pageH - this.model.ch - 2 * this.model.rad);
    }
    this.model.engine.layers.active.markDirty();
    this.model.engine.invalidate();
    this.history.push(moveOp(this, before, this.model.serialize()));
    this.requestSave();
  }

  newPuzzle() { this.ui.showSetup(); }

  // ---------- view ----------
  get zoomPercent() { return Math.round(this.engine.camera.zoom * 100); }
  fitPage() {
    if (!this.model?.item) return;
    this._fitting = true;
    this.engine.viewport.resize(); // ensure the engine viewport matches the (async-styled) stage
    this.engine.fit({ x: 0, y: 0, w: this.pageW, h: this.pageH }, 30);
    const c = this.engine.camera; c.setHome(c.x, c.y, c.zoom);
    this.ui.setZoom(this.zoomPercent);
    this.engine.invalidate();
    this._fitting = false;
  }
  zoomBy(f) {
    this.engine.camera.zoomAt({ x: this.engine.viewport.width / 2, y: this.engine.viewport.height / 2 }, f, this.engine.coords);
    this.engine.invalidate();
    this.ui.setZoom(this.zoomPercent);
  }

  // ---------- timer ----------
  toggleTimer() { this.timerEnabled = !this.timerEnabled; if (!this.timerEnabled) this.timerStop(); this.ui.setTimerEnabled(this.timerEnabled); }
  timerStartIfNeeded() {
    if (!this.timerEnabled || this._timer.running || this._solvedShown) return;
    this._timer.running = true;
    this._timer.t0 = performance.now() - this._timer.elapsed * 1000;
    this._timer.iv = setInterval(() => this._tick(), 250);
  }
  timerStop() { this._timer.running = false; clearInterval(this._timer.iv); }
  timerReset() { this.timerStop(); this._timer.elapsed = 0; this.ui.setTimer(0); }
  _tick() { this._timer.elapsed = (performance.now() - this._timer.t0) / 1000; this.ui.setTimer(this._timer.elapsed); }

  // ---------- export ----------
  exportPNG() { exportPNG(this); this.ui.toast('تم تصدير PNG 🖼️'); }
  exportJPG() { exportJPG(this); this.ui.toast('تم تصدير JPG 📷'); }
  print() { printImage(this); }
  requestSave() { clearTimeout(this._saveTimer); this._saveTimer = setTimeout(() => this.storage.saveAuto(this), 600); }

  // ---------- keyboard ----------
  _bindKeys() {
    this._onKey = (e) => {
      if (/input|textarea/i.test(e.target.tagName)) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? this.redo() : this.undo(); }
      else if (meta && e.key.toLowerCase() === 'y') { e.preventDefault(); this.redo(); }
      else if (e.key.toLowerCase() === 'h') this.hint();
    };
    window.addEventListener('keydown', this._onKey);
  }
}
