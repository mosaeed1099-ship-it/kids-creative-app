/**
 * SelectionBar.js — floating actions shown while a selection is active:
 * flip horizontal/vertical, rotate 90°, delete, and confirm (commit).
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class SelectionBar {
  constructor(app) { this.app = app; }

  build() {
    const sel = () => this.app.selection;
    this.el = el('div', { class: 'fd-selbar', attrs: { hidden: 'true', role: 'toolbar', 'aria-label': 'أدوات التحديد' } }, [
      iconBtn({ emoji: '↔️', title: 'قلب أفقي', onClick: () => sel().flipH() }),
      iconBtn({ emoji: '↕️', title: 'قلب رأسي', onClick: () => sel().flipV() }),
      iconBtn({ emoji: '🔄', title: 'تدوير 90°', onClick: () => sel().rotate90() }),
      iconBtn({ emoji: '🗑️', title: 'حذف', onClick: () => sel().deleteSelection() }),
      iconBtn({ emoji: '✅', label: 'تم', title: 'تثبيت', cls: 'fd-selbar__ok', onClick: () => sel().commit() }),
    ]);
    return this.el;
  }

  setActive(on) { this.el.toggleAttribute('hidden', !on); }
}
