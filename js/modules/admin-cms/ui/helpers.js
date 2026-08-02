/**
 * helpers.js — shared CMS UI builders + tiny data helpers.
 */
import { el } from '../../../utils/dom.js';

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

/** A thumbnail node for an inline asset {type,data}. */
export function assetThumb(asset) {
  if (!asset || !asset.data) return el('span', { class: 'cms-thumb cms-thumb--none', text: '—' });
  if (asset.type === 'emoji') return el('span', { class: 'cms-thumb cms-thumb--emoji', text: asset.data });
  if (asset.type === 'svg') return el('img', { class: 'cms-thumb', attrs: { src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(asset.data)}`, alt: '', draggable: 'false' } });
  if (asset.type === 'image') return el('img', { class: 'cms-thumb', attrs: { src: asset.data, alt: '', draggable: 'false' } });
  if (asset.type === 'pdf') return el('span', { class: 'cms-thumb cms-thumb--pdf', text: '📄' });
  return el('span', { class: 'cms-thumb', text: '?' });
}

/** Thumbnail for a whole row given its section. */
export function rowThumb(section, o) {
  if (section.coll === 'packs' || section.coll === 'categories') return el('span', { class: 'cms-thumb cms-thumb--emoji', text: o.icon || '📦' });
  return assetThumb(o.asset);
}
