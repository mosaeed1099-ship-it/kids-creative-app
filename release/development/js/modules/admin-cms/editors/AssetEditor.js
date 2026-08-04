/** AssetEditor — the media library (standalone uploaded files). Managed by the
 *  richer MediaLibrary view (17A.3); this config still drives the single-item
 *  add/edit form (name, category, tags, file) and stamps timestamps. */
import { assetField } from './fields.js';

export default {
  id: 'assets', coll: 'assets', label: 'الوسائط', icon: '🖼️', preview: 'asset',
  fields: [
    { key: 'name', label: 'الاسم', type: 'text', required: true },
    { key: 'category', label: 'التصنيف', type: 'text' },
    { key: 'tags', label: 'الوسوم', type: 'tags' },
    assetField('.svg,.png,.jpg,.jpeg,.webp,.pdf', 'الملف (SVG/PNG/JPG/WEBP/PDF)'),
  ],
  defaults: () => ({ name: '', category: '', tags: [], fav: false, createdAt: new Date().toISOString() }),
  beforeSave: (o) => { o.updatedAt = new Date().toISOString(); if (!o.createdAt) o.createdAt = o.updatedAt; return o; },
};
