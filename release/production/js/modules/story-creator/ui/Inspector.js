/**
 * Inspector.js — floating actions for the selected object: edit (text) / crop
 * (image) / fill+stroke (shape), flip, layer order, duplicate, delete.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class Inspector {
  constructor(app) { this.app = app; }
  build() { this.el = el('div', { class: 'st-inspector', attrs: { hidden: 'true', role: 'toolbar', 'aria-label': 'أدوات العنصر' } }); return this.el; }

  _colorInput(label, value, onChange) {
    const inp = el('input', { class: 'st-color', attrs: { type: 'color', value, 'aria-label': label }, on: { change: (e) => onChange(e.target.value) } });
    return el('label', { class: 'st-field st-field--sm' }, [label, inp]);
  }

  show(obj) {
    if (!obj) { this.el.setAttribute('hidden', 'true'); this.el.replaceChildren(); return; }
    this.el.removeAttribute('hidden');
    const a = this.app; const kids = [];
    if (obj.type === 'text') kids.push(iconBtn({ emoji: '✏️', label: 'تحرير', onClick: () => a.ui.openTextEditor(obj) }));
    if (obj.type === 'image') kids.push(iconBtn({ emoji: '✂️', label: 'قص', onClick: () => a.ui.openCrop(obj) }));
    if (obj.type === 'shape') {
      kids.push(this._colorInput('تعبئة', obj.fill, (v) => { const b = a.objState(obj); obj.fill = v; a.commitObjectChange(b); }));
      kids.push(this._colorInput('حدّ', obj.stroke, (v) => { const b = a.objState(obj); obj.stroke = v; a.commitObjectChange(b); }));
    }
    kids.push(iconBtn({ emoji: '↔️', title: 'قلب أفقي', onClick: () => a.flipSelected('h') }));
    kids.push(iconBtn({ emoji: '↕️', title: 'قلب رأسي', onClick: () => a.flipSelected('v') }));
    kids.push(iconBtn({ emoji: '⏫', title: 'للأمام', onClick: () => a.reorderSelected('front') }));
    kids.push(iconBtn({ emoji: '⏬', title: 'للخلف', onClick: () => a.reorderSelected('back') }));
    kids.push(iconBtn({ emoji: '📑', title: 'تكرار', onClick: () => a.duplicateSelected() }));
    kids.push(iconBtn({ emoji: '🗑️', title: 'حذف', cls: 'st-danger', onClick: () => a.deleteSelected() }));
    this.el.replaceChildren(...kids);
  }

  refresh() { if (this.app.selected) this.show(this.app.selected); }
}
