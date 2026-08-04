/**
 * Filmstrip.js — the page manager: thumbnails for every page (add / delete /
 * duplicate / reorder / select), a cover badge, and the page indicator.
 */
import { el, clear } from '../../../utils/dom.js';
import { iconBtn } from './helpers.js';

export default class Filmstrip {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    this.list = el('div', { class: 'st-pages' });
    this.label = el('span', { class: 'st-page-label', text: 'صفحة 1' });
    this.el = el('div', { class: 'st-filmstrip' }, [
      el('div', { class: 'st-film-ctrls' }, [
        iconBtn({ emoji: '➕', title: 'صفحة جديدة', onClick: () => a.addPage() }),
        iconBtn({ emoji: '📑', title: 'تكرار الصفحة', onClick: () => a.duplicatePage() }),
        iconBtn({ emoji: '🗑️', title: 'حذف الصفحة', onClick: () => a.deletePage() }),
        iconBtn({ emoji: '◀', title: 'تحريك يمينًا', onClick: () => a.movePage(-1) }),
        iconBtn({ emoji: '▶', title: 'تحريك يسارًا', onClick: () => a.movePage(1) }),
        this.label,
      ]),
      this.list,
    ]);
    return this.el;
  }

  refresh() {
    const a = this.app;
    clear(this.list);
    a.story.pages.forEach((p, i) => {
      const thumb = el('div', { class: `st-page-thumb ${i === a.pageIndex ? 'is-active' : ''}`, attrs: { role: 'button', title: `صفحة ${i + 1}` }, on: { click: () => a.gotoPage(i) } });
      thumb.style.background = p.bgColor || '#fff';
      if (p.thumb) thumb.append(el('img', { attrs: { src: p.thumb, alt: '' } }));
      if (a.story.isCover(i)) thumb.append(el('span', { class: 'st-cover-badge', text: 'الغلاف' }));
      thumb.append(el('span', { class: 'st-page-num', text: String(i + 1) }));
      this.list.append(thumb);
    });
  }

  updateLabel() { this.label.textContent = `صفحة ${this.app.pageIndex + 1} / ${this.app.story.length}`; }
}
