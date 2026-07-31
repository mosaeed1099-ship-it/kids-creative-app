/**
 * PreviewModal — a large multi-page print preview. Renders each item as a full
 * page (via PreviewRenderer, honoring current settings) and offers Print /
 * Download PDF / Download ZIP right from the preview. Pages render lazily.
 */
import { h } from '../util.js';
import SettingsPanel from './SettingsPanel.js';

export default class PreviewModal {
  constructor(pc) { this.pc = pc; }

  async open(ids) {
    const pc = this.pc;
    this._pages = h('div', { class: 'pc-preview__pages' });
    const settings = SettingsPanel(pc.settings, () => this._rerender(ids));

    const actions = h('div', { class: 'pc-preview__actions' }, [
      h('button', { class: 'pc-btn pc-btn--primary', text: `🖨️ طباعة (${ids.length})`, on: { click: () => pc.printIds(ids) } }),
      h('button', { class: 'pc-btn', text: '⬇️ PDF', on: { click: () => pc.downloadPDF(ids) } }),
      h('button', { class: 'pc-btn', text: '🗜️ ZIP', on: { click: () => pc.downloadZIP(ids) } }),
    ]);

    const dialog = h('div', { class: 'pc-preview' }, [
      h('div', { class: 'pc-preview__head' }, [
        h('h3', { text: `معاينة الطباعة — ${ids.length} صفحة` }),
        h('button', { class: 'pc-iconbtn', text: '✕', on: { click: () => this.close() } }),
      ]),
      h('div', { class: 'pc-preview__body' }, [
        h('div', { class: 'pc-preview__settings' }, [settings]),
        this._pages,
      ]),
      actions,
    ]);
    this.el = h('div', { class: 'pc-backdrop', on: { click: (e) => { if (e.target === this.el) this.close(); } } }, [dialog]);
    document.body.appendChild(this.el);
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    await this._rerender(ids);
  }

  async _rerender(ids) {
    if (!this._pages) return;
    this._pages.replaceChildren(...ids.map(() => h('div', { class: 'pc-page pc-skel' })));
    const canvases = await this.pc.renderPages(ids);
    this._pages.replaceChildren(...canvases.map((c, i) => {
      const wrap = h('div', { class: 'pc-page' });
      const img = new Image(); img.className = 'pc-page__img'; img.src = c.toDataURL('image/jpeg', 0.8);
      wrap.append(img, h('div', { class: 'pc-page__no', text: `صفحة ${i + 1}` }));
      return wrap;
    }));
  }

  close() { this.el?.classList.remove('is-open'); const el = this.el; setTimeout(() => el?.remove(), 200); this.el = null; }
}
