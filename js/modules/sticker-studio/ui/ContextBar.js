/**
 * ContextBar.js — floating actions for the selected sticker: flip H/V, bring to
 * front, send to back, duplicate, delete. Hidden when nothing is selected.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class ContextBar {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    this.el = el('div', { class: 'ss-contextbar', attrs: { hidden: 'true', role: 'toolbar', 'aria-label': 'أدوات الملصق' } }, [
      iconBtn({ emoji: '↔️', title: 'قلب أفقي', onClick: () => a.flipSelected('h') }),
      iconBtn({ emoji: '↕️', title: 'قلب رأسي', onClick: () => a.flipSelected('v') }),
      iconBtn({ emoji: '⏫', title: 'إلى الأمام', onClick: () => a.reorderSelected('front') }),
      iconBtn({ emoji: '⏬', title: 'إلى الخلف', onClick: () => a.reorderSelected('back') }),
      iconBtn({ emoji: '📑', title: 'تكرار', onClick: () => a.duplicateSelected() }),
      iconBtn({ emoji: '🗑️', title: 'حذف', cls: 'ss-danger', onClick: () => a.deleteSelected() }),
    ]);
    return this.el;
  }

  setActive(on) { this.el.toggleAttribute('hidden', !on); }
}
