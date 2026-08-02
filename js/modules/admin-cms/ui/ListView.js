/**
 * ListView.js — ONE generic list/grid used by every section: search, filter (by
 * pack + category), sort, bulk select + bulk delete + bulk move, drag-and-drop
 * reorder, and per-row edit / duplicate / preview / delete. Config-driven from
 * the section schema, so there is no per-section list code.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, localized, displayName, rowThumb } from './helpers.js';

export default class ListView {
  constructor(app) { this.app = app; this.selected = new Set(); this.search = ''; this.filterPack = ''; this.filterCategory = ''; this.sort = 'order'; }

  build() { this.el = el('div', { class: 'cms-listview' }); return this.el; }

  setSection(section) { this.section = section; this.selected.clear(); this.search = ''; this.filterPack = ''; this.filterCategory = ''; this.sort = 'order'; this.refresh(); }

  _base() { const s = this.section; return s.assetType ? this.app.store.itemsByType(s.assetType) : this.app.store.list(s.coll); }

  _filtered() {
    let list = this._base();
    if (this.search) { const q = this.search.toLowerCase(); list = list.filter((o) => `${localized(o.title)} ${o.name || ''} ${(o.tags || []).join(' ')}`.toLowerCase().includes(q)); }
    if (this.filterPack) list = list.filter((o) => o.packId === this.filterPack);
    if (this.filterCategory) list = list.filter((o) => o.categoryId === this.filterCategory);
    if (this.sort === 'title') list = [...list].sort((a, b) => localized(a.title).localeCompare(localized(b.title), 'ar'));
    else if (this.sort === 'recent') list = [...list].reverse();
    else list = [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
    return list;
  }

  get _canReorder() { return this.sort === 'order' && !this.search && !this.filterPack && !this.filterCategory; }
  _isItemSection() { return !!this.section.assetType; }

  refresh() {
    const s = this.section;
    if (!s) return;
    const a = this.app;
    clear(this.el);
    // toolbar
    const search = el('input', { class: 'cms-search', attrs: { type: 'search', placeholder: `ابحث في ${s.label}…`, dir: 'rtl', value: this.search }, on: { input: (e) => { this.search = e.target.value; this.refresh(); } } });
    const sortSel = el('select', { class: 'cms-input cms-input--sm', on: { change: (e) => { this.sort = e.target.value; this.refresh(); } } }, [['order', 'ترتيب يدوي'], ['title', 'الاسم'], ['recent', 'الأحدث']].map(([v, l]) => el('option', { attrs: { value: v, ...(this.sort === v ? { selected: 'selected' } : {}) }, text: l })));
    const toolbar = el('div', { class: 'cms-toolbar' }, [
      btn({ emoji: '➕', label: `إضافة`, cls: 'cms-primary', onClick: () => a.openForm(s) }),
      search, sortSel,
    ]);
    if (this._isItemSection()) {
      toolbar.append(this._filterSelect('packs', this.filterPack, 'كل الحزم', (v) => { this.filterPack = v; this.refresh(); }));
      toolbar.append(this._filterSelect('categories', this.filterCategory, 'كل التصنيفات', (v) => { this.filterCategory = v; this.refresh(); }));
    }
    this.el.append(toolbar);

    const list = this._filtered();
    // bulk bar
    if (this.selected.size) this.el.append(this._bulkBar(list));

    // header (select all)
    const allChecked = list.length && list.every((o) => this.selected.has(o.id));
    const head = el('div', { class: 'cms-row cms-row--head' }, [
      el('label', { class: 'cms-check' }, [el('input', { attrs: { type: 'checkbox', ...(allChecked ? { checked: 'checked' } : {}) }, on: { change: (e) => { if (e.target.checked) list.forEach((o) => this.selected.add(o.id)); else this.selected.clear(); this.refresh(); } } })]),
      el('span', { class: 'cms-col-thumb' }),
      el('span', { class: 'cms-col-name cms-mini', text: `${list.length} عنصر` }),
      el('span', { class: 'cms-col-meta cms-mini', text: this._canReorder ? 'اسحب ⠿ لإعادة الترتيب' : '' }),
      el('span', { class: 'cms-col-actions' }),
    ]);
    this.el.append(head);

    this.listEl = el('div', { class: 'cms-rows' });
    if (!list.length) this.listEl.append(el('p', { class: 'cms-empty', text: 'لا توجد عناصر. أضف عنصرًا جديدًا ✨' }));
    for (const o of list) this.listEl.append(this._row(o));
    this.el.append(this.listEl);
  }

  _filterSelect(coll, value, allLabel, onChange) {
    const opts = [el('option', { attrs: { value: '' }, text: allLabel })].concat(this.app.store.list(coll).map((o) => el('option', { attrs: { value: o.id, ...(value === o.id ? { selected: 'selected' } : {}) }, text: localized(o.title) || o.name || o.id })));
    return el('select', { class: 'cms-input cms-input--sm', on: { change: (e) => onChange(e.target.value) } }, opts);
  }

  _bulkBar(list) {
    const a = this.app;
    const moveTo = (coll, key) => this._filterSelect(coll, '', `نقل إلى ${coll === 'packs' ? 'حزمة' : 'تصنيف'}…`, (v) => { if (v) { a.bulkMove(this.section, [...this.selected], { [key]: v }); } });
    const bar = el('div', { class: 'cms-bulkbar' }, [
      el('span', { class: 'cms-mini', text: `${this.selected.size} محدد` }),
      btn({ emoji: '🗑️', label: 'حذف', cls: 'cms-danger', onClick: () => a.bulkDelete(this.section, [...this.selected], () => { this.selected.clear(); this.refresh(); }) }),
    ]);
    if (this._isItemSection()) { bar.append(moveTo('packs', 'packId'), moveTo('categories', 'categoryId')); }
    bar.append(btn({ label: 'إلغاء التحديد', onClick: () => { this.selected.clear(); this.refresh(); } }));
    return bar;
  }

  _row(o) {
    const a = this.app;
    const check = el('input', { attrs: { type: 'checkbox', ...(this.selected.has(o.id) ? { checked: 'checked' } : {}) }, on: { change: (e) => { if (e.target.checked) this.selected.add(o.id); else this.selected.delete(o.id); this.refresh(); } } });
    const meta = [];
    if (o.packId) { const p = a.store.get('packs', o.packId); if (p) meta.push(`📦 ${localized(p.title)}`); }
    if (o.categoryId) { const c = a.store.get('categories', o.categoryId); if (c) meta.push(`🗂️ ${localized(c.title)}`); }
    if (o.tags && o.tags.length) meta.push(`🏷️ ${o.tags.slice(0, 3).join('، ')}`);
    const row = el('div', { class: 'cms-row', attrs: { 'data-id': o.id } }, [
      el('label', { class: 'cms-check' }, [check]),
      this._canReorder ? el('span', { class: 'cms-drag', attrs: { title: 'اسحب لإعادة الترتيب' }, text: '⠿', on: { pointerdown: (e) => this._startDrag(e, row, o.id) } }) : el('span', { class: 'cms-drag cms-drag--off' }),
      el('span', { class: 'cms-col-thumb' }, [rowThumb(this.section, o)]),
      el('span', { class: 'cms-col-name', text: displayName(o) }),
      el('span', { class: 'cms-col-meta cms-mini', text: meta.join('  ·  ') }),
      el('span', { class: 'cms-col-actions' }, [
        btn({ emoji: '👁️', title: 'معاينة', onClick: () => a.preview(this.section, o) }),
        btn({ emoji: '✏️', title: 'تعديل', onClick: () => a.openForm(this.section, o) }),
        btn({ emoji: '📑', title: 'تكرار', onClick: () => a.duplicateEntity(this.section, o.id) }),
        btn({ emoji: '🗑️', title: 'حذف', cls: 'cms-danger', onClick: () => a.deleteEntity(this.section, o.id) }),
      ]),
    ]);
    return row;
  }

  _startDrag(e, rowEl, id) {
    e.preventDefault();
    rowEl.classList.add('cms-dragging');
    const move = (ev) => {
      const rows = [...this.listEl.querySelectorAll('.cms-row')];
      for (const r of rows) {
        if (r === rowEl) continue;
        const rect = r.getBoundingClientRect();
        if (ev.clientY > rect.top && ev.clientY < rect.bottom) { this.listEl.insertBefore(rowEl, ev.clientY > rect.top + rect.height / 2 ? r.nextSibling : r); break; }
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
      rowEl.classList.remove('cms-dragging');
      const ids = [...this.listEl.querySelectorAll('.cms-row')].map((r) => r.dataset.id);
      this.app.reorder(this.section, ids);
    };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
  }
}
