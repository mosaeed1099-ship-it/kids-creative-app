/** PdfEditor — printable PDF documents. */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'pdfs', assetType: 'pdf', coll: 'items', label: 'ملفات PDF', icon: '📄', preview: 'asset',
  fields: [
    F.title, F.description, F.tags, F.pack, F.category,
    assetField('.pdf', 'ملف PDF'),
  ],
  defaults: itemDefaults('pdf'),
};
