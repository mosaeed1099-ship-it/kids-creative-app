/**
 * Category — groups items within (or across) packs, e.g. "Wild Animals",
 * "Letters A–M". Categories are metadata for organization/navigation; item
 * membership is by `item.categoryId` so a category can span packs.
 */
export default class Category {
  constructor(props = {}) {
    this.id = props.id;
    this.title = props.title ?? '';        // string | { ar, en }
    this.description = props.description ?? '';
    this.icon = props.icon || '📁';
    this.packId = props.packId || null;
    this.parentId = props.parentId || null;
    this.order = props.order || 0;
    this.data = props.data || {};
  }

  getTitle(lang = 'ar') {
    const t = this.title;
    if (typeof t === 'string') return t;
    return t?.[lang] ?? t?.default ?? Object.values(t || {})[0] ?? '';
  }

  static fromJSON(o) { return new Category(o); }
  toJSON() {
    return {
      id: this.id, title: this.title, description: this.description, icon: this.icon,
      packId: this.packId, parentId: this.parentId, order: this.order, data: this.data,
    };
  }
}
