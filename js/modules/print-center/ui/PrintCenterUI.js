/**
 * PrintCenterUI — builds the Print Center chrome (header + collections sidebar +
 * filters + selection bar + content grid) and returns refs the controller fills.
 */
import { h } from '../util.js';

export default function PrintCenterUI() {
  const searchInput = h('input', { class: 'pc-search__input', type: 'search', placeholder: '🔎 ابحث عن نشاط للطباعة…' });
  const queueBtn = h('button', { class: 'pc-queuebtn' }, '🖨️ الطابور');
  const header = h('header', { class: 'pc-header' }, [
    h('div', { class: 'pc-brand' }, [h('span', { class: 'pc-brand__logo', text: '🖨️' }), h('span', { class: 'pc-brand__title', text: 'مركز الطباعة' })]),
    h('div', { class: 'pc-search' }, [searchInput]),
    queueBtn,
  ]);

  const sidebar = h('aside', { class: 'pc-sidebar' });
  const filters = h('div', { class: 'pc-filters' });
  const selbar = h('div', { class: 'pc-selbar' });
  const grid = h('div', { class: 'pc-grid' });
  const main = h('main', { class: 'pc-mainarea' }, [filters, selbar, grid]);
  const body = h('div', { class: 'pc-body' }, [sidebar, main]);

  const el = h('div', { class: 'pc' }, [header, body]);
  return { el, searchInput, queueBtn, sidebar, filters, selbar, grid };
}
