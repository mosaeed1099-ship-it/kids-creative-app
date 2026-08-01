/**
 * helpers.js — tiny shared UI builders (button, icon-button, slider, swatch)
 * used by every panel, so the studio's controls stay visually consistent and
 * free of duplicated markup. Built on the app's public `el` DOM helper.
 */
import { el } from '../../../utils/dom.js';

/** A big, child-friendly icon button. */
export function iconBtn({ emoji = '', label = '', title = '', active = false, cls = '', onClick = null, ariaLabel = null }) {
  const node = el('button', {
    class: `fd-btn ${active ? 'is-active' : ''} ${cls}`.trim(),
    attrs: { type: 'button', title: title || label, 'aria-label': ariaLabel || title || label, 'aria-pressed': active ? 'true' : 'false' },
    on: onClick ? { click: onClick } : {},
  }, [
    emoji ? el('span', { class: 'fd-btn__emoji', text: emoji }) : null,
    label ? el('span', { class: 'fd-btn__label', text: label }) : null,
  ]);
  return node;
}

/** A labelled range slider with a live value read-out. */
export function slider({ label, min, max, step = 1, value, suffix = '', onInput }) {
  const val = el('span', { class: 'fd-slider__val', text: `${value}${suffix}` });
  const input = el('input', {
    class: 'fd-slider__input',
    attrs: { type: 'range', min: String(min), max: String(max), step: String(step), value: String(value),
      'aria-label': label },
    on: {
      input: (e) => {
        const v = +e.target.value;
        val.textContent = `${v}${suffix}`;
        onInput?.(v);
      },
    },
  });
  const root = el('label', { class: 'fd-slider' }, [
    el('span', { class: 'fd-slider__label' }, [label, val]),
    input,
  ]);
  root._input = input;
  root._val = val;
  root.setValue = (v) => { input.value = String(v); val.textContent = `${v}${suffix}`; };
  return root;
}

/** A colour swatch chip (optionally a favourite star / selectable). */
export function swatch(hex, { active = false, onClick = null, title = null } = {}) {
  return el('button', {
    class: `fd-swatch ${active ? 'is-active' : ''}`,
    attrs: { type: 'button', title: title || hex, 'aria-label': title || hex, style: `--sw:${hex}` },
    on: onClick ? { click: onClick } : {},
  });
}

/** A collapsible titled panel section. */
export function section(title, emoji, children = []) {
  return el('section', { class: 'fd-section' }, [
    el('h3', { class: 'fd-section__title' }, [emoji ? `${emoji} ` : '', title]),
    el('div', { class: 'fd-section__body' }, children),
  ]);
}
