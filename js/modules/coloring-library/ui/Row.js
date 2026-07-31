/**
 * Row — a horizontal "shelf" of cards (Netflix-style), with a title and a
 * scrollable track. Renders an empty-state message when there are no items.
 */
import { h } from './h.js';
import CardView from './CardView.js';

export default function Row(title, items, { lib, emptyText = null, icon = '' } = {}) {
  const head = h('div', { class: 'clrlib-row__head' }, [
    h('h3', { class: 'clrlib-row__title' }, [icon ? `${icon} ` : '', title]),
    h('span', { class: 'clrlib-row__count', text: items.length ? String(items.length) : '' }),
  ]);

  let body;
  if (!items.length && emptyText) {
    body = h('div', { class: 'clrlib-empty clrlib-empty--row' }, [
      h('span', { class: 'clrlib-empty__emoji', text: '🎨' }),
      h('span', { class: 'clrlib-empty__text', text: emptyText }),
    ]);
  } else {
    body = h('div', { class: 'clrlib-row__track' }, items.map((it) => CardView(it, { lib })));
  }

  return h('section', { class: 'clrlib-row' }, [head, body]);
}
