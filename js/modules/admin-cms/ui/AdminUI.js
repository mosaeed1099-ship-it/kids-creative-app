/**
 * AdminUI.js — the CMS shell: sidebar + main (header + generic ListView), plus
 * the generate-files modal, the preview modal, toasts and a mobile nav toggle.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, displayName, assetThumb, localized } from './helpers.js';
import Sidebar from './Sidebar.js';
import ListView from './ListView.js';
import EntityForm from './EntityForm.js';
import { generateAll, downloadJSON } from '../generate/generators.js';

export default class AdminUI {
  constructor(app) { this.app = app; this.form = new EntityForm(app); }

  build() {
    const a = this.app;
    this.sidebar = new Sidebar(a);
    this.listview = new ListView(a);
    this.title = el('h1', { class: 'cms-title', text: 'المحتوى' });
    this.header = el('header', { class: 'cms-header' }, [
      btn({ emoji: '☰', title: 'الأقسام', cls: 'cms-nav-toggle', onClick: () => this.root.classList.toggle('nav-open') }),
      this.title,
      el('div', { class: 'cms-spacer' }),
      btn({ emoji: '⚙️', label: 'توليد', cls: 'cms-primary', onClick: () => this.openGenerate() }),
    ]);
    this.main = el('div', { class: 'cms-main' }, [this.header, this.listview.build()]);
    this.scrim = el('div', { class: 'cms-scrim', on: { click: () => this.root.classList.remove('nav-open') } });
    this.toastHost = el('div', { class: 'cms-toasts', attrs: { 'aria-live': 'polite' } });
    this.root = el('div', { class: 'cms-root', attrs: { dir: 'rtl' } }, [this.sidebar.build(), this.main, this.scrim, this.toastHost]);
    return this.root;
  }

  setSection(section) { this.title.textContent = `${section.icon} ${section.label}`; this.listview.setSection(section); this.sidebar.refresh(); this.root.classList.remove('nav-open'); }
  refresh() { this.sidebar.refresh(); this.listview.refresh(); }
  openForm(section, obj) { this.form.open(section, obj); }

  toast(msg) {
    const c = el('div', { class: 'cms-toast', text: msg });
    this.toastHost.append(c);
    requestAnimationFrame(() => c.classList.add('is-in'));
    setTimeout(() => { c.classList.remove('is-in'); setTimeout(() => c.remove(), 300); }, 1900);
  }

  _modal(title, body) {
    const close = () => overlay.remove();
    const overlay = el('div', { class: 'cms-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } }, [
      el('div', { class: 'cms-modal__box' }, [el('div', { class: 'cms-modal__head' }, [el('h2', { text: title }), btn({ emoji: '✖️', title: 'إغلاق', onClick: close })]), body]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    this.root.append(overlay);
    return { overlay, close };
  }

  openGenerate() {
    const files = generateAll(this.app.store);
    const rows = Object.entries(files).map(([name, obj]) => {
      const count = Array.isArray(obj) ? obj.length : (obj.items ? obj.items.length : (obj.packs ? obj.packs.length : 0));
      const bytes = JSON.stringify(obj).length;
      return el('div', { class: 'cms-genrow' }, [
        el('span', { class: 'cms-gen-name', text: name }),
        el('span', { class: 'cms-mini', text: `${count} عنصر · ${(bytes / 1024).toFixed(1)} كيلوبايت` }),
        btn({ emoji: '⬇️', label: 'تنزيل', onClick: () => downloadJSON(name, obj) }),
      ]);
    });
    const body = el('div', {}, [
      el('p', { class: 'cms-mini', text: 'تُولَّد هذه الملفات تلقائيًا من المحتوى — بدون تحرير يدوي. نزّلها وضعها في مجلدات البيانات.' }),
      el('div', { class: 'cms-genlist' }, rows),
      el('div', { class: 'cms-modal__foot' }, [btn({ emoji: '⬇️', label: 'تنزيل الكل', cls: 'cms-primary', onClick: () => Object.entries(files).forEach(([n, o], i) => setTimeout(() => downloadJSON(n, o), i * 250)) })]),
    ]);
    this._modal('⚙️ توليد ملفات البيانات', body);
  }

  preview(section, o) {
    const big = el('div', { class: 'cms-preview-media' }, [o.asset ? assetThumb(o.asset) : el('span', { class: 'cms-thumb cms-thumb--emoji', text: o.icon || '—' })]);
    const clean = { ...o }; delete clean._reorder;
    const body = el('div', {}, [
      el('div', { class: 'cms-preview-head' }, [big, el('div', {}, [el('h3', { text: displayName(o) }), el('p', { class: 'cms-mini', text: localized(o.description) })])]),
      o.asset && o.asset.type === 'pdf' ? btn({ emoji: '📄', label: 'فتح PDF', onClick: () => window.open(o.asset.data, '_blank') }) : null,
      el('pre', { class: 'cms-json', text: JSON.stringify(clean, null, 2) }),
    ]);
    this._modal('👁️ معاينة', body);
  }
}
