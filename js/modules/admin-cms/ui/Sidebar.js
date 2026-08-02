/**
 * Sidebar.js — section navigation (with live counts), a storage-usage meter
 * (C1), and global actions: generate data files, build the deploy package (C4),
 * export / import a full backup (C3), import the existing project content, and
 * clear everything (safely, C3).
 */
import { el, clear } from '../../../utils/dom.js';
import { btn } from './helpers.js';
import { SECTIONS } from '../store/schema.js';

export default class Sidebar {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    this.nav = el('div', { class: 'cms-nav' });
    this.meter = el('div', { class: 'cms-meter', attrs: { title: 'مساحة تخزين المتصفح المستخدمة' } });
    this.restoreInput = el('input', { class: 'cms-hidden', attrs: { type: 'file', accept: '.json,application/json' }, on: { change: (e) => { const f = e.target.files[0]; if (f) a.importBackupFile(f); e.target.value = ''; } } });
    this.el = el('aside', { class: 'cms-sidebar', attrs: { 'aria-label': 'الأقسام' } }, [
      el('a', { class: 'cms-brand', attrs: { href: '#/', title: 'الرئيسية' } }, ['🗂️ ', el('span', { text: 'إدارة المحتوى' })]),
      this.nav,
      this.meter,
      el('div', { class: 'cms-side-actions' }, [
        btn({ emoji: '⚙️', label: 'توليد ملفات JSON', cls: 'cms-primary', onClick: () => a.ui.openGenerate() }),
        btn({ emoji: '📦', label: 'حزمة النشر (ZIP)', onClick: () => a.buildDeploy() }),
        btn({ emoji: '💾', label: 'تصدير نسخة احتياطية', onClick: () => a.exportBackup() }),
        btn({ emoji: '📤', label: 'استيراد نسخة احتياطية', onClick: () => this.restoreInput.click() }),
        btn({ emoji: '📥', label: 'استيراد المحتوى الحالي', onClick: () => a.importExisting() }),
        btn({ emoji: '🧹', label: 'مسح كل البيانات', cls: 'cms-danger', onClick: () => a.clearAll() }),
        this.restoreInput,
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
    this.renderMeter();
  }

  renderMeter() {
    const u = this.app.store.usage();
    clear(this.meter);
    this.meter.append(
      el('div', { class: 'cms-meter__row' }, [el('span', { text: '💽 مساحة التخزين' }), el('span', { class: 'cms-mini', text: `${u.human} / ${u.budgetHuman}` })]),
      el('div', { class: 'cms-meter__bar' }, [el('div', { class: `cms-meter__fill${u.ratio > 0.9 ? ' is-full' : u.ratio > 0.7 ? ' is-warn' : ''}`, style: { width: `${Math.max(2, Math.round(u.ratio * 100))}%` } })]),
    );
  }
}
