/**
 * Viewport — owns the <canvas>, handles High-DPI sizing and responsive
 * resizing via ResizeObserver. All drawing happens on its 2D context.
 *
 * Sizes:
 *   width / height  → CSS pixels (logical)
 *   canvas.width/.height → device pixels (logical * dpr)
 */
export default class Viewport {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.container - element the canvas fills
   * @param {string|null} [opts.background] - CSS color to clear to (null = transparent)
   * @param {number} [opts.maxDPR] - cap devicePixelRatio for performance
   */
  constructor({ container, background = null, maxDPR = 3 }) {
    this.container = container;
    this.background = background;
    this.maxDPR = maxDPR;

    this.canvas = document.createElement('canvas');
    this.canvas.className = 'kcs-engine-canvas';
    this.canvas.style.display = 'block';
    this.canvas.style.touchAction = 'none'; // we handle gestures ourselves
    this.ctx = this.canvas.getContext('2d');

    this.dpr = 1;
    this.width = 0;
    this.height = 0;

    this._ro = null;
    this.onResize = null; // set by the engine
  }

  mount() {
    this.container.appendChild(this.canvas);
    this.resize();
    if ('ResizeObserver' in window) {
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(this.container);
    } else {
      this._winResize = () => this.resize();
      window.addEventListener('resize', this._winResize);
    }
    return this;
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    this.width = Math.max(1, Math.floor(rect.width));
    this.height = Math.max(1, Math.floor(rect.height));
    this.dpr = Math.min(this.maxDPR, Math.max(1, window.devicePixelRatio || 1));

    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);

    if (this.onResize) this.onResize(this.width, this.height, this.dpr);
  }

  /** Clear the whole device surface, optionally painting the background. */
  clear() {
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.background) {
      c.fillStyle = this.background;
      c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  rect() {
    return this.canvas.getBoundingClientRect();
  }

  destroy() {
    if (this._ro) this._ro.disconnect();
    if (this._winResize) window.removeEventListener('resize', this._winResize);
    if (this.canvas.parentNode) this.canvas.remove();
  }
}
