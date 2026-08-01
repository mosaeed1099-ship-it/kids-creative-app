/**
 * Story.js — the data model for a story book: metadata + an ordered list of
 * pages, with unlimited-pages CRUD (add / delete / reorder / duplicate). Pure
 * data; the editor builds live scene objects from it.
 */
import { uid } from '../util/geometry.js';

export function blankPage(opts = {}) {
  return { id: uid('p'), bgColor: opts.bgColor || '#fffdf7', bgImage: opts.bgImage || null, thumb: null, objects: [] };
}

export default class Story {
  constructor(data = null) {
    this.id = data?.id || uid('story');
    this.meta = {
      title: 'قصتي', author: '', childName: '', category: '',
      date: new Date().toISOString().slice(0, 10),
      ...(data?.meta || {}),
    };
    this.coverIndex = data?.coverIndex ?? 0;
    this.pages = (data?.pages && data.pages.length) ? data.pages.map(normalize) : [blankPage({ bgColor: '#eaf4ff' })];
  }

  get length() { return this.pages.length; }
  page(i) { return this.pages[i] || null; }
  isCover(i) { return i === this.coverIndex; }

  addPage(at = null) {
    const idx = at == null ? this.pages.length : at + 1;
    const p = blankPage({});
    this.pages.splice(idx, 0, p);
    return { page: p, index: idx };
  }
  deletePage(i) {
    if (this.pages.length <= 1) return false;
    this.pages.splice(i, 1);
    if (this.coverIndex >= this.pages.length) this.coverIndex = 0;
    return true;
  }
  duplicatePage(i) {
    const copy = JSON.parse(JSON.stringify(this.pages[i]));
    copy.id = uid('p');
    this.pages.splice(i + 1, 0, copy);
    return { page: copy, index: i + 1 };
  }
  movePage(from, to) {
    if (to < 0 || to >= this.pages.length || from === to) return false;
    const [p] = this.pages.splice(from, 1);
    this.pages.splice(to, 0, p);
    return true;
  }

  serialize() { return { id: this.id, meta: this.meta, coverIndex: this.coverIndex, pages: this.pages }; }
}

function normalize(p) {
  return { id: p.id || uid('p'), bgColor: p.bgColor || '#fffdf7', bgImage: p.bgImage || null, thumb: p.thumb || null, objects: Array.isArray(p.objects) ? p.objects : [] };
}
