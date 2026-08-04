/**
 * TextEditor.js — modal to edit a text object: content, font family/size/colour,
 * bold/italic/underline, alignment, RTL/LTR (emoji works via the OS font). Edits
 * preview live; the whole edit is committed as one undo step on "تم".
 */
import { el } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

const FAMILIES = [
  { v: 'system-ui', n: 'افتراضي' },
  { v: '"Noto Kufi Arabic", system-ui', n: 'كوفي' },
  { v: 'Tahoma, system-ui', n: 'Tahoma' },
  { v: 'Georgia, serif', n: 'Serif' },
  { v: '"Comic Sans MS", system-ui', n: 'مرِح' },
];

export default class TextEditor {
  constructor(app) { this.app = app; }

  open(obj) {
    const a = this.app;
    const before = a.objState(obj);
    const live = (p) => { obj.setText(p); a.engine.invalidate(); };

    const ta = el('textarea', { class: 'st-ta', attrs: { dir: obj.dir, rows: '3', 'aria-label': 'النص' }, on: { input: () => live({ text: ta.value }) } });
    ta.value = obj.text;

    const family = el('select', { class: 'st-sel', on: { change: () => live({ family: family.value }) } },
      FAMILIES.map((f) => el('option', { attrs: { value: f.v, ...(obj.family === f.v ? { selected: 'selected' } : {}) }, text: f.n })));
    const size = el('input', { attrs: { type: 'range', min: '18', max: '150', value: String(obj.size) }, on: { input: () => live({ size: +size.value }) } });
    const color = el('input', { attrs: { type: 'color', value: obj.color }, on: { input: () => live({ color: color.value }) } });

    const toggle = (key, emoji, label) => { const b = iconBtn({ emoji, label, active: obj[key], onClick: () => { live({ [key]: !obj[key] }); b.classList.toggle('is-active', obj[key]); } }); return b; };
    const alignRow = el('div', { class: 'st-inline' });
    ['right', 'center', 'left'].forEach((al) => {
      const b = iconBtn({ label: al === 'right' ? 'يمين' : al === 'center' ? 'وسط' : 'يسار', active: obj.align === al, onClick: () => { live({ align: al }); [...alignRow.children].forEach((c) => c.classList.remove('is-active')); b.classList.add('is-active'); } });
      alignRow.append(b);
    });
    const dirBtn = iconBtn({ emoji: '🔁', label: obj.dir === 'rtl' ? 'RTL' : 'LTR', onClick: () => { const d = obj.dir === 'rtl' ? 'ltr' : 'rtl'; live({ dir: d }); ta.setAttribute('dir', d); dirBtn.querySelector('.st-btn__label').textContent = d.toUpperCase(); } });

    const overlay = el('div', { class: 'st-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'تحرير النص' } }, [
      el('div', { class: 'st-modal__box' }, [
        el('div', { class: 'st-modal__head' }, [el('h2', { text: '🔤 النص' })]),
        ta,
        el('div', { class: 'st-inline' }, [el('label', { class: 'st-field' }, ['الخط', family]), el('label', { class: 'st-field' }, ['اللون', color])]),
        el('label', { class: 'st-field' }, ['الحجم', size]),
        el('div', { class: 'st-inline' }, [toggle('bold', 'ب', 'عريض'), toggle('italic', 'م', 'مائل'), toggle('underline', 'ت', 'تسطير'), dirBtn]),
        el('div', { class: 'st-inline' }, [el('span', { class: 'st-mini', text: 'المحاذاة:' }), alignRow]),
        el('div', { class: 'st-modal__foot' }, [
          iconBtn({ emoji: '✅', label: 'تم', cls: 'st-primary', onClick: () => { a.commitObjectChange(before); overlay.remove(); } }),
          iconBtn({ emoji: '✖️', label: 'إلغاء', onClick: () => { a.applyObjState(obj, before); a.engine.invalidate(); overlay.remove(); } }),
        ]),
      ]),
    ]);
    a.ui.root.append(overlay);
    ta.focus(); ta.select();
  }
}
