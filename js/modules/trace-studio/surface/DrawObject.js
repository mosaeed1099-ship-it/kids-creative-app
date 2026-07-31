/**
 * DrawObject — the drawing (trace) layer. Renders the TraceSurface paint canvas
 * at the page position, honoring the comparison mode (hidden in "before",
 * right-half in "split").
 */
import { SceneObject } from '../../../engine/index.js';
import { applySplitClip } from './compareClip.js';

export default class DrawObject extends SceneObject {
  constructor(state) {
    super({ type: 'drawing', interactive: false });
    this.state = state;
    this.surface = null;
  }

  setSurface(surface) {
    this.surface = surface;
    this.width = surface.width; this.height = surface.height;
    this.x = -surface.width / 2; this.y = -surface.height / 2;
    return this;
  }

  worldBounds() { return { x: this.x, y: this.y, w: this.width, h: this.height }; }

  render(ctx, engine) {
    if (!this.surface) return;
    const mode = this.state.compare || 'overlay';
    if (mode === 'before') return;               // reference only
    ctx.save();
    if (mode === 'split') applySplitClip(ctx, engine, 'right');
    ctx.drawImage(this.surface.paint, this.x, this.y);
    ctx.restore();
  }
}
