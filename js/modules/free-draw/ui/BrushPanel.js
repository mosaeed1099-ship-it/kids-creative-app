/**
 * BrushPanel.js — size / opacity / hardness sliders with a live preview that
 * renders a real sample stroke of the current tool, colour and settings using
 * the shared strokeRenderer (so the preview always matches the canvas).
 */
import { el } from '../../../utils/dom.js';
import { section, slider } from './helpers.js';
import { makeStrokeMark } from '../marks/Mark.js';
import { paintStroke, compositeScratch, releaseSprite } from '../brushes/strokeRenderer.js';
import { getProfile } from '../brushes/brushProfiles.js';

export default class BrushPanel {
  constructor(app) { this.app = app; }

  build() {
    const s = this.app.settings;
    this.preview = el('canvas', { class: 'fd-brush-preview', attrs: { width: 300, height: 84 } });

    this.sizeS = slider({ label: 'الحجم', min: 1, max: 160, value: s.get('size'),
      onInput: (v) => { this.app.settings.set('size', v); this.drawPreview(); } });
    this.opacityS = slider({ label: 'الشفافية', min: 5, max: 100, suffix: '%', value: Math.round(s.get('opacity') * 100),
      onInput: (v) => { this.app.settings.set('opacity', v / 100); this.drawPreview(); } });
    this.hardnessS = slider({ label: 'الحِدّة', min: 0, max: 100, suffix: '%', value: Math.round(s.get('hardness') * 100),
      onInput: (v) => { this.app.settings.set('hardness', v / 100); this.drawPreview(); } });

    this.el = section('الفرشاة', '🖌️', [
      el('div', { class: 'fd-brush-preview-wrap' }, [this.preview]),
      this.sizeS, this.opacityS, this.hardnessS,
    ]);
    this.drawPreview();
    return this.el;
  }

  refresh() {
    const s = this.app.settings;
    this.sizeS.setValue(s.get('size'));
    this.opacityS.setValue(Math.round(s.get('opacity') * 100));
    this.hardnessS.setValue(Math.round(s.get('hardness') * 100));
    this.drawPreview();
  }

  drawPreview() {
    const ctx = this.preview.getContext('2d');
    const W = this.preview.width, H = this.preview.height;
    ctx.clearRect(0, 0, W, H);
    const s = this.app.settings;
    const toolId = ['pencil', 'brush', 'marker', 'crayon', 'calligraphy', 'airbrush', 'eraser'].includes(s.get('tool')) ? s.get('tool') : 'brush';
    const profile = getProfile(toolId);
    // eraser preview: show on a coloured band so erasing reads clearly
    if (profile.composite === 'destination-out') {
      ctx.fillStyle = this.app.colors.get(); ctx.fillRect(0, H / 2 - 18, W, 36);
    }
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      pts.push({ x: 16 + t * (W - 32), y: H / 2 + Math.sin(t * Math.PI * 2) * 20, p: 0.25 + 0.75 * Math.sin(t * Math.PI) });
    }
    const mark = makeStrokeMark({
      profileId: toolId, color: profile.composite === 'destination-out' ? '#000000' : this.app.colors.get(),
      size: Math.min(s.get('size'), 60), opacity: s.get('opacity'), hardness: s.get('hardness'), points: pts,
    });
    const scratch = document.createElement('canvas');
    scratch.width = W; scratch.height = H;
    paintStroke(scratch.getContext('2d'), mark);
    compositeScratch(ctx, scratch, mark);
    releaseSprite(mark);
  }
}
