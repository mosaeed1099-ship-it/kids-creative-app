/**
 * LibraryModel — turns the Content Engine into the data shape the gallery needs
 * (shelves, search results, facets). It consumes ONLY the Content Engine public
 * API, plus the Coloring module's ProgressManager to detect "continue coloring".
 * No content logic is duplicated.
 */
import ProgressManager from '../coloring/progress/ProgressManager.js';

export default class LibraryModel {
  constructor({ content }) {
    this.content = content;
    this.progress = new ProgressManager();
  }

  /** Ensure the catalog + all packs are loaded (lazy on first use). */
  async ensureLoaded() {
    if (!this.content.catalog) await this.content.init();
    await this.content.loadAll();
  }

  coloringItems() { return this.content.filter({ assetType: 'coloring' }).toArray(); }
  hasProgress(id) { return this.progress.has(id); }

  /** Packs that contain coloring items, in catalog order, with their items. */
  packsWithItems() {
    const byPack = new Map();
    for (const it of this.coloringItems()) {
      if (!byPack.has(it.packId)) byPack.set(it.packId, []);
      byPack.get(it.packId).push(it);
    }
    return this.content.getPacks()
      .filter((d) => byPack.has(d.id))
      .map((d) => ({
        id: d.id, title: d.title, emoji: d.thumbnail?.value || '🎨',
        featured: !!d.featured,
        items: byPack.get(d.id).sort((a, b) => a.order - b.order),
      }));
  }

  featuredPacks() {
    const packs = this.packsWithItems().filter((p) => p.featured);
    return packs.length ? packs : this.packsWithItems().slice(0, 3);
  }

  continueItems() { return this.coloringItems().filter((it) => this.hasProgress(it.id)); }
  recentItems() { return this.content.getRecent(20).toArray().filter((it) => it.assetType === 'coloring'); }
  favoriteItems() { return this.content.getFavorites().toArray().filter((it) => it.assetType === 'coloring'); }

  /** Search + filter (used by the results view). */
  query(text, filters = {}) {
    const hardFilters = {
      assetType: 'coloring',
      language: filters.language || undefined,
      ageGroup: filters.ageGroup || undefined,
      difficulty: filters.difficulty || undefined,
    };
    let items;
    if (text && text.trim()) {
      items = this.content.search(text, hardFilters).map((r) => r.item);
      if (filters.packId) items = items.filter((i) => i.packId === filters.packId);
      if (filters.favorites) items = items.filter((i) => this.content.isFavorite(i.id));
    } else {
      items = this.content.filter({
        assetType: 'coloring',
        ageGroup: filters.ageGroup || null,
        difficulty: filters.difficulty || null,
        language: filters.language || null,
        packId: filters.packId || null,
        favorites: !!filters.favorites,
      }).toArray();
    }
    return items;
  }

  /** Distinct filter values among coloring items. */
  facets() {
    const items = this.coloringItems();
    const uniq = (k) => [...new Set(items.map((i) => i[k]).filter(Boolean))];
    return {
      age: uniq('ageGroup'),
      difficulty: uniq('difficulty'),
      languages: ['ar', 'en'],
      packs: this.packsWithItems().map((p) => ({ id: p.id, title: p.title, emoji: p.emoji })),
    };
  }

  isFavorite(id) { return this.content.isFavorite(id); }
  toggleFavorite(id) { return this.content.toggleFavorite(id); }
}
