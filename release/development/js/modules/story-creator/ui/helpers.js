/**
 * helpers.js — shared UI builders (button, chip, labelled color field) on the
 * app's `el` helper. Colours use the native picker (offline, accessible).
 */
import { el } from '../../../utils/dom.js';

export function iconBtn({ emoji = '', label = '', title = '', active = false, cls = '', onClick = null }) {
  return el('button', {
    class: `st-btn ${active ? 'is-active' : ''} ${cls}`.trim(),
    attrs: { type: 'button', title: title || label, 'aria-label': title || label, 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [
    emoji ? el('span', { class: 'st-btn__emoji', text: emoji }) : null,
    label ? el('span', { class: 'st-btn__label', text: label }) : null,
  ]);
}

export function chip({ label, emoji = '', active = false, onClick = null }) {
  return el('button', { class: `st-chip ${active ? 'is-active' : ''}`, attrs: { type: 'button' }, on: onClick ? { click: onClick } : {} }, [emoji ? `${emoji} ` : '', label]);
}

export function colorField(label, value, onChange) {
  const input = el('input', { class: 'st-color', attrs: { type: 'color', value: value || '#000000', 'aria-label': label }, on: { input: (e) => onChange(e.target.value) } });
  return el('label', { class: 'st-field' }, [label, input]);
}

export function field(label, input) { return el('label', { class: 'st-field' }, [label, input]); }
