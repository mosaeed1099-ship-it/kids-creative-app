/**
 * AgeGroup — age bands with numeric ranges, so content can be matched to a
 * child's age and filtered/searched. Data-driven and extensible.
 */
const RANGES = {
  toddler: [2, 3],
  preschool: [4, 5],
  kids: [6, 8],
  tweens: [9, 12],
};

export const AgeGroup = Object.freeze({
  TODDLER: 'toddler',
  PRESCHOOL: 'preschool',
  KIDS: 'kids',
  TWEENS: 'tweens',

  values() { return Object.keys(RANGES); },
  isValid(v) { return v in RANGES; },
  range(v) { return RANGES[v] ? [...RANGES[v]] : null; },

  /** Does a numeric age fall within this band? */
  matches(v, age) {
    const r = RANGES[v];
    return !!r && age >= r[0] && age <= r[1];
  },

  /** Which band contains a numeric age (or null). */
  forAge(age) {
    return Object.keys(RANGES).find((k) => age >= RANGES[k][0] && age <= RANGES[k][1]) || null;
  },

  label(v, lang = 'ar') {
    const r = RANGES[v];
    if (!r) return v;
    return lang === 'en' ? `${v} (${r[0]}–${r[1]})` : `${r[0]}–${r[1]} سنوات`;
  },
});

export default AgeGroup;
