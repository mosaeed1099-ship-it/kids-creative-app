/**
 * Toolbar.js — the vertical tool rail: seven brushes, shapes, eyedropper,
 * selection and hand. Big touch targets; highlights the active tool.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';
import { PROFILES, BRUSH_ORDER } from '../brushes/brushProfiles.js';

export default class Toolbar {
  constructor(app) { this.app = app; }

  build() {
    this.buttons = new Map();
    const rail = el('div', { class: 'fd-rail', attrs: { role: 'toolbar', 'aria-label': 'الأدوات' } });

    const add = (id, emoji, label) => {
      const b = iconBtn({ emoji, label, title: label, onClick: () => this.app.setTool(id) });
      this.buttons.set(id, b);
      rail.append(b);
    };

    BRUSH_ORDER.forEach((id) => add(id, PROFILES[id].emoji, PROFILES[id].label));
    rail.append(el('div', { class: 'fd-rail__sep' }));
    add('shape', '⬛', 'أشكال');
    add('eyedropper', '💧', 'قطّارة');
    add('select', '⬚', 'تحديد');
    add('hand', '✋', 'تحريك');

    this.el = rail;
    this.refresh();
    return rail;
  }

  refresh() {
    const cur = this.app.activeToolId();
    for (const [id, btn] of this.buttons) {
      const active = id === cur;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }
}
