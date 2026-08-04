/**
 * diff.js — structural diff between two CMS states (Phase 17A.2). Powers the
 * change log summaries, version comparison, and the diff viewer. Pure, offline.
 */
const COLLS = ['packs', 'items', 'categories', 'assets', 'trash'];
const IGNORE = new Set(['order', '_reorder']);

const keyOf = (o) => o._trashId || o.id;
function indexBy(arr) { const m = {}; for (const o of (arr || [])) m[keyOf(o)] = o; return m; }

/** Field keys whose JSON differs between two records (ignoring order/internal). */
export function changedFields(a, b) {
  const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  const out = [];
  for (const k of keys) { if (IGNORE.has(k)) continue; if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])) out.push(k); }
  return out;
}

/** @returns {{[coll]: {added:[], removed:[], changed:[{id,fields,before,after}]}}} */
export function diffStates(a, b) {
  const res = {};
  for (const c of COLLS) {
    const A = indexBy(a?.[c]), B = indexBy(b?.[c]);
    const added = [], removed = [], changed = [];
    for (const id in B) if (!(id in A)) added.push(B[id]);
    for (const id in A) {
      if (!(id in B)) { removed.push(A[id]); continue; }
      const fields = changedFields(A[id], B[id]);
      if (fields.length) changed.push({ id, fields, before: A[id], after: B[id] });
    }
    if (added.length || removed.length || changed.length) res[c] = { added, removed, changed };
  }
  return res;
}

export function isEmpty(diff) { return Object.keys(diff).length === 0; }

/** Compact "+a −r ~c" summary for a change-log line. */
export function summarize(diff) {
  let a = 0, r = 0, c = 0;
  for (const k in diff) { a += diff[k].added.length; r += diff[k].removed.length; c += diff[k].changed.length; }
  const parts = [];
  if (a) parts.push(`+${a}`);
  if (r) parts.push(`−${r}`);
  if (c) parts.push(`~${c}`);
  return parts.join(' ') || 'بدون تغيير';
}

export function counts(diff) {
  let added = 0, removed = 0, changed = 0;
  for (const k in diff) { added += diff[k].added.length; removed += diff[k].removed.length; changed += diff[k].changed.length; }
  return { added, removed, changed, total: added + removed + changed };
}
