/**
 * helpers.js — small shared UI builders (button, chip, section) built on the
 * app's public `el` DOM helper and design tokens. Keeps controls consistent.
 */
import { el } from '../../../utils/dom.js';

export function iconBtn({ emoji = '', label = '', title = '', active = false, cls = '', onClick = null }) {
  return el('button', {
    class: `ss-btn ${active ? 'is-active' : ''} ${cls}`.trim(),
    attrs: { type: 'button', title: title || label, 'aria-label': title || label, 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [
    emoji ? el('span', { class: 'ss-btn__emoji', text: emoji }) : null,
    label ? el('span', { class: 'ss-btn__label', text: label }) : null,
  ]);
}

export function chip({ label, emoji = '', active = false, onClick = null }) {
  return el('button', {
    class: `ss-chip ${active ? 'is-active' : ''}`,
    attrs: { type: 'button', 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [emoji ? `${emoji} ` : '', label]);
}

export function section(title, children = []) {
  return el('section', { class: 'ss-section' }, [
    title ? el('h3', { class: 'ss-section__title', text: title }) : null,
    el('div', { class: 'ss-section__body' }, children),
  ]);
}
