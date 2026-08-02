/** AssetEditor — the media library (standalone uploaded files). */
import { assetField } from './fields.js';

export default {
  id: 'assets', coll: 'assets', label: 'الوسائط', icon: '🖼️', preview: 'asset',
  fields: [
    { key: 'name', label: 'الاسم', type: 'text', required: true },
    { key: 'tags', label: 'الوسوم', type: 'tags' },
    assetField('.svg,.png,.jpg,.jpeg,.webp,.pdf', 'الملف (SVG/PNG/JPG/WEBP/PDF)'),
  ],
  defaults: () => ({ name: '', tags: [] }),
};
