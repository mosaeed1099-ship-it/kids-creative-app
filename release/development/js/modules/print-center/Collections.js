/**
 * Collections — named groupings of printable items:
 *   - favorites        (from the Content Engine: content.getFavorites)
 *   - printed          (recently printed — tracked here)
 *   - weekly / school / home   (curated lists, persisted, editable)
 *
 * All offline (localStorage). Consumes only the Content Engine public API for
 * favorites/recent.
 */
import { Store, Emitter } from './util.js';

const BUILTIN = [
  { id: 'favorites', title: 'المفضلة', icon: '❤️', kind: 'favorites' },
  { id: 'printed', title: 'طُبعت مؤخرًا', icon: '🕘', kind: 'printed' },
  { id: 'weekly', title: 'أنشطة الأسبوع', icon: '📅', kind: 'custom' },
  { id: 'school', title: 'باقة المدرسة', icon: '🎒', kind: 'custom' },
  { id: 'home', title: 'باقة المنزل', icon: '🏠', kind: 'custom' },
];

export default class Collections {
  constructor({ content, store = null } = {}) {
    this.content = content;
    this.events = new Emitter();
    this.store = store || new Store('kcs');
    this.custom = this.store.get('kcs.print.collections', null);
    this.printed = this.store.get('kcs.print.printed', []);
  }

  list() { return BUILTIN.map((c) => ({ ...c })); }
  get(id) { return BUILTIN.find((c) => c.id === id) || null; }

  /** Seed the curated collections from the available printable items once. */
  seed(items) {
    if (this.custom) return;
    const by = (fn) => items.filter(fn).map((i) => i.id);
    this.custom = {
      weekly: items.slice(0, 5).map((i) => i.id),
      school: by((i) => ['worksheet', 'flashcard', 'trace'].includes(i.assetType)),
      home: by((i) => ['coloring', 'activity', 'poster'].includes(i.assetType)),
    };
    this.store.set('kcs.print.collections', this.custom);
  }

  /** Resolve a collection to an array of item ids. */
  ids(id) {
    if (id === 'favorites') return this.content?.getFavorites?.().ids?.() || [];
    if (id === 'printed') return [...this.printed];
    return this.custom?.[id] ? [...this.custom[id]] : [];
  }

  addTo(collectionId, itemId) {
    if (!this.custom[collectionId]) this.custom[collectionId] = [];
    if (!this.custom[collectionId].includes(itemId)) { this.custom[collectionId].push(itemId); this.store.set('kcs.print.collections', this.custom); this.events.emit('change', collectionId); }
  }
  removeFrom(collectionId, itemId) {
    if (this.custom[collectionId]) { this.custom[collectionId] = this.custom[collectionId].filter((x) => x !== itemId); this.store.set('kcs.print.collections', this.custom); this.events.emit('change', collectionId); }
  }

  markPrinted(ids = []) {
    const set = [...ids].reverse();
    for (const id of set) this.printed = [id, ...this.printed.filter((x) => x !== id)];
    this.printed = this.printed.slice(0, 40);
    this.store.set('kcs.print.printed', this.printed);
    this.events.emit('change', 'printed');
  }
}
