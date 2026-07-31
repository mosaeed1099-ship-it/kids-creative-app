/**
 * id.js — small unique-id helpers.
 */
let _counter = 0;

/** Monotonic id, unique within a page session. */
export function uid(prefix = 'id') {
  _counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_counter.toString(36)}`;
}

/** Short random-ish token (not cryptographically secure). */
export function shortId(prefix = 'k') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
