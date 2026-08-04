/**
 * ShapePanel.js — pick a shape, toggle fill, and set polygon sides. Selecting a
 * shape also activates the shape tool. Only shown while the shape tool is active.
 */
import { el, clear } from '../../../utils/dom.js';
import { section, iconBtn, slider } from './helpers.js';
import { SHAPES } from '../shapes/shapeGeometry.js';

export default class ShapePanel {
  constructor(app) { this.app = app; }

  build() {
    this.grid = el('div', { class: 'fd-shape-grid' });
    this.fillBtn = iconBtn({ emoji: '🪣', label: 'تعبئة', title: 'تعبئة الشكل باللون',
      onClick: () => { this.app.settings.set('shapeFill', !this.app.settings.get('shapeFill')); this.refresh(); } });
    this.sidesS = slider({ label: 'عدد الأضلاع', min: 3, max: 12, value: this.app.settings.get('sides'),
      onInput: (v) => this.app.settings.set('sides', v) });

    this.el = section('الأشكال', '⬛', [this.grid, el('div', { class: 'fd-shape-opts' }, [this.fillBtn, this.sidesS])]);
    this._buildGrid();
    this.refresh();
    return this.el;
  }

  _buildGrid() {
    clear(this.grid);
    for (const sh of SHAPES) {
      this.grid.append(iconBtn({
        emoji: sh.emoji, label: sh.label, title: sh.label,
        cls: 'fd-shape-btn',
        onClick: () => { this.app.settings.set('shape', sh.id); this.app.setTool('shape'); this.refresh(); },
      }));
    }
  }

  refresh() {
    const cur = this.app.settings.get('shape');
    [...this.grid.children].forEach((btn, i) => {
      const active = SHAPES[i].id === cur;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    this.fillBtn.classList.toggle('is-active', this.app.settings.get('shapeFill'));
    this.sidesS.setValue(this.app.settings.get('sides'));
    this.sidesS.style.display = cur === 'polygon' ? '' : 'none';
  }
}
