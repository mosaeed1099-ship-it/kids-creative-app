/**
 * LibraryUI — builds the library chrome (header: title, search, view tabs,
 * filter toggle) and the containers for filters + content. Returns the root
 * element and refs; the ColoringLibrary controller wires behaviour.
 */
import { h } from './h.js';

export default function LibraryUI({ title = 'مكتبة التلوين' } = {}) {
  const searchInput = h('input', {
    class: 'clrlib-search__input', type: 'search',
    placeholder: '🔎 ابحث عن رسمة…', 'aria-label': 'بحث',
  });
  const search = h('div', { class: 'clrlib-search' }, [searchInput]);

  const tabHome = h('button', { class: 'clrlib-tab is-active', title: 'الرئيسية', text: '🏠' });
  const tabGrid = h('button', { class: 'clrlib-tab', title: 'شبكة', text: '▦' });
  const tabList = h('button', { class: 'clrlib-tab', title: 'قائمة', text: '☰' });
  const filterToggle = h('button', { class: 'clrlib-tab', title: 'الفلاتر', text: '⚙️' });

  const tabs = h('div', { class: 'clrlib-tabs' }, [tabHome, tabGrid, tabList, filterToggle]);

  const header = h('header', { class: 'clrlib-header' }, [
    h('div', { class: 'clrlib-brand' }, [h('span', { class: 'clrlib-brand__logo', text: '🎨' }), h('span', { class: 'clrlib-brand__title', text: title })]),
    search,
    tabs,
  ]);

  const filtersWrap = h('div', { class: 'clrlib-filterswrap', hidden: 'true' });
  const contentEl = h('div', { class: 'clrlib-content' });

  const el = h('div', { class: 'clrlib' }, [header, filtersWrap, contentEl]);

  return { el, searchInput, contentEl, filtersWrap, tabs: { home: tabHome, grid: tabGrid, list: tabList }, filterToggle };
}
