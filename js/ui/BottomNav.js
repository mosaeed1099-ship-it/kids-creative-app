/**
 * BottomNav.js — mobile bottom navigation (Phase 2 UI foundation).
 *
 * Self-contained on purpose: it reads the features registry directly and
 * tracks the active route via `hashchange`, so it needs NOTHING from the
 * core App. That lets the UI foundation mount it without touching the
 * approved architecture. Hidden on desktop via CSS (.bottom-nav display).
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';
import { enabledFeatures } from '../data/features.registry.js';

export default class BottomNav extends Component {
  render() {
    // Home + up to 4 features keeps the bar readable on phones.
    const items = [
      { route: '/', icon: '🏠', title: 'الرئيسية' },
      ...enabledFeatures().slice(0, 4).map((f) => ({ route: f.route, icon: f.icon, title: f.title })),
    ];

    const nav = el('nav', { class: 'bottom-nav', attrs: { 'aria-label': 'تنقّل' } },
      items.map((it) =>
        el('a', { class: 'bottom-nav__item', href: `#${it.route}`, dataset: { route: it.route } }, [
          el('span', { class: 'bottom-nav__icon', text: it.icon }),
          el('span', { text: it.title }),
        ]),
      ),
    );

    this.el = nav;
    this._sync();
    this._onHash = () => this._sync();
    window.addEventListener('hashchange', this._onHash);
    this.track(() => window.removeEventListener('hashchange', this._onHash));
    return nav;
  }

  _sync() {
    if (!this.el) return;
    const path = location.hash.slice(1) || '/';
    this.el.querySelectorAll('.bottom-nav__item').forEach((a) => {
      a.classList.toggle('is-active', a.dataset.route === path);
    });
  }
}
