/** ColoringEditor — coloring pages (line-art SVG/image). */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'coloring', assetType: 'coloring', coll: 'items', label: 'صفحات التلوين', icon: '🎨', preview: 'asset',
  fields: [
    F.title, F.description,
    { key: 'difficulty', label: 'الصعوبة', type: 'select', options: [['easy', 'سهل'], ['medium', 'متوسط'], ['hard', 'صعب']] },
    F.tags, F.pack, F.category,
    assetField('.svg,.png,.jpg,.jpeg,.webp', 'الرسمة (SVG / صورة)'),
  ],
  defaults: itemDefaults('coloring'),
};
