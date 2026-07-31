/**
 * ActivityRegistry — maps a data-driven activity `type` to its renderer.
 * Adding a new activity = add a file + one line here; nothing else changes.
 */
import connectDots from './activities/connectDots.js';
import maze from './activities/maze.js';
import matchShadow from './activities/matchShadow.js';
import matchShape from './activities/matchShape.js';
import findDifference from './activities/findDifference.js';
import patternCompletion from './activities/patternCompletion.js';
import numbers from './activities/numbers.js';
import alphabet from './activities/alphabet.js';
import puzzle from './activities/puzzle.js';

const RENDERERS = {
  'connect-dots': connectDots,
  'maze': maze,
  'match-shadow': matchShadow,
  'match-shape': matchShape,
  'find-difference': findDifference,
  'pattern-completion': patternCompletion,
  'numbers': numbers,
  'alphabet': alphabet,
  'puzzle': puzzle,
};

export const TYPE_META = {
  'connect-dots': { icon: '✏️', label: 'وصّل النقاط' },
  'maze': { icon: '🌀', label: 'متاهات' },
  'match-shadow': { icon: '🌓', label: 'طابق الظل' },
  'match-shape': { icon: '🔷', label: 'طابق الشكل' },
  'find-difference': { icon: '🔍', label: 'اكتشف الفرق' },
  'pattern-completion': { icon: '🔁', label: 'أكمل النمط' },
  'numbers': { icon: '🔢', label: 'أرقام' },
  'alphabet': { icon: '🔤', label: 'حروف' },
  'puzzle': { icon: '🧩', label: 'ألغاز الصور' },
};

export default class ActivityRegistry {
  static has(type) { return !!RENDERERS[type]; }
  static get(type) { return RENDERERS[type] || null; }
  static types() { return Object.keys(RENDERERS); }
  static meta(type) { return TYPE_META[type] || { icon: '🎯', label: type }; }
}
