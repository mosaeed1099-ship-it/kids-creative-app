/**
 * RenderLoop — requestAnimationFrame driver.
 * Calls a single tick(dt) callback with delta-time in seconds (clamped to
 * avoid huge jumps after the tab is backgrounded). Can be started/stopped and
 * supports an on-demand mode where frames are only drawn when invalidated.
 */
export default class RenderLoop {
  /** @param {(dt:number, now:number) => void} tick */
  constructor(tick, { onDemand = false } = {}) {
    this.tick = tick;
    this.onDemand = onDemand;
    this.running = false;
    this._raf = 0;
    this._last = 0;
    this._dirty = true;
    this._loop = this._loop.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._last = (typeof performance !== 'undefined' ? performance.now() : 0);
    this._raf = requestAnimationFrame(this._loop);
  }

  stop() {
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  /** Request a redraw when running in on-demand mode. */
  invalidate() { this._dirty = true; }

  _loop(now) {
    if (!this.running) return;
    let dt = (now - this._last) / 1000;
    this._last = now;
    if (dt < 0) dt = 0;
    if (dt > 0.1) dt = 0.1; // clamp ~10fps worst case

    if (!this.onDemand || this._dirty) {
      this._dirty = false;
      this.tick(dt, now);
    }
    this._raf = requestAnimationFrame(this._loop);
  }
}
