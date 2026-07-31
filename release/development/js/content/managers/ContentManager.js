/**
 * ContentManager — the ONE façade a feature module talks to.
 *
 * Wires the registry, loader, cache, search, favorites and recent managers,
 * and exposes the clean public API:
 *
 *   await cm.init({ catalog: 'catalog.json' });   // loads pack descriptors (lazy)
 *   await cm.loadPack('animals');                 // loads + indexes a pack
 *   cm.loadCategory('animals-coloring');          // items in a category
 *   cm.search('lion', { assetType:'coloring' });  // ranked results
 *   cm.filter({ ageGroup:'preschool', favorites:true });
 *   cm.getFavorites(); cm.getRecent();
 *   cm.getContent('animals-coloring-lion');
 *   cm.open(id);                                   // marks recent, returns item
 *
 * No rendering, no feature logic — just data access.
 */
import Emitter from '../util/events.js';
import Persist from '../util/persist.js';
import ContentRegistry from '../registry/ContentRegistry.js';
import ContentCache from '../io/ContentCache.js';
import ContentLoader from '../io/ContentLoader.js';
import SearchEngine from '../search/SearchEngine.js';
import Filter from '../search/Filter.js';
import Collection from '../model/Collection.js';
import FavoritesManager from './FavoritesManager.js';
import RecentManager from './RecentManager.js';

export default class ContentManager {
  /**
   * @param {object} opts
   * @param {string} [opts.base] - base URL for content JSON (e.g. import.meta.url of a data folder)
   * @param {ContentCache} [opts.cache]
   */
  constructor({ base = '', cache = null, persist = null } = {}) {
    this.events = new Emitter();
    const store = persist || new Persist('kcs.content');
    this.registry = new ContentRegistry({ emitter: this.events });
    this.cache = cache || new ContentCache();
    this.loader = new ContentLoader({ base, cache: this.cache });
    this.search_ = new SearchEngine();
    this.favorites = new FavoritesManager({ emitter: this.events, persist: store });
    this.recent = new RecentManager({ emitter: this.events, persist: store });

    this.catalog = null;   // raw catalog { version, packs:[descriptor] }
    this._ready = false;
  }

  /** Load the catalog (pack descriptors only — packs load lazily). */
  async init({ catalog = 'catalog.json' } = {}) {
    this.catalog = await this.loader.loadCatalog(catalog);
    this._ready = true;
    this.events.emit('ready', this.catalog);
    return this.catalog;
  }

  /** Pack descriptors from the catalog (metadata only). */
  getPacks() { return this.catalog ? [...this.catalog.packs] : []; }
  getPackDescriptor(id) { return this.getPacks().find((p) => p.id === id) || null; }
  isPackLoaded(id) { return this.registry.hasPack(id); }

  /**
   * loadPack — fetch + register a pack (idempotent). Accepts a pack id from the
   * catalog, a descriptor, or a direct JSON path.
   */
  async loadPack(idOrDescriptorOrPath) {
    let descriptor = idOrDescriptorOrPath;
    if (typeof idOrDescriptorOrPath === 'string') {
      const fromCatalog = this.getPackDescriptor(idOrDescriptorOrPath);
      descriptor = fromCatalog || idOrDescriptorOrPath; // else treat as a path
    }
    const id = descriptor?.id;
    if (id && this.registry.hasPack(id)) return this.registry.getPack(id);

    const pack = await this.loader.loadPack(descriptor);
    this.registry.registerPack(pack);
    this._reindexSearch();
    this.events.emit('pack:loaded', pack);
    return pack;
  }

  /** Ensure every catalog pack is loaded (use sparingly — prefer lazy). */
  async loadAll() {
    for (const d of this.getPacks()) await this.loadPack(d); // eslint-disable-line no-await-in-loop
    return this.registry.allPacks();
  }

  /** Items in a category (loads the owning pack if a descriptor knows it). */
  loadCategory(categoryId) {
    return new Collection(this.registry.byCategory(categoryId)).sortBy('order');
  }

  // ---- query API ----

  /** Full-text search over loaded items (ranked). Returns SearchResult[]. */
  search(query, options = {}) {
    return this.search_.search(query, options);
  }

  /** Filter loaded items by a Filter spec (favorites/recent aware). */
  filter(spec = {}) {
    const f = Filter.from(spec);
    const items = f.apply(this.registry.allItems(), {
      favorites: this.favorites.asSet(),
      recent: this.recent.asSet(),
    });
    return new Collection(items);
  }

  /** A chainable collection over all loaded items. */
  collection() { return this.registry.collection(); }

  getContent(id) { return this.registry.getItem(id); }
  getCategory(id) { return this.registry.getCategory(id); }
  getPack(id) { return this.registry.getPack(id); }
  facets() { return this.registry.facets(); }

  // ---- favorites / recent ----

  getFavorites() {
    return new Collection(this.favorites.ids().map((id) => this.registry.getItem(id)).filter(Boolean));
  }

  getRecent(limit) {
    return new Collection(this.recent.ids(limit).map((id) => this.registry.getItem(id)).filter(Boolean));
  }

  toggleFavorite(id) { return this.favorites.toggle(id); }
  isFavorite(id) { return this.favorites.has(id); }

  /** Mark an item as opened (updates recent) and return it. */
  open(id) {
    const item = this.registry.getItem(id);
    if (item) { this.recent.push(id); this.events.emit('open', item); }
    return item || null;
  }

  _reindexSearch() { this.search_.setItems(this.registry.allItems()); }
}
