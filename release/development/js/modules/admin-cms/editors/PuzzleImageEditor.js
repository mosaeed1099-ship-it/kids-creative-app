/** PuzzleImageEditor — source pictures for the Puzzle Studio. */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'puzzles', assetType: 'puzzle', coll: 'items', label: 'صور الألغاز', icon: '🧩', preview: 'asset',
  fields: [
    F.title, F.description, F.tags, F.pack, F.category,
    assetField('.svg,.png,.jpg,.jpeg,.webp', 'صورة اللغز'),
  ],
  defaults: itemDefaults('puzzle'),
};
