/**
 * BucketFillTool — flood-fills the tapped region with the current color.
 * Extends the engine ITool; consumes pointer events so it never pans.
 */
import { ITool } from '../../../engine/index.js';

export default class BucketFillTool extends ITool {
  constructor(app) { super('bucket'); this.app = app; }

  onPointerDown(p) {
    const local = this.app.toLocalPixel(p.world);
    const before = this.app.surface.snapshot();
    const changed = this.app.surface.fill(local.x, local.y, this.app.color);
    if (changed) this.app.commitFrom(before, 'Fill');
    else this.app.engine.invalidate();
    return true; // consume
  }
}
