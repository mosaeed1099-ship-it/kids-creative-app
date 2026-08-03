/**
 * AdminUI.js — the CMS shell: sidebar + main (header + generic ListView), plus
 * the generate-files modal, the preview modal, a persistent error bar, a
 * professional confirmation dialog, toasts and a mobile nav toggle.
 */
import { el, clear } from '../../../utils/dom.js';
import { btn, displayName, assetThumb, localized } from './helpers.js';
import { resolveAssetData } from '../io/assets.js';
import Sidebar from './Sidebar.js';
import ListView from './ListView.js';
import EntityForm from './EntityForm.js';
import HistoryPanel from './HistoryPanel.js';
import TrashPanel from './TrashPanel.js';
import MediaLibrary from './MediaLibrary.js';
import AssetInspector from './AssetInspector.js';
import ReleasePanel from './ReleasePanel.js';
import { generateAll, downloadJSON } from '../generate/generators.js';

export default class AdminUI {
  constructor(app) { this.app = app; this.form = new EntityForm(app); this.history = new HistoryPanel(app); this.trash = new TrashPanel(app); this.inspector = new AssetInspector(app); this.release = new ReleasePanel(app); }

  build() {
    const a = this.app;
    this.sidebar = new Sidebar(a);
    this.listview = new ListView(a);
    this.medialib = new MediaLibrary(a);
    this.title = el('h1', { class: 'cms-title', text: 'المحتوى' });
    this.undoBtn = btn({ emoji: '↶', title: 'تراجع (Ctrl/⌘+Z)', cls: 'cms-btn--sm', onClick: () => a.undo() });
    this.redoBtn = btn({ emoji: '↷', title: 'إعادة (Ctrl/⌘+Shift+Z)', cls: 'cms-btn--sm', onClick: () => a.redo() });
    this.header = el('header', { class: 'cms-header' }, [
      btn({ emoji: '☰', title: 'الأقسام', cls: 'cms-nav-toggle', onClick: () => this.root.classList.toggle('nav-open') }),
      this.title,
      el('div', { class: 'cms-spacer' }),
      this.undoBtn, this.redoBtn,
      btn({ emoji: '🕘', title: 'السجل والإصدارات', cls: 'cms-btn--sm', onClick: () => this.openHistory() }),
      btn({ emoji: '🗑️', title: 'سلة المحذوفات', cls: 'cms-btn--sm', onClick: () => this.openTrash() }),
      btn({ emoji: '⚙️', label: 'توليد', cls: 'cms-primary', onClick: () => this.openGenerate() }),
    ]);
    this.syncUndo();
    this.errorBar = el('div', { class: 'cms-errorbar', attrs: { role: 'alert', hidden: 'hidden' } });
    this.mediaEl = this.medialib.build(); this.mediaEl.style.display = 'none';
    this.main = el('div', { class: 'cms-main' }, [this.header, this.errorBar, this.listview.build(), this.mediaEl]);
    this.scrim = el('div', { class: 'cms-scrim', on: { click: () => this.root.classList.remove('nav-open') } });
    this.toastHost = el('div', { class: 'cms-toasts', attrs: { 'aria-live': 'polite' } });
    this.root = el('div', { class: 'cms-root', attrs: { dir: 'rtl' } }, [this.sidebar.build(), this.main, this.scrim, this.toastHost]);
    return this.root;
  }

  setSection(section) {
    this.title.textContent = `${section.icon} ${section.label}`;
    this._media = section.id === 'assets';
    this.listview.el.style.display = this._media ? 'none' : '';
    this.mediaEl.style.display = this._media ? '' : 'none';
    if (this._media) this.medialib.refresh(); else this.listview.setSection(section);
    this.sidebar.refresh(); this.root.classList.remove('nav-open');
  }
  refresh() { this.sidebar.refresh(); if (this._media) this.medialib.refresh(); else this.listview.refresh(); this.syncUndo(); }
  openForm(section, obj) { this.form.open(section, obj); }
  openHistory() { this.history.open(); }
  openTrash() { this.trash.open(); }
  openInspector(id) { this.inspector.open(id); }
  openRelease() { this.release.open(); }

  /** Reflect undo/redo availability on the header buttons. */
  syncUndo() {
    if (!this.undoBtn) return;
    const u = this.app.undoMgr;
    const set = (b, on) => { b.disabled = !on; if (on) b.removeAttribute('disabled'); else b.setAttribute('disabled', 'true'); };
    set(this.undoBtn, u && u.canUndo());
    set(this.redoBtn, u && u.canRedo());
  }

  // ---- persistent error bar (C1) ----
  setError(msg) {
    clear(this.errorBar); this.errorBar.hidden = false;
    this.errorBar.append(
      el('span', { class: 'cms-errorbar__msg', text: `⚠️ ${msg}` }),
      el('span', { class: 'cms-spacer' }),
      btn({ emoji: '💾', label: 'تصدير نسخة احتياطية', cls: 'cms-btn--sm', onClick: () => this.app.exportBackup() }),
      btn({ emoji: '✖️', title: 'إخفاء', cls: 'cms-btn--sm', onClick: () => this.clearError() }),
    );
  }
  clearError() { this.errorBar.hidden = true; clear(this.errorBar); }

  toast(msg) {
    const c = el('div', { class: 'cms-toast', text: msg });
    this.toastHost.append(c);
    requestAnimationFrame(() => c.classList.add('is-in'));
    setTimeout(() => { c.classList.remove('is-in'); setTimeout(() => c.remove(), 300); }, 1900);
  }

  // ---- professional confirmation dialog (C3) — replaces window.confirm ----
  confirm({ title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', danger = false, requireText = null, note = '' }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (done) return; done = true; overlay.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') finish(false); };
      const okBtn = btn({ label: confirmLabel, cls: danger ? 'cms-danger' : 'cms-primary', onClick: () => finish(true) });
      let input = null;
      if (requireText) {
        okBtn.disabled = true; okBtn.setAttribute('disabled', 'true');
        input = el('input', { class: 'cms-input', attrs: { placeholder: `اكتب «${requireText}» للتأكيد`, dir: 'rtl' } });
        input.addEventListener('input', () => { const ok = input.value.trim() === requireText; okBtn.disabled = !ok; if (ok) okBtn.removeAttribute('disabled'); else okBtn.setAttribute('disabled', 'true'); });
      }
      const box = el('div', { class: 'cms-modal__box cms-confirm' }, [
        el('div', { class: 'cms-modal__head' }, [el('h2', { text: title })]),
        el('p', { class: 'cms-confirm__msg', text: message }),
        note ? el('p', { class: 'cms-mini', text: note }) : null,
        input,
        el('div', { class: 'cms-modal__foot' }, [okBtn, btn({ label: cancelLabel, onClick: () => finish(false) })]),
      ]);
      const overlay = el('div', { class: 'cms-modal', attrs: { role: 'alertdialog', 'aria-modal': 'true', 'aria-label': title } }, [box]);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(false); });
      document.addEventListener('keydown', onKey);
      this.root.append(overlay);
      setTimeout(() => (input || okBtn).focus(), 0);
    });
  }

  /** Text-input dialog (17A.3 bulk ops). Resolves the string, or null on cancel. */
  prompt({ title, message = '', placeholder = '', value = '', confirmLabel = 'موافق' }) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (done) return; done = true; overlay.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
      const input = el('input', { class: 'cms-input', attrs: { placeholder, value, dir: 'auto' } });
      const onKey = (e) => { if (e.key === 'Escape') finish(null); if (e.key === 'Enter') finish(input.value); };
      const box = el('div', { class: 'cms-modal__box cms-confirm' }, [
        el('div', { class: 'cms-modal__head' }, [el('h2', { text: title })]),
        message ? el('p', { class: 'cms-confirm__msg', text: message }) : null,
        input,
        el('div', { class: 'cms-modal__foot' }, [btn({ label: confirmLabel, cls: 'cms-primary', onClick: () => finish(input.value) }), btn({ label: 'إلغاء', onClick: () => finish(null) })]),
      ]);
      const overlay = el('div', { class: 'cms-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } }, [box]);
      overlay.addEventListener('click', (e) => { if (e.target === overlay) finish(null); });
      document.addEventListener('keydown', onKey);
      this.root.append(overlay);
      setTimeout(() => input.focus(), 0);
    });
  }

  _modal(title, body, onClose) {
    let closed = false;
    const close = () => { if (closed) return; closed = true; overlay.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const overlay = el('div', { class: 'cms-modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': title } }, [
      el('div', { class: 'cms-modal__box' }, [el('div', { class: 'cms-modal__head' }, [el('h2', { text: title }), btn({ emoji: '✖️', title: 'إغلاق', onClick: close })]), body]),
    ]);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    this.root.append(overlay);
    return { overlay, close };
  }

  async openGenerate() {
    const { overlay, close } = this._modal('⚙️ توليد ملفات البيانات', el('p', { class: 'cms-mini', text: 'جارٍ التحضير…' }));
    const files = await generateAll(this.app.store);
    if (!overlay.isConnected) return; // closed while awaiting
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
      el('div', { class: 'cms-modal__foot' }, [
        btn({ emoji: '⬇️', label: 'تنزيل الكل', cls: 'cms-primary', onClick: () => Object.entries(files).forEach(([n, o], i) => setTimeout(() => downloadJSON(n, o), i * 250)) }),
        btn({ emoji: '📦', label: 'حزمة النشر (ZIP)', onClick: () => this.app.buildDeploy() }),
      ]),
    ]);
    // swap the "preparing…" placeholder for the real content
    const boxBody = overlay.querySelector('.cms-modal__box');
    boxBody.replaceChild(body, boxBody.lastChild);
  }

  async preview(section, o) {
    const big = el('div', { class: 'cms-preview-media' }, [o.asset ? assetThumb(o.asset) : el('span', { class: 'cms-thumb cms-thumb--emoji', text: o.icon || '—' })]);
    const clean = { ...o }; delete clean._reorder;
    const pdfBtn = (o.asset && o.asset.type === 'pdf')
      ? btn({ emoji: '📄', label: 'فتح PDF', onClick: async () => { const a = await resolveAssetData(o.asset); if (a?.data) window.open(a.data, '_blank'); } })
      : null;
    const body = el('div', {}, [
      el('div', { class: 'cms-preview-head' }, [big, el('div', {}, [el('h3', { text: displayName(o) }), el('p', { class: 'cms-mini', text: localized(o.description) })])]),
      pdfBtn,
      el('pre', { class: 'cms-json', text: JSON.stringify(clean, null, 2) }),
    ]);
    this._modal('👁️ معاينة', body);
  }
}
