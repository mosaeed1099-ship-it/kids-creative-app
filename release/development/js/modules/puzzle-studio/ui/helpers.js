/**
 * helpers.js — shared UI builders (button, chip) on the app's `el` helper.
 */
import { el } from '../../../utils/dom.js';

export function iconBtn({ emoji = '', label = '', title = '', active = false, cls = '', onClick = null }) {
  return el('button', {
    class: `pz-btn ${active ? 'is-active' : ''} ${cls}`.trim(),
    attrs: { type: 'button', title: title || label, 'aria-label': title || label, 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [
    emoji ? el('span', { class: 'pz-btn__emoji', text: emoji }) : null,
    label ? el('span', { class: 'pz-btn__label', text: label }) : null,
  ]);
}

export function chip({ label, emoji = '', active = false, onClick = null }) {
  return el('button', {
    class: `pz-chip ${active ? 'is-active' : ''}`,
    attrs: { type: 'button', 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [emoji ? `${emoji} ` : '', label]);
}

/** mm:ss from seconds. */
export function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
