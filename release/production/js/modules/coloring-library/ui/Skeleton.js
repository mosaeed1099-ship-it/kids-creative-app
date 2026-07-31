/**
 * Skeleton.js — loading placeholders shown while content loads.
 */
import { h } from './h.js';

export function skeletonCard() {
  return h('div', { class: 'clrlib-card clrlib-skel' }, [
    h('div', { class: 'clrlib-card__thumb clrlib-shimmer' }),
    h('div', { class: 'clrlib-skel__line clrlib-shimmer' }),
    h('div', { class: 'clrlib-skel__line clrlib-skel__line--sm clrlib-shimmer' }),
  ]);
}

export function skeletonRow(title = '', n = 6) {
  return h('section', { class: 'clrlib-row' }, [
    h('div', { class: 'clrlib-row__head' }, [h('h3', { class: 'clrlib-row__title', text: title })]),
    h('div', { class: 'clrlib-row__track' }, Array.from({ length: n }, () => skeletonCard())),
  ]);
}

export function skeletonGrid(n = 12) {
  return h('div', { class: 'clrlib-grid' }, Array.from({ length: n }, () => skeletonCard()));
}
