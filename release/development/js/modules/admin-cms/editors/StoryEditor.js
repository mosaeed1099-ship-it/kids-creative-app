/** StoryEditor — story books (metadata + cover). */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'stories', assetType: 'story', coll: 'items', label: 'القصص', icon: '📖', preview: 'asset',
  fields: [
    F.title, F.description,
    { key: 'author', label: 'المؤلف', type: 'text' },
    { key: 'pages', label: 'عدد الصفحات', type: 'number' },
    F.tags, F.pack, F.category,
    assetField('.svg,.png,.jpg,.jpeg,.webp', 'صورة الغلاف'),
  ],
  defaults: () => ({ assetType: 'story', title: { ar: '', en: '' }, description: { ar: '', en: '' }, author: '', pages: 1, tags: [], packId: '', categoryId: '' }),
};
