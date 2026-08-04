/**
 * AssetInspector.js — the per-asset detail view (Phase 17A.3). Shows a large
 * SVG / image / PDF preview, editable metadata (name, category, tags, favorite),
 * technical info (type, mime, size, dimensions, hash, dates), and the asset's
 * usage references. Actions: save, replace file, safe delete. Reuses the shared
 * modal, helpers, confirm/toast and the store's version-tracked mutations.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, localized } from './helpers.js';
import { resolveAssetData } from '../io/assets.js';
import { usageOf } from '../media/usage.js';
import { sectionById } from '../store/schema.js';

const human = (b) => (!b ? '—' : b < 1024 ? `${b} ب` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} ك.ب` : `${(b / 1024 / 1024).toFixed(2)} م.ب`);
const fmt = (iso) => { try { return iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; } catch { return iso; } };

export default class AssetInspector {
  constructor(app) { this.app = app; }

  open(id) {
    this.id = id;
    this.body = el('div', { class: 'cms-insp' });
    const { overlay } = this.app.ui._modal('🔎 مُفتّش الوسائط', this.body, () => this._off && this._off());
    this.overlay = overlay;
    this._off = this.app.store.on(() => { if (overlay.isConnected) this.render(); });
    this.render();
  }

  async render() {
    const a = this.app;
    const rec = a.store.get('assets', this.id);
    if (!this.overlay.isConnected) return;
    if (!rec) { clear(this.body); this.body.append(el('p', { class: 'cms-empty', text: 'حُذف هذا الأصل.' })); return; }

    const full = await resolveAssetData(rec.asset);
    if (!this.overlay.isConnected) return;
    const usage = usageOf(a.store, rec.asset);
    clear(this.body);

    // preview
    this.body.append(el('div', { class: 'cms-insp-preview' }, [this._previewNode(rec.asset, full)]));

    // editable metadata
    const name = el('input', { class: 'cms-input', attrs: { value: rec.name || '', dir: 'auto' } });
    const category = el('input', { class: 'cms-input', attrs: { value: rec.category || '', placeholder: 'التصنيف', dir: 'auto' } });
    const tags = el('input', { class: 'cms-input', attrs: { value: (rec.tags || []).join('، '), placeholder: 'وسوم مفصولة بفواصل', dir: 'rtl' } });
    const field = (label, control) => el('label', { class: 'cms-field' }, [el('span', { class: 'cms-flabel', text: label }), control]);
    this.body.append(el('div', { class: 'cms-form' }, [field('الاسم', name), field('التصنيف', category), field('الوسوم', tags)]));

    // technical info
    const info = rec.asset || {};
    const dims = (info.width && info.height) ? `${info.width}×${info.height}` : '—';
    this.body.append(el('div', { class: 'cms-insp-info' }, [
      this._kv('النوع', info.type || '—'), this._kv('الصيغة', info.mime || '—'), this._kv('الحجم', human(info.size)),
      this._kv('الأبعاد', dims), this._kv('البصمة', info.hash ? info.hash.slice(0, 12) : '—'),
      this._kv('أُضيف', fmt(rec.createdAt)), this._kv('عُدّل', fmt(rec.updatedAt)),
    ]));

    // usage references
    this.body.append(el('div', { class: 'cms-insp-usage' }, [
      el('h4', { text: `الاستخدامات (${usage.length})` }),
      usage.length
        ? el('div', { class: 'cms-usage-list' }, usage.map((u) => el('span', { class: 'cms-usage-chip', text: `${(sectionById(u.assetType) || {}).icon || '📄'} ${u.name}` })))
        : el('p', { class: 'cms-mini', text: 'غير مستخدم في أي عنصر.' }),
    ]));

    // actions
    const save = btn({ emoji: '💾', label: 'حفظ', cls: 'cms-primary', onClick: () => { a.store.update('assets', this.id, { name: name.value.trim(), category: category.value.trim(), tags: tags.value.split(/[،,]+/).map((s) => s.trim()).filter(Boolean), updatedAt: new Date().toISOString() }); a.ui.toast('تم الحفظ ✅'); } });
    const fav = btn({ emoji: rec.fav ? '⭐' : '☆', label: rec.fav ? 'مفضّل' : 'أضف للمفضلة', onClick: () => a.toggleFav(this.id) });
    const replaceInput = el('input', { class: 'cms-hidden', attrs: { type: 'file', accept: '.svg,.png,.jpg,.jpeg,.webp,.pdf' }, on: { change: (e) => { const f = e.target.files[0]; if (f) a.replaceAsset(this.id, f); e.target.value = ''; } } });
    const replace = btn({ emoji: '🔄', label: 'استبدال الملف', onClick: () => replaceInput.click() });
    const del = btn({ emoji: '🗑️', label: 'حذف آمن', cls: 'cms-danger', onClick: () => a.deleteAsset(this.id, usage.length) });
    this.body.append(el('div', { class: 'cms-modal__foot cms-insp-actions' }, [save, fav, replace, del, replaceInput]));
  }

  _kv(k, v) { return el('div', { class: 'cms-kv' }, [el('span', { class: 'cms-kv__k', text: k }), el('span', { class: 'cms-kv__v', text: String(v) })]); }

  _previewNode(asset, full) {
    if (!full || !full.data) return el('div', { class: 'cms-insp-media cms-insp-media--none', text: '—' });
    if (full.type === 'svg') return el('div', { class: 'cms-insp-media', style: { backgroundImage: `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(full.data)}")` } });
    if (full.type === 'image') return el('img', { class: 'cms-insp-media cms-insp-media--img', attrs: { src: full.data, alt: '', draggable: 'false' } });
    if (full.type === 'pdf') return el('object', { class: 'cms-insp-media cms-insp-media--pdf', attrs: { data: full.data, type: 'application/pdf' } }, [el('a', { attrs: { href: full.data, target: '_blank' }, text: '📄 فتح PDF' })]);
    return el('div', { class: 'cms-insp-media cms-insp-media--none', text: '؟' });
  }
}
