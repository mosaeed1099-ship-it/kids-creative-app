/**
 * Pack — a themed bundle of content (Animals, Alphabet, Space…). A pack groups
 * categories and items of MANY asset types (coloring + trace + pdf + stickers…)
 * and is the primary unit the app loads/sells. Unlimited packs are supported —
 * each is just a JSON file registered in the catalog.
 */
import Category from './Category.js';
import ContentItem from './ContentItem.js';
import Thumbnail from './Thumbnail.js';
import License from './License.js';
import Metadata from './Metadata.js';
import Tag from './Tag.js';

export default class Pack {
  constructor(props = {}) {
    this.id = props.id;
    this.title = props.title ?? '';
    this.description = props.description ?? '';
    this.thumbnail = props.thumbnail instanceof Thumbnail ? props.thumbnail : Thumbnail.fromJSON(props.thumbnail || {});
    this.cover = props.cover || null;
    this.ageGroup = props.ageGroup || null;
    this.languages = props.languages || ['ar'];
    this.tags = (props.tags || []).map(Tag.from);
    this.license = props.license instanceof License ? props.license : License.fromJSON(props.license || {});
    this.metadata = props.metadata instanceof Metadata ? props.metadata : Metadata.fromJSON(props.metadata || {});
    this.version = props.version || 1;
    this.order = props.order || 0;
    this.premium = !!props.premium;

    this.categories = (props.categories || []).map((c) => (c instanceof Category ? c : Category.fromJSON(c)));
    this.items = (props.items || []).map((i) => {
      const item = i instanceof ContentItem ? i : ContentItem.fromJSON(i);
      if (!item.packId) item.packId = this.id;
      return item;
    });

    /** true once the pack's items have been loaded (lazy-loading flag). */
    this.loaded = props.loaded ?? (this.items.length > 0);
  }

  getTitle(lang = 'ar') {
    const t = this.title;
    if (typeof t === 'string') return t;
    return t?.[lang] ?? t?.default ?? Object.values(t || {})[0] ?? '';
  }

  getItems() { return this.items; }
  getByType(assetType) { return this.items.filter((i) => i.assetType === assetType); }
  getCategory(id) { return this.categories.find((c) => c.id === id) || null; }
  itemsInCategory(categoryId) { return this.items.filter((i) => i.categoryId === categoryId); }
  assetTypes() { return [...new Set(this.items.map((i) => i.assetType))]; }

  addItem(item) {
    const it = item instanceof ContentItem ? item : ContentItem.fromJSON(item);
    if (!it.packId) it.packId = this.id;
    this.items.push(it);
    return it;
  }

  static fromJSON(o) { return new Pack(o); }

  /** Serialize (optionally without items — for catalog/metadata only). */
  toJSON({ withItems = true } = {}) {
    const base = {
      id: this.id, title: this.title, description: this.description,
      thumbnail: this.thumbnail.toJSON(), cover: this.cover, ageGroup: this.ageGroup,
      languages: this.languages, tags: this.tags.map((t) => t.toJSON()),
      license: this.license.toJSON(), metadata: this.metadata.toJSON(),
      version: this.version, order: this.order, premium: this.premium,
      categories: this.categories.map((c) => c.toJSON()),
    };
    if (withItems) base.items = this.items.map((i) => i.toJSON());
    return base;
  }
}
