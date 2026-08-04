/**
 * helpers.js — shared CMS UI builders + tiny data helpers.
 */
import { el } from '../../../utils/dom.js';
import { resolveAssetData } from '../io/assets.js';

export function btn({ emoji = '', label = '', title = '', cls = '', onClick = null, disabled = false }) {
  return el('button', {
    class: `cms-btn ${cls}`.trim(),
    attrs: { type: 'button', title: title || label, 'aria-label': title || label, ...(disabled ? { disabled: 'true' } : {}) },
    on: onClick ? { click: onClick } : {},
  }, [emoji ? el('span', { class: 'cms-btn__emoji', text: emoji }) : null, label ? el('span', { text: label }) : null]);
}

export function localized(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v.ar || v.en || Object.values(v)[0] || '';
}

/** Best display name for any entity. */
export function displayName(o) { return localized(o.title) || o.name || '(بدون عنوان)'; }

/**
 * A thumbnail node for an asset. Returns a node synchronously (a placeholder)
 * and fills it in once the asset data resolves — assets may now be IndexedDB
 * references rather than inline data (Phase 17A.1, C2), so resolution is async.
 */
export function assetThumb(asset) {
  const holder = el('span', { class: 'cms-thumb cms-thumb--none', text: '—' });
  resolveAssetData(asset).then((a) => paintThumb(holder, a)).catch(() => paintThumb(holder, null));
  return holder;
}

function paintThumb(holder, a) {
  holder.style.backgroundImage = '';
  holder.textContent = '';
  if (!a || !a.data) { holder.className = 'cms-thumb cms-thumb--none'; holder.textContent = '—'; return; }
  if (a.type === 'emoji') { holder.className = 'cms-thumb cms-thumb--emoji'; holder.textContent = a.data; return; }
  if (a.type === 'pdf') { holder.className = 'cms-thumb cms-thumb--pdf'; holder.textContent = '📄'; return; }
  if (a.type === 'svg') { holder.className = 'cms-thumb cms-thumb--img'; holder.style.backgroundImage = `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(a.data)}")`; return; }
  if (a.type === 'image') { holder.className = 'cms-thumb cms-thumb--img'; holder.style.backgroundImage = `url("${a.data}")`; return; }
  holder.className = 'cms-thumb'; holder.textContent = '?';
}

/** Thumbnail for a whole row given its section. */
export function rowThumb(section, o) {
  if (section.coll === 'packs' || section.coll === 'categories') return el('span', { class: 'cms-thumb cms-thumb--emoji', text: o.icon || '📦' });
  return assetThumb(o.asset);
}
