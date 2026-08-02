/**
 * HistoryPanel.js — the versions / change-log UI (Phase 17A.2). Renders the
 * ordered version list (author, timestamp, note, kind, stats), lets you create a
 * manual version, restore any version, pick two to compare, and shows the diff
 * viewer. Reuses the shared modal, buttons and formatting helpers — no new
 * modal machinery.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, localized, displayName } from './helpers.js';
import { summarize, counts } from '../history/diff.js';

const fmt = (iso) => { try { return new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; } };
const kindBadge = (k) => (k === 'manual' ? '🔖 يدوي' : '🕒 تلقائي');

export default class HistoryPanel {
  constructor(app) { this.app = app; this.compare = new Set(); }

  async open() {
    this.compare.clear();
    const body = el('div', { class: 'cms-history' }, [el('p', { class: 'cms-mini', text: 'جارٍ التحميل…' })]);
    const { overlay, close } = this.app.ui._modal('🕘 السجل والإصدارات', body, () => this._off && this._off());
    this.overlay = overlay; this.close = close; this.body = body;
    this._off = this.app.vm.on(() => { if (overlay.isConnected) this.render(); });
    await this.render();
  }

  async render() {
    const a = this.app;
    const versions = await a.vm.list();
    if (!this.overlay.isConnected) return;
    clear(this.body);

    // toolbar: author + create manual version
    const author = el('input', { class: 'cms-input cms-input--sm', attrs: { value: a.vm.author, dir: 'rtl', title: 'اسم المحرر' }, on: { change: (e) => a.vm.setAuthor(e.target.value) } });
    const note = el('input', { class: 'cms-input cms-input--sm', attrs: { placeholder: 'ملاحظة الإصدار (اختياري)', dir: 'rtl' } });
    const createBtn = btn({ emoji: '🔖', label: 'حفظ إصدار', cls: 'cms-primary', onClick: async () => { await a.createVersion(note.value.trim()); note.value = ''; } });
    const cmpBtn = btn({ emoji: '🔀', label: 'قارن المحدَّدَين', onClick: () => this._openCompare() });
    cmpBtn.disabled = this.compare.size !== 2;
    this.body.append(el('div', { class: 'cms-history-bar' }, [el('span', { class: 'cms-mini', text: 'المحرر:' }), author, note, createBtn, cmpBtn]));

    // change log
    const rows = el('div', { class: 'cms-vers' });
    if (!versions.length) rows.append(el('p', { class: 'cms-empty', text: 'لا توجد إصدارات بعد.' }));
    for (const v of versions) rows.append(this._row(v));
    this.body.append(rows);
  }

  _row(v) {
    const a = this.app;
    const chk = el('input', { attrs: { type: 'checkbox', title: 'اختر للمقارنة', ...(this.compare.has(v.id) ? { checked: 'checked' } : {}) }, on: { change: (e) => { if (e.target.checked) { if (this.compare.size >= 2) { const first = [...this.compare][0]; this.compare.delete(first); } this.compare.add(v.id); } else this.compare.delete(v.id); this.render(); } } });
    const s = v.stats || {};
    return el('div', { class: `cms-ver ${v.kind === 'manual' ? 'is-manual' : ''}` }, [
      el('label', { class: 'cms-check' }, [chk]),
      el('div', { class: 'cms-ver__main' }, [
        el('div', { class: 'cms-ver__head' }, [el('span', { class: 'cms-badge', text: kindBadge(v.kind) }), el('span', { class: 'cms-ver__note', text: v.note || '—' })]),
        el('div', { class: 'cms-mini', text: `${fmt(v.createdAt)} · ${v.author || '—'} · 📦${s.packs || 0} 🧩${s.items || 0} 🗂️${s.categories || 0}` }),
      ]),
      el('div', { class: 'cms-ver__actions' }, [
        btn({ emoji: '↩️', label: 'استعادة', onClick: () => a.restoreVersion(v.id) }),
        btn({ emoji: '🗑️', title: 'حذف الإصدار', cls: 'cms-danger', onClick: () => a.deleteVersion(v.id) }),
      ]),
    ]);
  }

  async _openCompare() {
    const [x, y] = [...this.compare];
    const cmp = await this.app.vm.compare(x, y);
    if (!cmp) return;
    this._renderDiff(cmp);
  }

  _renderDiff({ older, newer, diff }) {
    const c = counts(diff);
    const sections = [];
    const label = { packs: 'الحزم', items: 'العناصر', categories: 'التصنيفات', assets: 'الوسائط', trash: 'المحذوفات' };
    for (const coll of Object.keys(diff)) {
      const d = diff[coll];
      const lines = [];
      for (const o of d.added) lines.push(el('div', { class: 'cms-diff-line is-add', text: `＋ ${displayName(o)}` }));
      for (const o of d.removed) lines.push(el('div', { class: 'cms-diff-line is-del', text: `－ ${displayName(o)}` }));
      for (const ch of d.changed) lines.push(el('div', { class: 'cms-diff-line is-chg', text: `~ ${displayName(ch.after)} — الحقول: ${ch.fields.map(fieldName).join('، ')}` }));
      sections.push(el('div', { class: 'cms-diff-sec' }, [el('h4', { text: `${label[coll] || coll}` }), ...lines]));
    }
    if (!sections.length) sections.push(el('p', { class: 'cms-empty', text: 'الإصداران متطابقان.' }));
    const body = el('div', { class: 'cms-diff' }, [
      el('p', { class: 'cms-mini', text: `مقارنة: «${older.note || fmt(older.createdAt)}» → «${newer.note || fmt(newer.createdAt)}» · ${summarize(diff)} (${c.total} تغيير)` }),
      ...sections,
    ]);
    this.app.ui._modal('🔀 مقارنة الإصدارات', body);
  }
}

function fieldName(k) {
  return ({ title: 'العنوان', description: 'الوصف', tags: 'الوسوم', packId: 'الحزمة', categoryId: 'التصنيف', asset: 'الملف', icon: 'الأيقونة', difficulty: 'الصعوبة', premium: 'مميّز', name: 'الاسم' })[k] || k;
}
