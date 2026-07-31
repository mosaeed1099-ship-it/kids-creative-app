/**
 * PrintCenter — the PDF & Print Center controller. A premium, fully-offline
 * place to browse, preview, organize and print all printable activities.
 * Consumes ONLY the Content Engine public API for the library, favorites and
 * recent; everything else (queue, settings, collections, PDF/ZIP export,
 * printing) is local and offline.
 */
import PrintCenterUI from './ui/PrintCenterUI.js';
import CardView from './ui/CardView.js';
import PreviewModal from './ui/PreviewModal.js';
import QueuePanel from './ui/QueuePanel.js';
import PreviewRenderer from './PreviewRenderer.js';
import PrintService from './PrintService.js';
import PrintQueue from './PrintQueue.js';
import PrintSettings from './PrintSettings.js';
import Collections from './Collections.js';
import MiniPDF from './export/MiniPDF.js';
import MiniZip from './export/MiniZip.js';
import { h, dataURLtoBytes, download } from './util.js';
import LazyThumb from '../coloring-library/LazyThumb.js'; // reuse (import only)

const PRINTABLE = ['coloring', 'trace', 'pdf', 'worksheet', 'flashcard', 'activity', 'certificate', 'poster'];
const TYPE_LABEL = { coloring: 'تلوين', trace: 'تتبّع', pdf: 'PDF', worksheet: 'ورقة عمل', flashcard: 'بطاقة', activity: 'نشاط', certificate: 'شهادة', poster: 'بوستر' };

export default class PrintCenter {
  constructor({ mount, content, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content;
    this.options = options;
    this.resolveAsset = options.resolveAsset || ((it) => it?.asset?.src);
    this.resolveThumb = options.resolveThumb || this.resolveAsset;

    this.renderer = new PreviewRenderer();
    this.queue = new PrintQueue();
    this.settings = new PrintSettings();
    this.collections = new Collections({ content });
    this.lazy = new LazyThumb();

    this.state = { collection: null, query: '', filters: { assetType: null } };
    this._selected = new Set();
    this._all = [];
  }

  mount() {
    this.ui = PrintCenterUI();
    this.mountEl.appendChild(this.ui.el);
    this.queuePanel = new QueuePanel(this);
    this.ui.el.appendChild(this.queuePanel.build());

    this.ui.queueBtn.addEventListener('click', () => this.queuePanel.toggle());
    this.ui.searchInput.addEventListener('input', () => { this.state.query = this.ui.searchInput.value; this._renderGrid(); });
    this.queue.events.on('change', () => { this._updateQueueBtn(); this._renderGrid(); });

    this._all = this._loadItems();
    this.collections.seed(this._all);
    this._buildSidebar();
    this._buildFilters();
    this._updateQueueBtn();
    this.render();
    return this;
  }

  _loadItems() {
    const seen = new Set(); const out = [];
    for (const t of PRINTABLE) for (const it of this.content.filter({ assetType: t }).toArray()) if (!seen.has(it.id)) { seen.add(it.id); out.push(it); }
    return out;
  }

  // ---------- data resolution for cards ----------
  getItem(id) { return this.content.getContent(id); }
  isFav(id) { return this.content.isFavorite(id); }
  toggleFav(id) { const f = this.content.toggleFavorite(id); this._buildSidebar(); return f; }
  inQueue(id) { return this.queue.has(id); }
  toggleQueue(id) { return this.queue.toggle(id); }
  isSelected(id) { return this._selected.has(id); }
  toggleSelect(id) { this._selected.has(id) ? this._selected.delete(id) : this._selected.add(id); this._renderSelbar(); return this._selected.has(id); }

  // ---------- current view ----------
  _currentItems() {
    if (this.state.collection) {
      const ids = this.collections.ids(this.state.collection);
      const map = new Map(this._all.map((i) => [i.id, i]));
      return ids.map((id) => map.get(id)).filter(Boolean);
    }
    let items = this._all;
    const q = this.state.query.trim().toLowerCase();
    if (q) items = items.filter((i) => i.getTitle('ar').toLowerCase().includes(q) || i.getTitle('en').toLowerCase().includes(q) || i.tagSlugs().some((t) => t.includes(q)));
    if (this.state.filters.assetType) items = items.filter((i) => i.assetType === this.state.filters.assetType);
    return items;
  }

  render() { this._buildSidebar(); this._renderGrid(); this._renderSelbar(); }

  _renderGrid() {
    const items = this._currentItems();
    if (!items.length) { this.ui.grid.replaceChildren(h('div', { class: 'pc-emptybig' }, [h('div', { class: 'pc-emptybig__e', text: '🗂️' }), h('div', { text: 'لا توجد أنشطة هنا' })])); return; }
    this.ui.grid.replaceChildren(...items.map((it) => CardView(it, { pc: this })));
  }

  _buildSidebar() {
    const mk = (id, icon, title, count) => h('button', {
      class: `pc-side ${this.state.collection === id ? 'is-active' : ''}`,
      on: { click: () => { this.state.collection = id; this.state.query = ''; this.ui.searchInput.value = ''; this.render(); } },
    }, [h('span', { class: 'pc-side__i', text: icon }), h('span', { class: 'pc-side__t', text: title }), h('span', { class: 'pc-side__c', text: count != null ? String(count) : '' })]);

    const all = h('button', { class: `pc-side ${!this.state.collection ? 'is-active' : ''}`, on: { click: () => { this.state.collection = null; this.render(); } } },
      [h('span', { class: 'pc-side__i', text: '🗂️' }), h('span', { class: 'pc-side__t', text: 'كل الأنشطة' }), h('span', { class: 'pc-side__c', text: String(this._all.length) })]);

    const cols = this.collections.list().map((c) => mk(c.id, c.icon, c.title, this.collections.ids(c.id).length));
    this.ui.sidebar.replaceChildren(h('div', { class: 'pc-side__h', text: '📚 المجموعات' }), all, ...cols);
  }

  _buildFilters() {
    const chip = (label, val) => h('button', { class: `pc-chip ${this.state.filters.assetType === val ? 'is-on' : ''}`, text: label,
      on: { click: () => { this.state.filters.assetType = this.state.filters.assetType === val ? null : val; this.state.collection = null; this._buildFilters(); this._renderGrid(); } } });
    const types = [...new Set(this._all.map((i) => i.assetType))];
    this.ui.filters.replaceChildren(h('span', { class: 'pc-filters__lbl', text: 'النوع:' }), chip('الكل', null), ...types.map((t) => chip(TYPE_LABEL[t] || t, t)));
  }

  _renderSelbar() {
    const n = this._selected.size;
    if (!n) { this.ui.selbar.replaceChildren(); return; }
    const ids = [...this._selected];
    this.ui.selbar.replaceChildren(
      h('span', { class: 'pc-selbar__n', text: `محدّد: ${n}` }),
      h('button', { class: 'pc-btn', text: '➕ للطابور', on: { click: () => { this.queue.addMany(ids); } } }),
      h('button', { class: 'pc-btn', text: '👁️ معاينة', on: { click: () => this.preview(ids) } }),
      h('button', { class: 'pc-btn pc-btn--primary', text: '🖨️ طباعة المحدد', on: { click: () => this.printIds(ids) } }),
      h('button', { class: 'pc-btn pc-btn--danger', text: '✕ إلغاء التحديد', on: { click: () => { this._selected.clear(); this.render(); } } }),
    );
  }

  _updateQueueBtn() { this.ui.queueBtn.textContent = `🖨️ الطابور (${this.queue.size()})`; }

  // ---------- render pages ----------
  async renderPages(ids) {
    const s = this.settings.get();
    const out = [];
    for (const id of ids) { const it = this.getItem(id); if (!it) continue; out.push(await this.renderer.renderPage(this.resolveAsset(it), s)); } // eslint-disable-line no-await-in-loop
    return out;
  }

  // ---------- actions ----------
  preview(ids) { if (ids.length) new PreviewModal(this).open(ids); }

  async printIds(ids) {
    if (!ids.length) return;
    const canvases = await this.renderPages(ids);
    PrintService.print(canvases, this.settings.get());
    this.collections.markPrinted(ids);
    this._buildSidebar();
  }

  async downloadPDF(ids) {
    if (!ids.length) return;
    const canvases = await this.renderPages(ids);
    const pages = canvases.map((c) => ({ jpeg: dataURLtoBytes(c.toDataURL('image/jpeg', 0.9)), w: c.width, h: c.height }));
    download(MiniPDF.build(pages, this.settings.get()), 'activities.pdf');
    this.collections.markPrinted(ids); this._buildSidebar();
  }

  async downloadZIP(ids) {
    if (!ids.length) return;
    const canvases = await this.renderPages(ids);
    const files = canvases.map((c, i) => ({ name: `page-${i + 1}.png`, bytes: dataURLtoBytes(c.toDataURL('image/png')) }));
    download(MiniZip.build(files), 'activities.zip');
    this.collections.markPrinted(ids); this._buildSidebar();
  }

  destroy() { this.lazy.disconnect(); this.ui?.el.remove(); }
}
