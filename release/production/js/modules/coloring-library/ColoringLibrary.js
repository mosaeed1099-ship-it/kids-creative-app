/**
 * ColoringLibrary — the premium "Netflix for kids" gallery controller.
 *
 * Consumes ONLY the Content Engine public API (via LibraryModel) and calls a
 * generic `onOpen(item)` when a card is tapped (the example wires this to the
 * Coloring Module through ColoringLauncher). It renders:
 *   - Home (shelves): featured packs, continue, recent, favorites, per-pack rows
 *   - Results (grid/list): search + filters, with infinite scrolling
 * plus loading skeletons and empty states.
 */
import LibraryModel from './LibraryModel.js';
import LazyThumb from './LazyThumb.js';
import LibraryUI from './ui/LibraryUI.js';
import Row from './ui/Row.js';
import CardView from './ui/CardView.js';
import FilterPanel from './ui/FilterPanel.js';
import { skeletonRow, skeletonGrid } from './ui/Skeleton.js';
import { h } from './ui/h.js';

const CHUNK = 24;

export default class ColoringLibrary {
  constructor({ mount, content, onOpen = null, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.content = content;
    this.onOpen = onOpen || (() => {});
    this.options = options;
    this.model = new LibraryModel({ content });
    this.lazy = new LazyThumb();
    this.resolveThumb = options.resolveThumb || ((it) => it?.asset?.src || '');

    this.state = { view: 'home', query: '', filters: { ageGroup: null, difficulty: null, language: null, packId: null, favorites: false } };
    this._loaded = false;
    this._io = null;
    this._searchTimer = 0;
  }

  async mount() {
    this.ui = LibraryUI({ title: this.options.title || 'مكتبة التلوين' });
    this.mountEl.appendChild(this.ui.el);
    this._wire();

    // loading skeletons
    this.ui.contentEl.replaceChildren(skeletonRow('مميّزة', 5), skeletonRow('الحيوانات', 6), skeletonGrid(8));

    await this.model.ensureLoaded();
    this._loaded = true;
    this.facets = this.model.facets();
    this._buildFilters();
    this.render();
    return this;
  }

  // ---------- events ----------
  _wire() {
    const { searchInput, tabs, filterToggle, filtersWrap } = this.ui;
    searchInput.addEventListener('input', () => {
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => { this.state.query = searchInput.value; this.render(); }, 200);
    });
    tabs.home.addEventListener('click', () => this._setView('home'));
    tabs.grid.addEventListener('click', () => this._setView('grid'));
    tabs.list.addEventListener('click', () => this._setView('list'));
    filterToggle.addEventListener('click', () => { filtersWrap.hidden = !filtersWrap.hidden; });
  }

  _setView(view) {
    this.state.view = view;
    const { tabs } = this.ui;
    tabs.home.classList.toggle('is-active', view === 'home');
    tabs.grid.classList.toggle('is-active', view === 'grid');
    tabs.list.classList.toggle('is-active', view === 'list');
    if (view === 'home') { this.state.query = ''; this.ui.searchInput.value = ''; }
    this.render();
  }

  _buildFilters() {
    this._filterPanel = new FilterPanel({
      facets: this.facets,
      state: { ...this.state.filters },
      onChange: (s) => { this.state.filters = s; if (this.state.view === 'home') this.state.view = 'grid'; this._syncTabs(); this.render(); },
    });
    this.ui.filtersWrap.replaceChildren(this._filterPanel.build());
  }

  _syncTabs() {
    const { tabs } = this.ui;
    tabs.home.classList.toggle('is-active', this.state.view === 'home');
    tabs.grid.classList.toggle('is-active', this.state.view === 'grid');
    tabs.list.classList.toggle('is-active', this.state.view === 'list');
  }

  _anyFilter() {
    const f = this.state.filters;
    return !!(f.ageGroup || f.difficulty || f.language || f.packId || f.favorites);
  }

  open(item) { this.onOpen(item); }

  /** Re-read recent/favorites/progress and re-render (call after returning from coloring). */
  refresh() { if (this._loaded) this.render(); }

  // ---------- rendering ----------
  render() {
    if (!this._loaded) return;
    if (this._io) { this._io.disconnect(); this._io = null; }
    const resultsMode = this.state.view !== 'home' || this.state.query.trim() || this._anyFilter();
    if (resultsMode) this._renderResults();
    else this._renderHome();
  }

  _renderHome() {
    const m = this.model;
    const rows = [];

    // Featured packs — big banner cards that browse into the pack
    const featured = m.featuredPacks();
    if (featured.length) rows.push(this._featuredRow(featured));

    const cont = m.continueItems();
    if (cont.length) rows.push(Row('أكمل التلوين', cont, { lib: this, icon: '▶' }));

    const recent = m.recentItems();
    if (recent.length) rows.push(Row('المفتوحة مؤخرًا', recent, { lib: this, icon: '🕘' }));

    const favs = m.favoriteItems();
    if (favs.length) rows.push(Row('المفضلة', favs, { lib: this, icon: '❤️' }));

    // one shelf per pack
    for (const p of m.packsWithItems()) {
      rows.push(Row(p.title.ar || p.id, p.items, { lib: this, icon: p.emoji }));
    }

    this.ui.contentEl.replaceChildren(...rows);
  }

  _featuredRow(packs) {
    const cards = packs.map((p) => h('button', {
      class: 'clrlib-pack anim-pop',
      on: { click: () => { this.state.filters.packId = p.id; this.state.view = 'grid'; this._syncTabs(); this._buildFilters(); this.render(); } },
    }, [
      h('span', { class: 'clrlib-pack__emoji', text: p.emoji }),
      h('span', { class: 'clrlib-pack__title', text: p.title.ar || p.id }),
      h('span', { class: 'clrlib-pack__count', text: `${p.items.length} صفحة` }),
    ]));
    return h('section', { class: 'clrlib-row' }, [
      h('div', { class: 'clrlib-row__head' }, [h('h3', { class: 'clrlib-row__title', text: '✨ باقات مميّزة' })]),
      h('div', { class: 'clrlib-row__track clrlib-row__track--packs' }, cards),
    ]);
  }

  _renderResults() {
    const items = this.model.query(this.state.query, this.state.filters);
    const isList = this.state.view === 'list';

    if (!items.length) { this.ui.contentEl.replaceChildren(this._emptyState()); return; }

    const head = h('div', { class: 'clrlib-results__head' }, [
      h('span', { class: 'clrlib-results__count', text: `${items.length} رسمة` }),
    ]);
    const container = h('div', { class: isList ? 'clrlib-list' : 'clrlib-grid' });
    const sentinel = h('div', { class: 'clrlib-sentinel' });
    this.ui.contentEl.replaceChildren(head, container, sentinel);

    // infinite scroll: render in chunks
    let shown = 0;
    const renderChunk = () => {
      const next = items.slice(shown, shown + CHUNK);
      next.forEach((it) => container.appendChild(isList ? this._listRow(it) : CardView(it, { lib: this })));
      shown += next.length;
      if (shown >= items.length && this._io) { this._io.disconnect(); this._io = null; }
    };
    renderChunk();
    if (items.length > CHUNK && typeof IntersectionObserver !== 'undefined') {
      this._io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) renderChunk(); }, { rootMargin: '400px' });
      this._io.observe(sentinel);
    } else {
      while (shown < items.length) renderChunk();
    }
  }

  _listRow(item) {
    const fav = this.model.isFavorite(item.id);
    const heart = h('button', { class: `clrlib-heart ${fav ? 'is-fav' : ''}`, text: fav ? '❤️' : '🤍',
      on: { click: (e) => { e.stopPropagation(); const nf = this.model.toggleFavorite(item.id); heart.classList.toggle('is-fav', nf); heart.textContent = nf ? '❤️' : '🤍'; } } });
    return h('button', { class: 'clrlib-listrow', on: { click: () => this.open(item) } }, [
      h('span', { class: 'clrlib-listrow__emoji', text: item.thumbnail?.value || '🎨' }),
      h('span', { class: 'clrlib-listrow__title', text: item.getTitle('ar') }),
      h('span', { class: 'clrlib-chip', text: (item.difficulty || '') }),
      this.model.hasProgress(item.id) ? h('span', { class: 'clrlib-card__badge', text: '▶' }) : h('span'),
      heart,
    ]);
  }

  _emptyState() {
    return h('div', { class: 'clrlib-empty' }, [
      h('div', { class: 'clrlib-empty__emoji', text: '🔍' }),
      h('div', { class: 'clrlib-empty__title', text: 'لا توجد نتائج' }),
      h('div', { class: 'clrlib-empty__text', text: 'جرّب كلمة أخرى أو امسح الفلاتر.' }),
      h('button', { class: 'clrlib-empty__btn', text: '↺ الرئيسية', on: { click: () => this._setView('home') } }),
    ]);
  }

  destroy() { this._io?.disconnect(); this.lazy.disconnect(); this.ui?.el.remove(); }
}
