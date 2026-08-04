/** PackEditor — manages themed packs (bundles of items). */
import { F } from './fields.js';

export default {
  id: 'packs', coll: 'packs', label: 'الحزم', icon: '📦', preview: 'pack',
  fields: [
    F.title, F.description,
    { key: 'icon', label: 'أيقونة (إيموجي)', type: 'emoji' },
    { key: 'premium', label: 'مميّزة (Premium)', type: 'bool' },
    F.tags,
  ],
  defaults: () => ({ title: { ar: '', en: '' }, description: { ar: '', en: '' }, icon: '📦', premium: false, tags: [] }),
};
