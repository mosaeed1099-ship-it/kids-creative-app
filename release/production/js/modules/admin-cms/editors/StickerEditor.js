/** StickerEditor — stickers (inline SVG, image, or emoji). */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'stickers', assetType: 'sticker', coll: 'items', label: 'الملصقات', icon: '⭐', preview: 'asset',
  fields: [
    F.title, F.tags, F.pack, F.category,
    assetField('.svg,.png,.webp', 'رسم الملصق (أو إيموجي)', { emoji: true }),
  ],
  defaults: itemDefaults('sticker'),
};
