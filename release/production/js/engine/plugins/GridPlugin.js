/**
 * GridPlugin — an OPTIONAL example plugin that draws a world-space grid.
 * It contains no product/feature logic — it's a generic engine aid used to
 * demonstrate the plugin render hook. Disabled unless installed & enabled.
 */
import IPlugin from '../interfaces/IPlugin.js';

export default class GridPlugin extends IPlugin {
  constructor({ size = 50, color = 'rgba(120,130,180,.18)', axis = 'rgba(120,130,180,.4)' } = {}) {
    super('grid');
    this.size = size;
    this.color = color;
    this.axis = axis;
  }

  render(ctx, engine) {
    const { camera, viewport } = engine;
    // Visible world rectangle (with a little padding).
    const halfW = viewport.width / 2 / camera.zoom;
    const halfH = viewport.height / 2 / camera.zoom;
    const left = camera.x - halfW;
    const right = camera.x + halfW;
    const top = camera.y - halfH;
    const bottom = camera.y + halfH;

    const step = this.size;
    const startX = Math.floor(left / step) * step;
    const startY = Math.floor(top / step) * step;

    ctx.save();
    ctx.lineWidth = 1 / camera.zoom;
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (let x = startX; x <= right; x += step) { ctx.moveTo(x, top); ctx.lineTo(x, bottom); }
    for (let y = startY; y <= bottom; y += step) { ctx.moveTo(left, y); ctx.lineTo(right, y); }
    ctx.stroke();

    // origin axes
    ctx.strokeStyle = this.axis;
    ctx.beginPath();
    ctx.moveTo(left, 0); ctx.lineTo(right, 0);
    ctx.moveTo(0, top); ctx.lineTo(0, bottom);
    ctx.stroke();
    ctx.restore();
  }
}
