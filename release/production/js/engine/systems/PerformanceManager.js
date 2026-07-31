/**
 * PerformanceManager — measures frame timing and exposes live stats so
 * modules and debug overlays can react (e.g. lower quality under load).
 *
 * stats: { fps, frameMs, avgFrameMs, frames, objects, dpr }
 */
export default class PerformanceManager {
  constructor({ engine } = {}) {
    this.engine = engine;
    this.frames = 0;
    this.fps = 0;
    this.frameMs = 0;
    this.avgFrameMs = 0;
    this._t0 = 0;
    this._acc = 0;
    this._count = 0;
    this._fpsWindowStart = (typeof performance !== 'undefined' ? performance.now() : 0);
    this._fpsWindowFrames = 0;
  }

  begin() {
    this._t0 = (typeof performance !== 'undefined' ? performance.now() : 0);
  }

  end() {
    const now = (typeof performance !== 'undefined' ? performance.now() : 0);
    this.frameMs = now - this._t0;
    this.frames += 1;
    this._acc += this.frameMs;
    this._count += 1;
    if (this._count >= 30) { this.avgFrameMs = this._acc / this._count; this._acc = 0; this._count = 0; }

    // fps over a ~500ms window
    this._fpsWindowFrames += 1;
    const elapsed = now - this._fpsWindowStart;
    if (elapsed >= 500) {
      this.fps = Math.round((this._fpsWindowFrames * 1000) / elapsed);
      this._fpsWindowStart = now;
      this._fpsWindowFrames = 0;
    }
  }

  stats() {
    return {
      fps: this.fps,
      frameMs: +this.frameMs.toFixed(2),
      avgFrameMs: +this.avgFrameMs.toFixed(2),
      frames: this.frames,
      objects: this.engine?.objects?.count?.() ?? 0,
      dpr: this.engine?.viewport?.dpr ?? 1,
    };
  }
}
