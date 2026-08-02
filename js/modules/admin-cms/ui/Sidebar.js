/**
 * Sidebar.js — section navigation (with live counts) + global actions: generate
 * the data files, import the existing project content, and clear everything.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn } from './helpers.js';
import { SECTIONS } from '../store/schema.js';

export default class Sidebar {
  constructor(app) { this.app = app; }

  build() {
    this.nav = el('div', { class: 'cms-nav' });
    this.el = el('aside', { class: 'cms-sidebar', attrs: { 'aria-label': 'الأقسام' } }, [
      el('a', { class: 'cms-brand', attrs: { href: '#/', title: 'الرئيسية' } }, ['🗂️ ', el('span', { text: 'إدارة المحتوى' })]),
      this.nav,
      el('div', { class: 'cms-side-actions' }, [
        btn({ emoji: '⚙️', label: 'توليد ملفات JSON', cls: 'cms-primary', onClick: () => this.app.ui.openGenerate() }),
        btn({ emoji: '📥', label: 'استيراد المحتوى الحالي', onClick: () => this.app.importExisting() }),
        btn({ emoji: '🧹', label: 'مسح كل البيانات', cls: 'cms-danger', onClick: () => this.app.clearAll() }),
      ]),
    ]);
    this.refresh();
    return this.el;
  }

  refresh() {
    const a = this.app;
    clear(this.nav);
    for (const s of SECTIONS) {
      const count = s.assetType ? a.store.itemsByType(s.assetType).length : a.store.list(s.coll).length;
      this.nav.append(el('button', {
        class: `cms-navitem ${a.sectionId === s.id ? 'is-active' : ''}`, attrs: { type: 'button' },
        on: { click: () => a.selectSection(s.id) },
      }, [el('span', { class: 'cms-navicon', text: s.icon }), el('span', { class: 'cms-navlabel', text: s.label }), el('span', { class: 'cms-navcount', text: String(count) })]));
    }
  }
}
