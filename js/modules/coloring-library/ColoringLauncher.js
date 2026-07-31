/**
 * ColoringLauncher — opens the EXISTING Coloring Module (Phase 5) in a
 * fullscreen overlay when a library card is tapped. The library never
 * duplicates coloring logic; it just launches the real module.
 *
 * This file is the only place that imports ColoringApp, keeping the library
 * itself decoupled (the library calls a generic `onOpen(item)` callback, and
 * the example wires it to this launcher).
 */
import ColoringApp from '../coloring/index.js';

export default class ColoringLauncher {
  /**
   * @param {object} opts
   * @param {import('../../content/index.js').ContentManager} opts.content
   * @param {(item:any)=>string} opts.resolveAsset - maps item → artwork URL
   */
  constructor({ content, resolveAsset } = {}) {
    this.content = content;
    this.resolveAsset = resolveAsset;
    this.overlay = null;
    this.app = null;
  }

  async open(item) {
    this._ensureOverlay();
    this.overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    if (!this.app) {
      this.app = new ColoringApp({
        mount: this._stage,
        content: this.content,
        options: { resolveAsset: this.resolveAsset },
      });
      this.app.mount();
    }
    await this.app.openItem(item);
    return this.app;
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  _ensureOverlay() {
    if (this.overlay) return;
    const overlay = document.createElement('div');
    overlay.className = 'clrlib-launcher';
    const bar = document.createElement('div');
    bar.className = 'clrlib-launcher__bar';
    const back = document.createElement('button');
    back.className = 'clrlib-launcher__back';
    back.textContent = '◀ رجوع للمكتبة';
    back.addEventListener('click', () => this.close());
    bar.appendChild(back);
    const stage = document.createElement('div');
    stage.className = 'clrlib-launcher__stage';
    overlay.append(bar, stage);
    document.body.appendChild(overlay);
    this.overlay = overlay;
    this._stage = stage;
  }
}
