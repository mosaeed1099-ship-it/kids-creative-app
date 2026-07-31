/**
 * SelectionPlugin — draws the selection box and the rotate / scale handles for
 * the currently selected part. A Canvas-Engine IPlugin overlay (world space);
 * handle sizes stay constant on screen by dividing by the camera zoom.
 */
import { IPlugin } from '../../../engine/index.js';

export default class SelectionPlugin extends IPlugin {
  constructor(engineSelection) { super('cs-selection'); this.selection = engineSelection; }

  render(ctx, engine) {
    const sel = this.selection.items[0];
    if (!sel) return;
    const z = engine.camera.zoom;
    const cs = sel.cornersWorld();
    const H = sel.handles(z);

    ctx.save();
    // dashed bounding box
    ctx.lineWidth = 2 / z;
    ctx.strokeStyle = '#5b6bff';
    ctx.setLineDash([8 / z, 6 / z]);
    ctx.beginPath();
    ctx.moveTo(cs[0].x, cs[0].y);
    for (let i = 1; i < cs.length; i++) ctx.lineTo(cs[i].x, cs[i].y);
    ctx.closePath();
    ctx.stroke();

    // rotate handle stem + knob
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(H.topMid.x, H.topMid.y); ctx.lineTo(H.rotate.x, H.rotate.y); ctx.stroke();
    this._knob(ctx, H.rotate, 11 / z, '#57c98a');
    // scale handle
    this._knob(ctx, H.scale, 11 / z, '#ff9a3d');
    ctx.restore();
  }

  _knob(ctx, p, r, color) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = r * 0.35; ctx.strokeStyle = color; ctx.stroke();
  }
}
