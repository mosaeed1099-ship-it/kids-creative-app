/**
 * Camera — 2D view transform (pan + zoom) over an infinite world.
 *
 * Convention: (x, y) is the WORLD point shown at the CENTER of the viewport,
 * `zoom` is world→screen scale. This makes zoom-to-cursor and centering easy.
 *
 * The camera is transform math only; the engine applies it to the context and
 * uses CoordinateSystem for conversions.
 */
export default class Camera {
  constructor({ events = null } = {}) {
    this.events = events;
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.minZoom = 0.1;
    this.maxZoom = 8;
    this._home = { x: 0, y: 0, zoom: 1 };
  }

  /** Remember a "home" view used by reset(). */
  setHome(x = this.x, y = this.y, zoom = this.zoom) {
    this._home = { x, y, zoom };
    return this;
  }

  _clampZoom(z) {
    return Math.min(this.maxZoom, Math.max(this.minZoom, z));
  }

  _changed() {
    this.events?.emit('camera:change', this);
  }

  /** Move the camera by a delta in SCREEN pixels (e.g. a drag). */
  panBy(dxScreen, dyScreen) {
    this.x -= dxScreen / this.zoom;
    this.y -= dyScreen / this.zoom;
    this._changed();
    return this;
  }

  /** Center the camera on a world point. */
  centerOn(wx, wy) {
    this.x = wx; this.y = wy; this._changed();
    return this;
  }

  setZoom(z) {
    this.zoom = this._clampZoom(z);
    this._changed();
    return this;
  }

  /**
   * Zoom by `factor` while keeping the given SCREEN point anchored.
   * Needs the CoordinateSystem to map screen↔world.
   */
  zoomAt(screenPt, factor, coords) {
    const before = coords.screenToWorld(screenPt.x, screenPt.y);
    this.zoom = this._clampZoom(this.zoom * factor);
    const after = coords.screenToWorld(screenPt.x, screenPt.y);
    // shift camera so the world point under the cursor stays put
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this._changed();
    return this;
  }

  /** Restore the home view. */
  reset() {
    this.x = this._home.x;
    this.y = this._home.y;
    this.zoom = this._home.zoom;
    this._changed();
    return this;
  }

  toJSON() { return { x: this.x, y: this.y, zoom: this.zoom }; }
  fromJSON(o = {}) {
    if (o.x != null) this.x = o.x;
    if (o.y != null) this.y = o.y;
    if (o.zoom != null) this.zoom = this._clampZoom(o.zoom);
    this._changed();
    return this;
  }
}
