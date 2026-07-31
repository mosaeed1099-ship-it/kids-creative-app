/**
 * achievements.def.js — DATA-DRIVEN achievement definitions.
 * Each has a `test(stats)` predicate over ActivityTracker.getStats(). Add or
 * change achievements here without touching the engine.
 */
export const ACHIEVEMENTS = [
  { id: 'first', icon: '🌟', title: { ar: 'أول تلوين', en: 'First Coloring' }, desc: { ar: 'أكملت أول صفحة!', en: 'Completed your first page!' }, test: (s) => s.completedCount >= 1 },
  { id: 'pages10', icon: '🔟', title: { ar: '١٠ صفحات', en: '10 Pages' }, desc: { ar: 'أكملت ١٠ صفحات', en: 'Completed 10 pages' }, test: (s) => s.completedCount >= 10 },
  { id: 'pages50', icon: '🏅', title: { ar: '٥٠ صفحة', en: '50 Pages' }, desc: { ar: 'أكملت ٥٠ صفحة', en: 'Completed 50 pages' }, test: (s) => s.completedCount >= 50 },
  { id: 'pages100', icon: '🏆', title: { ar: '١٠٠ صفحة', en: '100 Pages' }, desc: { ar: 'أكملت ١٠٠ صفحة', en: 'Completed 100 pages' }, test: (s) => s.completedCount >= 100 },
  { id: 'animal-master', icon: '🦁', title: { ar: 'سيّد الحيوانات', en: 'Animal Master' }, desc: { ar: 'أكملت ٥ من باقة الحيوانات', en: '5 pages in Animals' }, test: (s) => (s.categories.animals || 0) >= 5 },
  { id: 'alphabet-master', icon: '🔤', title: { ar: 'سيّد الحروف', en: 'Alphabet Master' }, desc: { ar: 'أكملت ٤ من باقة الحروف', en: '4 pages in Alphabet' }, test: (s) => (s.categories.alphabet || 0) >= 4 },
  { id: 'space-explorer', icon: '🚀', title: { ar: 'مستكشف الفضاء', en: 'Space Explorer' }, desc: { ar: 'أكملت ٤ من باقة الفضاء', en: '4 pages in Space' }, test: (s) => (s.categories.space || 0) >= 4 },
  { id: 'perfect-week', icon: '📅', title: { ar: 'أسبوع مثالي', en: 'Perfect Week' }, desc: { ar: '٧ أيام نشاط متتالية', en: '7-day activity streak' }, test: (s) => s.activeStreak >= 7 },
  { id: 'colorful', icon: '🌈', title: { ar: 'ملوّن ماهر', en: 'Colorful' }, desc: { ar: 'استخدمت ٨ ألوان مختلفة', en: 'Used 8 different colors' }, test: (s) => Object.keys(s.colors).length >= 8 },
  { id: 'collector', icon: '📚', title: { ar: 'جامع الباقات', en: 'Collector' }, desc: { ar: 'أكملت ٣ باقات', en: 'Completed 3 packs' }, test: (s) => s.packsCompletedCount >= 3 },
];

export default ACHIEVEMENTS;
