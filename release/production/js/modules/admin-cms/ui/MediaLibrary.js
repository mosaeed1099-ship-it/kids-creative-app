/**
 * MediaLibrary.js — the Media Library & Asset Manager view (Phase 17A.3),
 * shown in place of the generic list when the "الوسائط" section is active.
 * A thumbnail grid with: multi-file upload, search, category + tag filtering,
 * sort (incl. recent), favorites / unused / duplicate views, bulk rename / move
 * / tag / delete, and the Asset Inspector. Reuses helpers, EntityForm, confirm,
 * trash (safe delete) and version history — no duplicated logic.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, assetThumb } from './helpers.js';
import { usageIndex, duplicateIds, unusedAssets } from '../media/usage.js';

const MODES = [['all', 'الكل', '🗂️'], ['fav', 'المفضّلة', '⭐'], ['unused', 'غير مستخدم', '🚫'], ['dup', 'المكرر', '📑']];
const SORTS = [['recent', 'الأحدث'], ['name', 'الاسم'], ['size', 'الحجم'], ['type', 'النوع']];

export default class MediaLibrary {
  constructor(app) { this.app = app; this.search = ''; this.category = ''; this.sort = 'recent'; this.mode = 'all'; this.selected = new Set(); }

  build() { this.el = el('div', { class: 'cms-listview cms-media' }); return this.el; }

  _assets() { return this.app.store.list('assets'); }

  _filtered() {
    let list = this._assets().slice();
    if (this.mode === 'fav') list = list.filter((a) => a.fav);
    else if (this.mode === 'unused') { const un = new Set(unusedAssets(this.app.store, this._usage).map((a) => a.id)); list = list.filter((a) => un.has(a.id)); }
    else if (this.mode === 'dup') list = list.filter((a) => this._dupIds.has(a.id));
    if (this.category) list = list.filter((a) => (a.category || '') === this.category);
    if (this.search) { const q = this.search.toLowerCase(); list = list.filter((a) => `${a.name || ''} ${(a.tags || []).join(' ')} ${a.category || ''} ${a.asset?.mime || ''} ${a.asset?.type || ''}`.toLowerCase().includes(q)); }
    const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'ar');
    if (this.sort === 'name') list.sort(byName);
    else if (this.sort === 'size') list.sort((a, b) => (b.asset?.size || 0) - (a.asset?.size || 0));
    else if (this.sort === 'type') list.sort((a, b) => (a.asset?.type || '').localeCompare(b.asset?.type || '') || byName(a, b));
    else list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return list;
  }

  refresh() {
    const a = this.app;
    this._usage = usageIndex(a.store);
    this._dupIds = duplicateIds(a.store);
    clear(this.el);

    // toolbar
    const upload = el('input', { class: 'cms-hidden', attrs: { type: 'file', multiple: 'multiple', accept: '.svg,.png,.jpg,.jpeg,.webp,.pdf' }, on: { change: (e) => { const fs = [...e.target.files]; if (fs.length) a.addAssetFiles(fs); e.target.value = ''; } } });
    const search = el('input', { class: 'cms-search', attrs: { type: 'search', placeholder: 'ابحث في الوسائط…', dir: 'rtl', value: this.search }, on: { input: (e) => { this.search = e.target.value; this.refresh(); } } });
    const sortSel = el('select', { class: 'cms-input cms-input--sm', on: { change: (e) => { this.sort = e.target.value; this.refresh(); } } }, SORTS.map(([v, l]) => el('option', { attrs: { value: v, ...(this.sort === v ? { selected: 'selected' } : {}) }, text: l })));
    const cats = [...new Set(this._assets().map((x) => x.category).filter(Boolean))];
    const catSel = el('select', { class: 'cms-input cms-input--sm', on: { change: (e) => { this.category = e.target.value; this.refresh(); } } }, [el('option', { attrs: { value: '' }, text: 'كل التصنيفات' })].concat(cats.map((c) => el('option', { attrs: { value: c, ...(this.category === c ? { selected: 'selected' } : {}) }, text: c }))));
    this.el.append(el('div', { class: 'cms-toolbar' }, [
      btn({ emoji: '⬆️', label: 'رفع ملفات', cls: 'cms-primary', onClick: () => upload.click() }), upload,
      search, sortSel, catSel,
    ]));

    // mode chips
    const dupCount = this._dupIds.size, unusedCount = unusedAssets(a.store, this._usage).length;
    this.el.append(el('div', { class: 'cms-chips' }, MODES.map(([v, l, ic]) => {
      const extra = v === 'dup' && dupCount ? ` (${dupCount})` : v === 'unused' && unusedCount ? ` (${unusedCount})` : '';
      return el('button', { class: `cms-chip ${this.mode === v ? 'is-active' : ''}`, attrs: { type: 'button' }, on: { click: () => { this.mode = v; this.refresh(); } } }, [`${ic} ${l}${extra}`]);
    })));

    const list = this._filtered();
    if (this.selected.size) this.el.append(this._bulkBar());
    this.el.append(el('p', { class: 'cms-mini cms-media-count', text: `${list.length} أصل` }));

    // grid
    const grid = el('div', { class: 'cms-media-grid' });
    if (!list.length) grid.append(el('p', { class: 'cms-empty', text: 'لا توجد وسائط. ارفع ملفات لتبدأ ✨' }));
    for (const asset of list) grid.append(this._card(asset));
    this.el.append(grid);
  }

  _card(a) {
    const app = this.app;
    const sel = this.selected.has(a.id);
    const check = el('input', { class: 'cms-media-check', attrs: { type: 'checkbox', ...(sel ? { checked: 'checked' } : {}) }, on: { click: (e) => e.stopPropagation(), change: (e) => { if (e.target.checked) this.selected.add(a.id); else this.selected.delete(a.id); this.refresh(); } } });
    const star = el('button', { class: `cms-media-fav ${a.fav ? 'is-on' : ''}`, attrs: { type: 'button', title: 'مفضلة' }, on: { click: (e) => { e.stopPropagation(); app.toggleFav(a.id); } } }, [a.fav ? '⭐' : '☆']);
    const badges = [];
    if (this._dupIds.has(a.id)) badges.push(el('span', { class: 'cms-media-badge is-dup', text: 'مكرر' }));
    const used = (a.asset && a.asset.hash && this._usage.get(a.asset.hash)) ? this._usage.get(a.asset.hash).length : 0;
    if (!used) badges.push(el('span', { class: 'cms-media-badge is-unused', text: 'غير مستخدم' }));
    return el('div', { class: `cms-media-card ${sel ? 'is-sel' : ''}`, on: { click: () => app.openInspector(a.id) } }, [
      el('div', { class: 'cms-media-top' }, [check, star]),
      el('div', { class: 'cms-media-thumb' }, [assetThumb(a.asset)]),
      el('div', { class: 'cms-media-name', attrs: { title: a.name || '' }, text: a.name || '(بدون اسم)' }),
      el('div', { class: 'cms-media-meta', text: `${a.asset?.type || '—'} · ${used} استخدام` }),
      badges.length ? el('div', { class: 'cms-media-badges' }, badges) : null,
    ]);
  }

  _bulkBar() {
    const app = this.app;
    const ids = () => [...this.selected];
    const clearSel = () => { this.selected.clear(); this.refresh(); };
    return el('div', { class: 'cms-bulkbar' }, [
      el('span', { class: 'cms-mini', text: `${this.selected.size} محدد` }),
      btn({ emoji: '✏️', label: 'إعادة تسمية', onClick: () => app.bulkRename(ids(), clearSel) }),
      btn({ emoji: '📂', label: 'نقل لتصنيف', onClick: () => app.bulkMoveCategory(ids(), clearSel) }),
      btn({ emoji: '🏷️', label: 'إضافة وسوم', onClick: () => app.bulkAddTags(ids(), clearSel) }),
      btn({ emoji: '🗑️', label: 'حذف', cls: 'cms-danger', onClick: () => app.bulkDeleteAssets(ids(), clearSel) }),
      btn({ label: 'إلغاء التحديد', onClick: clearSel }),
    ]);
  }
}
