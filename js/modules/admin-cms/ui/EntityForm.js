/**
 * EntityForm.js — one modal form that renders ANY section from its field schema
 * (localized text, tags, select, number, bool, emoji, pack/category pickers, and
 * file/emoji asset upload). Used by every editor → no duplicated form code.
 */
import { el } from '../../../utils/dom.js';
import { btn, localized, assetThumb } from './helpers.js';
import { readAssetFile } from '../io/upload.js';
import { putUploadedAsset } from '../io/assets.js';

export default class EntityForm {
  constructor(app) { this.app = app; }

  open(section, existing = null) {
    const a = this.app;
    const isEdit = !!existing;
    const values = existing ? JSON.parse(JSON.stringify(existing)) : section.defaults();
    const close = () => overlay.remove();
    const rows = section.fields.map((f) => this._field(f, values));

    const overlay = el('div', { class: 'cms-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': isEdit ? 'تعديل' : 'إضافة' } }, [
      el('div', { class: 'cms-modal__box' }, [
        el('div', { class: 'cms-modal__head' }, [el('h2', { text: `${isEdit ? '✏️ تعديل' : '➕ إضافة'} — ${section.label}` }), btn({ emoji: '✖️', title: 'إغلاق', onClick: close })]),
        el('div', { class: 'cms-form' }, rows),
        el('div', { class: 'cms-modal__foot' }, [
          btn({ emoji: '💾', label: 'حفظ', cls: 'cms-primary', onClick: () => { let out = values; if (section.beforeSave) out = section.beforeSave(out) || out; a.saveEntity(section, out, existing ? existing.id : null); close(); } }),
          btn({ emoji: '✖️', label: 'إلغاء', onClick: close }),
        ]),
      ]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    a.ui.root.append(overlay);
  }

  _field(f, values) {
    const a = this.app;
    const set = (v) => { values[f.key] = v; };
    let control;
    if (f.type === 'localized') {
      const mk = (lang, dir, ph) => { const i = el(f.multiline ? 'textarea' : 'input', { class: 'cms-input', attrs: { dir, placeholder: ph } }); i.value = (values[f.key] && values[f.key][lang]) || ''; i.addEventListener('input', () => { values[f.key] = { ...(values[f.key] || {}), [lang]: i.value }; }); return i; };
      control = el('div', { class: 'cms-inline' }, [mk('ar', 'rtl', 'عربي'), mk('en', 'ltr', 'English')]);
    } else if (f.type === 'text') {
      const i = el('input', { class: 'cms-input', attrs: { dir: 'auto' } }); i.value = values[f.key] || ''; i.addEventListener('input', () => set(i.value)); control = i;
    } else if (f.type === 'emoji') {
      const i = el('input', { class: 'cms-input cms-input--emoji', attrs: { maxlength: '4' } }); i.value = values[f.key] || ''; i.addEventListener('input', () => set(i.value)); control = i;
    } else if (f.type === 'number') {
      const i = el('input', { class: 'cms-input', attrs: { type: 'number', min: '0' } }); i.value = values[f.key] ?? ''; i.addEventListener('input', () => set(+i.value || 0)); control = i;
    } else if (f.type === 'bool') {
      const i = el('input', { attrs: { type: 'checkbox' } }); i.checked = !!values[f.key]; i.addEventListener('change', () => set(i.checked)); control = el('label', { class: 'cms-check' }, [i, ' نعم']);
    } else if (f.type === 'tags') {
      const i = el('input', { class: 'cms-input', attrs: { placeholder: 'افصل بفواصل: قطة، حيوان' } }); i.value = (values[f.key] || []).join('، '); i.addEventListener('change', () => set(i.value.split(/[،,]+/).map((s) => s.trim()).filter(Boolean))); control = i;
    } else if (f.type === 'select') {
      const s = el('select', { class: 'cms-input' }, f.options.map(([v, l]) => el('option', { attrs: { value: v, ...(values[f.key] === v ? { selected: 'selected' } : {}) }, text: l }))); s.addEventListener('change', () => set(s.value)); control = s;
    } else if (f.type === 'pack' || f.type === 'category') {
      const coll = f.type === 'pack' ? 'packs' : 'categories';
      const opts = [el('option', { attrs: { value: '' }, text: '— بلا —' })].concat(a.store.list(coll).map((o) => el('option', { attrs: { value: o.id, ...(values[f.key] === o.id ? { selected: 'selected' } : {}) }, text: localized(o.title) || o.name || o.id })));
      const s = el('select', { class: 'cms-input' }, opts); s.addEventListener('change', () => set(s.value)); control = s;
    } else if (f.type === 'asset') {
      control = this._assetField(f, values);
    } else { control = el('span', { text: '?' }); }
    return el('label', { class: 'cms-field' }, [el('span', { class: 'cms-flabel', text: f.label + (f.required ? ' *' : '') }), control]);
  }

  _assetField(f, values) {
    const a = this.app;
    const preview = el('div', { class: 'cms-asset-preview' });
    const render = () => preview.replaceChildren(assetThumb(values[f.key]));
    render();
    const file = el('input', {
      attrs: { type: 'file', accept: f.accept }, class: 'cms-hidden',
      on: { change: async (e) => { const fl = e.target.files[0]; if (!fl) return; try { const desc = await readAssetFile(fl); values[f.key] = await putUploadedAsset(desc); render(); } catch { a.ui.toast('تعذّر قراءة الملف'); } e.target.value = ''; } },
    });
    const kids = [preview, el('label', { class: 'cms-upload' }, ['⬆️ اختر ملف', file])];
    if (f.emoji) {
      const em = el('input', { class: 'cms-input cms-input--emoji', attrs: { maxlength: '4', placeholder: '😀' } });
      if (values[f.key] && values[f.key].type === 'emoji') em.value = values[f.key].data;
      em.addEventListener('input', () => { if (em.value) { values[f.key] = { type: 'emoji', data: em.value }; render(); } });
      kids.push(el('label', { class: 'cms-field--sm' }, ['أو إيموجي', em]));
    }
    return el('div', { class: 'cms-asset' }, kids);
  }
}
