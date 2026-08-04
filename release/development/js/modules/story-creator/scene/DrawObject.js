/**
 * DrawObject.js — a full-page doodle layer. REUSES Free Draw Studio's
 * RasterLayer (bitmap + vector marks) and strokeRenderer, so drawing/undo logic
 * is not duplicated. Strokes are kept as marks (compact, replayable for save).
 */
import { SceneObject } from '../../../engine/index.js';
import { RasterLayer } from '../../free-draw/index.js';

export default class DrawObject extends SceneObject {
  constructor(app, props = {}) {
    super({ type: 'draw', x: 0, y: 0, width: app.PAGE_W, height: app.PAGE_H, anchor: { x: 0, y: 0 }, zIndex: props.z ?? 0, interactive: false });
    this.app = app;
    this.layer = new RasterLayer({ w: app.PAGE_W, h: app.PAGE_H });
    if (Array.isArray(props.marks) && props.marks.length) { this.layer.marks = props.marks.slice(); this.layer.repaint(); }
  }

  draw(ctx) {
    ctx.drawImage(this.layer.canvas, 0, 0);
    const as = this.app.activeStroke;
    if (as && as.layerObj === this) {
      ctx.save();
      ctx.globalAlpha = as.mark.opacity ?? 1;
      ctx.drawImage(as.temp.canvas, 0, 0);
      ctx.restore();
    }
  }

  serialize() { return { type: 'draw', z: this.zIndex, marks: this.layer.marks }; }
}
