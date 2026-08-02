/**
 * ColorWheel.js — an HSV colour wheel: an outer hue ring plus an inner
 * saturation/value square. Pointer-driven (mouse/touch/pen). Emits a hex colour
 * on every change and can be set from outside (recents, eyedropper, inputs).
 */
import { el } from '../../../utils/dom.js';
import { hsvToHex, hexToHsv } from '../color/colorConvert.js';
import { TAU } from '../util/geometry.js';

export default class ColorWheel {
  constructor({ size = 208, onPick = null } = {}) {
    this.size = size;
    this.onPick = onPick;
    this.hsv = { h: 0, s: 90, v: 100 };
    this.R = size / 2 - 2;
    this.T = Math.round(size * 0.13);
    this.Ri = this.R - this.T;
    this.half = this.Ri * 0.7;
  }

  build() {
    this.canvas = el('canvas', { class: 'fd-wheel', attrs: { width: this.size, height: this.size } });
    this.ctx = this.canvas.getContext('2d');
    this._bind();
    this.draw();
    return this.canvas;
  }

  setColor(hex) {
    const hsv = hexToHsv(hex);
    if (hsv) { this.hsv = hsv; this.draw(); }
  }

  _sqRect() {
    const c = this.size / 2;
    return { x: c - this.half, y: c - this.half, s: this.half * 2 };
  }

  draw() {
    const ctx = this.ctx;
    const c = this.size / 2;
    ctx.clearRect(0, 0, this.size, this.size);

    // hue ring
    const rMid = (this.Ri + this.R) / 2;
    ctx.lineWidth = this.T;
    for (let a = 0; a < 360; a += 1) {
      ctx.beginPath();
      ctx.strokeStyle = `hsl(${a},100%,50%)`;
      ctx.arc(c, c, rMid, (a - 0.6) * Math.PI / 180, (a + 1.2) * Math.PI / 180);
      ctx.stroke();
    }

    // SV square for current hue
    const r = this._sqRect();
    ctx.fillStyle = hsvToHex({ h: this.hsv.h, s: 100, v: 100 });
    ctx.fillRect(r.x, r.y, r.s, r.s);
    let g = ctx.createLinearGradient(r.x, 0, r.x + r.s, 0);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.s, r.s);
    g = ctx.createLinearGradient(0, r.y, 0, r.y + r.s);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, '#000000');
    ctx.fillStyle = g; ctx.fillRect(r.x, r.y, r.s, r.s);

    // markers
    const ha = this.hsv.h * Math.PI / 180;
    ctx.beginPath();
    ctx.arc(c + Math.cos(ha) * rMid, c + Math.sin(ha) * rMid, this.T / 2 - 1, 0, TAU);
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.stroke();

    const mx = r.x + (this.hsv.s / 100) * r.s;
    const my = r.y + (1 - this.hsv.v / 100) * r.s;
    ctx.beginPath(); ctx.arc(mx, my, 7, 0, TAU);
    ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
    ctx.lineWidth = 1.5; ctx.strokeStyle = '#000'; ctx.stroke();
  }

  _bind() {
    let mode = null;
    const pick = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (this.size / rect.width);
      const y = (e.clientY - rect.top) * (this.size / rect.height);
      const c = this.size / 2;
      const dx = x - c, dy = y - c;
      const d = Math.hypot(dx, dy);
      if (mode === null) mode = (d <= this.half * 1.42 && Math.abs(dx) <= this.half && Math.abs(dy) <= this.half) ? 'sv' : 'hue';
      if (mode === 'hue') {
        this.hsv.h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
      } else {
        const r = this._sqRect();
        this.hsv.s = Math.max(0, Math.min(100, ((x - r.x) / r.s) * 100));
        this.hsv.v = Math.max(0, Math.min(100, (1 - (y - r.y) / r.s) * 100));
      }
      this.draw();
      this.onPick?.(hsvToHex(this.hsv));
    };
    this.canvas.addEventListener('pointerdown', (e) => {
      this.canvas.setPointerCapture(e.pointerId); mode = null; pick(e);
    });
    this.canvas.addEventListener('pointermove', (e) => { if (e.buttons) pick(e); });
    this.canvas.addEventListener('pointerup', () => { mode = null; });
    this.canvas.style.touchAction = 'none';
  }
}
