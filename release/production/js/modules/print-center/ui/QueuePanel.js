/**
 * QueuePanel — a slide-in panel showing the print queue with reorder / remove /
 * clear, the print settings, and the queue actions (preview / print / PDF /
 * ZIP). "Continue printing" = the queue persists and reappears here.
 */
import { h } from '../util.js';
import SettingsPanel from './SettingsPanel.js';

export default class QueuePanel {
  constructor(pc) { this.pc = pc; }

  build() {
    this._list = h('div', { class: 'pc-qlist' });
    this._count = h('span', { class: 'pc-qcount' });
    const actions = h('div', { class: 'pc-qactions' }, [
      h('button', { class: 'pc-btn pc-btn--primary', text: '🖨️ طباعة الطابور', on: { click: () => this.pc.printIds(this.pc.queue.list()) } }),
      h('button', { class: 'pc-btn', text: '👁️ معاينة', on: { click: () => this.pc.preview(this.pc.queue.list()) } }),
      h('button', { class: 'pc-btn', text: '⬇️ PDF', on: { click: () => this.pc.downloadPDF(this.pc.queue.list()) } }),
      h('button', { class: 'pc-btn', text: '🗜️ ZIP', on: { click: () => this.pc.downloadZIP(this.pc.queue.list()) } }),
      h('button', { class: 'pc-btn pc-btn--danger', text: '🗑️ إفراغ', on: { click: () => this.pc.queue.clear() } }),
    ]);

    const panel = h('div', { class: 'pc-queue' }, [
      h('div', { class: 'pc-queue__head' }, [h('h3', { text: '🖨️ طابور الطباعة' }), this._count, h('button', { class: 'pc-iconbtn', text: '✕', on: { click: () => this.toggle(false) } })]),
      h('div', { class: 'pc-queue__label', text: 'إعدادات الطباعة' }),
      SettingsPanel(this.pc.settings),
      h('div', { class: 'pc-queue__label', text: 'الصفحات' }),
      this._list,
      actions,
    ]);
    this.el = h('div', { class: 'pc-queuewrap' }, [panel]);
    this.pc.queue.events.on('change', () => this.refresh());
    return this.el;
  }

  toggle(open) { this.el.classList.toggle('is-open', open == null ? !this.el.classList.contains('is-open') : open); if (this.el.classList.contains('is-open')) this.refresh(); }

  refresh() {
    const ids = this.pc.queue.list();
    this._count.textContent = `${ids.length} صفحة`;
    if (!ids.length) { this._list.replaceChildren(h('div', { class: 'pc-empty', text: 'الطابور فارغ — أضف أنشطة للطباعة.' })); return; }
    this._list.replaceChildren(...ids.map((id, i) => {
      const it = this.pc.getItem(id);
      return h('div', { class: 'pc-qrow' }, [
        h('span', { class: 'pc-qrow__e', text: it?.thumbnail?.value || '📄' }),
        h('span', { class: 'pc-qrow__t', text: it ? it.getTitle('ar') : id }),
        h('button', { class: 'pc-qmini', title: 'أعلى', on: { click: () => this.pc.queue.move(id, -1) }, ...(i === 0 ? { disabled: 'true' } : {}) }, '▲'),
        h('button', { class: 'pc-qmini', title: 'أسفل', on: { click: () => this.pc.queue.move(id, 1) }, ...(i === ids.length - 1 ? { disabled: 'true' } : {}) }, '▼'),
        h('button', { class: 'pc-qmini pc-qmini--x', title: 'إزالة', on: { click: () => this.pc.queue.remove(id) } }, '✕'),
      ]);
    }));
  }
}
