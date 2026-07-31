/**
 * AssetType — the kinds of content the app can hold. Data-driven: a JSON
 * item's `assetType` must be one of these. Extend by adding a value + label.
 * A future FEATURE module decides how to *render* each type; the content
 * engine only classifies and indexes them.
 */
export const AssetType = Object.freeze({
  COLORING: 'coloring',
  TRACE: 'trace',
  PDF: 'pdf',
  STORY: 'story',
  STICKER: 'sticker',
  ACTIVITY: 'activity',
  QUIZ: 'quiz',
  FLASHCARD: 'flashcard',
  PUZZLE: 'puzzle',
  WRITING: 'writing',
  LESSON: 'lesson',
  CHALLENGE: 'challenge',

  values() {
    return ['coloring', 'trace', 'pdf', 'story', 'sticker', 'activity',
      'quiz', 'flashcard', 'puzzle', 'writing', 'lesson', 'challenge'];
  },
  isValid(v) { return this.values().includes(v); },
  icon(v) {
    return {
      coloring: '🎨', trace: '✏️', pdf: '📄', story: '📖', sticker: '⭐',
      activity: '🧩', quiz: '❓', flashcard: '🃏', puzzle: '🧩', writing: '✍️',
      lesson: '📚', challenge: '🏆',
    }[v] || '📦';
  },
  label(v, lang = 'ar') {
    const ar = {
      coloring: 'تلوين', trace: 'تتبّع', pdf: 'ملف PDF', story: 'قصة', sticker: 'ملصقات',
      activity: 'نشاط', quiz: 'اختبار', flashcard: 'بطاقات', puzzle: 'لغز', writing: 'كتابة',
      lesson: 'درس', challenge: 'تحدٍّ',
    };
    const en = {
      coloring: 'Coloring', trace: 'Trace', pdf: 'PDF', story: 'Story', sticker: 'Stickers',
      activity: 'Activity', quiz: 'Quiz', flashcard: 'Flashcards', puzzle: 'Puzzle', writing: 'Writing',
      lesson: 'Lesson', challenge: 'Challenge',
    };
    return (lang === 'en' ? en : ar)[v] || v;
  },
});

export default AssetType;
