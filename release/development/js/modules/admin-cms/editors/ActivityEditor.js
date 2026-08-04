/** ActivityEditor — learning activities (quiz / flashcard / match / game). */
import { F, assetField, itemDefaults } from './fields.js';

export default {
  id: 'activities', assetType: 'activity', coll: 'items', label: 'الأنشطة التعليمية', icon: '🧠', preview: 'asset',
  fields: [
    F.title, F.description,
    { key: 'kind', label: 'النوع', type: 'select', options: [['quiz', 'اختبار'], ['flashcard', 'بطاقات'], ['match', 'توصيل'], ['game', 'لعبة']] },
    { key: 'ageGroup', label: 'الفئة العمرية', type: 'select', options: [['preschool', 'ما قبل المدرسة'], ['kids', 'أطفال'], ['all', 'الكل']] },
    F.tags, F.pack, F.category,
    assetField('.svg,.png,.jpg,.jpeg,.webp', 'صورة (اختياري)'),
  ],
  defaults: () => ({ assetType: 'activity', title: { ar: '', en: '' }, description: { ar: '', en: '' }, kind: 'quiz', ageGroup: 'kids', tags: [], packId: '', categoryId: '' }),
};
