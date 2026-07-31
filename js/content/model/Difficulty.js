/**
 * Difficulty — content difficulty scale (data-driven, extensible).
 */
export const Difficulty = Object.freeze({
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard',

  values() { return ['easy', 'medium', 'hard']; },
  isValid(v) { return this.values().includes(v); },
  rank(v) { return { easy: 1, medium: 2, hard: 3 }[v] || 0; },
  label(v, lang = 'ar') {
    const ar = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
    const en = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
    return (lang === 'en' ? en : ar)[v] || v;
  },
});

export default Difficulty;
