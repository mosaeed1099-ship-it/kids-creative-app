/**
 * TrashPanel.js — the recycle bin (Phase 17A.2). Lists soft-deleted records
 * from every collection with where they came from, and lets you restore one,
 * permanently delete one, or empty the bin. Reuses the shared modal + helpers.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, displayName, assetThumb } from './helpers.js';
import { SECTIONS } from '../store/schema.js';

const fmt = (iso) => { try { return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
const collLabel = (coll, assetType) => {
  if (coll === 'packs') return 'حزمة';
  if (coll === 'categories') return 'تصنيف';
  if (coll === 'assets') return 'وسائط';
  const s = assetType ? SECTIONS.find((x) => x.assetType === assetType) : null;
  return s ? s.label : 'عنصر';
};

export default class TrashPanel {
  constructor(app) { this.app = app; }

  open() {
    this.body = el('div', { class: 'cms-trash' });
    const { overlay } = this.app.ui._modal('🗑️ سلة المحذوفات', this.body, () => this._off && this._off());
    this.overlay = overlay;
    this._off = this.app.store.on(() => { if (overlay.isConnected) this.render(); });
    this.render();
  }

  render() {
    const a = this.app;
    const trash = a.store.list('trash').slice().reverse(); // newest deleted first
    clear(this.body);
    this.body.append(el('div', { class: 'cms-history-bar' }, [
      el('span', { class: 'cms-mini', text: `${trash.length} عنصر في السلة` }),
      el('span', { class: 'cms-spacer' }),
      btn({ emoji: '🧹', label: 'إفراغ السلة', cls: 'cms-danger', onClick: () => a.emptyTrash(), disabled: !trash.length }),
    ]));

    const rows = el('div', { class: 'cms-rows' });
    if (!trash.length) rows.append(el('p', { class: 'cms-empty', text: 'السلة فارغة ✨' }));
    for (const t of trash) rows.append(this._row(t));
    this.body.append(rows);
  }

  _row(t) {
    const a = this.app;
    return el('div', { class: 'cms-row cms-trash-row' }, [
      el('span', { class: 'cms-col-thumb' }, [t.icon ? el('span', { class: 'cms-thumb cms-thumb--emoji', text: t.icon }) : assetThumb(t.asset)]),
      el('span', { class: 'cms-col-name', text: displayName(t) }),
      el('span', { class: 'cms-col-meta cms-mini', text: `${collLabel(t._coll, t.assetType)} · حُذف ${fmt(t._deletedAt)}` }),
      el('span', { class: 'cms-col-actions' }, [
        btn({ emoji: '♻️', label: 'استعادة', onClick: () => a.restoreTrash(t._trashId) }),
        btn({ emoji: '❌', title: 'حذف نهائي', cls: 'cms-danger', onClick: () => a.purgeTrash(t._trashId) }),
      ]),
    ]);
  }
}
