/**
 * LibraryPanel.js — the sticker library UI, powered entirely by the Content
 * Engine public API: pack tabs, category + favourites + recent filters, live
 * search, and a grid of thumbnails. Tapping a sticker adds it to the scene;
 * the ⭐ toggles a favourite.
 */
import { el, clear } from '../../../utils/dom.js';
import { chip } from './helpers.js';
import { stickerThumb } from '../scene/visual.js';

export default class LibraryPanel {
  constructor(app) {
    this.app = app;
    this.pack = null;      // active pack id
    this.view = 'pack';    // 'pack' | 'fav' | 'recent' | 'cat:<id>'
    this.query = '';
  }

  build() {
    const cm = this.app.content;
    const packs = cm.getPacks();
    this.pack = packs[0]?.id || null;

    this.packTabs = el('div', { class: 'ss-tabs' },
      packs.map((p) => chip({
        label: localized(p.title), emoji: p.thumbnail?.value || '📦',
        active: p.id === this.pack,
        onClick: () => { this.pack = p.id; this.view = 'pack'; this.query = ''; this.search.value = ''; this.refresh(); },
      })));

    this.search = el('input', {
      class: 'ss-search', attrs: { type: 'search', placeholder: 'ابحث عن ملصق…', 'aria-label': 'بحث', dir: 'rtl' },
      on: { input: (e) => { this.query = e.target.value; this.refresh(); } },
    });

    this.chips = el('div', { class: 'ss-chips' });
    this.grid = el('div', { class: 'ss-grid' });

    this.el = el('aside', { class: 'ss-library', attrs: { 'aria-label': 'مكتبة الملصقات' } }, [
      el('h2', { class: 'ss-library__title', text: '⭐ الملصقات' }),
      this.packTabs,
      this.search,
      this.chips,
      this.grid,
    ]);
    this.refresh();
    return this;
  }

  _items() {
    const cm = this.app.content;
    if (this.query.trim()) return cm.search(this.query.trim(), { limit: 120 }).map((r) => r.item);
    if (this.view === 'fav') return cm.getFavorites().toArray();
    if (this.view === 'recent') return cm.getRecent(60).toArray();
    if (this.view.startsWith('cat:')) return cm.loadCategory(this.view.slice(4)).toArray();
    return cm.getPack(this.pack)?.items || [];
  }

  refresh() {
    const cm = this.app.content;
    // active-pack tab highlight
    [...this.packTabs.children].forEach((c, i) => c.classList.toggle('is-active', cm.getPacks()[i]?.id === this.pack));

    // filter chips: All / Favorites / Recent + this pack's categories
    clear(this.chips);
    const add = (label, emoji, key) => this.chips.append(chip({
      label, emoji, active: this.view === key && !this.query.trim(),
      onClick: () => { this.view = key; this.query = ''; this.search.value = ''; this.refresh(); },
    }));
    add('الكل', '🗂️', 'pack');
    add('المفضلة', '⭐', 'fav');
    add('الأخيرة', '🕓', 'recent');
    for (const c of (cm.getPack(this.pack)?.categories || [])) add(localized(c.title), c.icon || '📁', `cat:${c.id}`);

    // grid
    clear(this.grid);
    const items = this._items().filter((i) => i && i.assetType === 'sticker');
    if (!items.length) { this.grid.append(el('p', { class: 'ss-empty', text: 'لا توجد ملصقات هنا.' })); return; }
    for (const item of items) {
      const fav = cm.isFavorite(item.id);
      const star = el('button', {
        class: `ss-fav ${fav ? 'is-on' : ''}`, attrs: { type: 'button', title: 'مفضلة', 'aria-label': 'مفضلة' }, text: fav ? '⭐' : '☆',
        on: { click: (e) => { e.stopPropagation(); cm.toggleFavorite(item.id); this.refresh(); } },
      });
      const cell = el('button', {
        class: 'ss-cell', attrs: { type: 'button', title: item.getTitle('ar'), 'aria-label': item.getTitle('ar') },
        on: { click: () => this.app.addSticker(item) },
      }, [stickerThumb(item), star]);
      this.grid.append(cell);
    }
  }
}

function localized(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t.ar ?? t.default ?? Object.values(t)[0] ?? '';
}
