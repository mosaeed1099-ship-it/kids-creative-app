/** CategoryEditor — categories used to group items (within/across packs). */
import { F } from './fields.js';

export default {
  id: 'categories', coll: 'categories', label: 'التصنيفات', icon: '🗂️', preview: 'emoji',
  fields: [
    F.title,
    { key: 'icon', label: 'أيقونة (إيموجي)', type: 'emoji' },
    F.pack,
  ],
  defaults: () => ({ title: { ar: '', en: '' }, icon: '🗂️', packId: '' }),
};
