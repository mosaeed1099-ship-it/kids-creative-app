/**
 * DividerPlugin — draws the split line down the middle of the viewport when the
 * studio is in "split" comparison mode. A Canvas-Engine IPlugin overlay.
 */
import { IPlugin } from '../../../engine/index.js';

export default class DividerPlugin extends IPlugin {
  constructor(state) { super('trace-divider'); this.state = state; }

  render(ctx, engine) {
    if ((this.state.compare || 'overlay') !== 'split') return;
    const cam = engine.camera;
    const halfH = engine.viewport.height / 2 / cam.zoom + 40;
    ctx.save();
    ctx.strokeStyle = '#5b6bff';
    ctx.lineWidth = 3 / cam.zoom;
    ctx.setLineDash([10 / cam.zoom, 8 / cam.zoom]);
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y - halfH);
    ctx.lineTo(cam.x, cam.y + halfH);
    ctx.stroke();
    ctx.restore();
  }
}
