/**
 * ReferenceController — all reference-image transforms in one place:
 * scale, rotate, flip H/V, center, fit-to-screen, opacity, show/hide, lock.
 * Operates on a ReferenceObject; the studio calls these from the UI.
 */
export default class ReferenceController {
  constructor({ ref, engine, onChange = () => {} }) {
    this.ref = ref;
    this.engine = engine;
    this.onChange = onChange;
  }

  _changed() { this.engine.invalidate(); this.onChange(this.ref); }

  setOpacity(v) { this.ref.opacity = Math.max(0, Math.min(1, v)); this._changed(); }
  toggleVisible(v) { this.ref.visible = v == null ? !this.ref.visible : !!v; this._changed(); return this.ref.visible; }
  toggleLock(v) { this.ref.locked = v == null ? !this.ref.locked : !!v; this.onChange(this.ref); return this.ref.locked; }

  scaleBy(f) { this.ref.scale = Math.max(0.1, Math.min(6, this.ref.scale * f)); this._changed(); }
  setScale(s) { this.ref.scale = Math.max(0.1, Math.min(6, s)); this._changed(); }
  rotateBy(deg) { this.ref.rotation += (deg * Math.PI) / 180; this._changed(); }
  setRotation(deg) { this.ref.rotation = (deg * Math.PI) / 180; this._changed(); }

  flipHorizontal() { this.ref.flipH = !this.ref.flipH; this._changed(); }
  flipVertical() { this.ref.flipV = !this.ref.flipV; this._changed(); }

  center() { this.ref.x = 0; this.ref.y = 0; this._changed(); }

  /** Fit the reference to the viewport and center it. */
  fit(padding = 60) {
    const vw = this.engine.viewport.width - padding * 2;
    const vh = this.engine.viewport.height - padding * 2;
    const zoom = this.engine.camera.zoom;
    // scale so the image fills the visible world area comfortably
    const targetW = vw / zoom, targetH = vh / zoom;
    this.ref.scale = Math.min(targetW / this.ref.imgW, targetH / this.ref.imgH);
    this.ref.rotation = 0; this.ref.flipH = false; this.ref.flipV = false;
    this.ref.x = 0; this.ref.y = 0;
    this._changed();
  }
}
