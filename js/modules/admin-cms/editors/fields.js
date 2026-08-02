/**
 * fields.js — reusable field definitions shared by every editor, so the section
 * editors stay tiny and there is no duplicated form logic. A field is a plain
 * descriptor the generic EntityForm knows how to render:
 *   type: 'text' | 'localized' | 'tags' | 'select' | 'number' | 'bool' |
 *         'emoji' | 'asset' | 'category' | 'pack'
 */
export const F = {
  title: { key: 'title', label: 'العنوان', type: 'localized', required: true },
  description: { key: 'description', label: 'الوصف', type: 'localized', multiline: true },
  tags: { key: 'tags', label: 'الوسوم', type: 'tags' },
  pack: { key: 'packId', label: 'الحزمة', type: 'pack' },
  category: { key: 'categoryId', label: 'التصنيف', type: 'category' },
};

/** An asset (file) field storing the item's content inline. `opts.emoji` adds an
 *  optional emoji input (for emoji stickers). */
export const assetField = (accept, label = 'الملف', opts = {}) => ({ key: 'asset', label, type: 'asset', accept, emoji: !!opts.emoji });

/** Common defaults for a content item of a given assetType. */
export const itemDefaults = (assetType) => () => ({ assetType, title: { ar: '', en: '' }, description: { ar: '', en: '' }, tags: [], packId: '', categoryId: '' });
