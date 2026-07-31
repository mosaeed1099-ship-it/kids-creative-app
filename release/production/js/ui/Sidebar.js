/**
 * Sidebar.js — feature navigation list, built from the features registry.
 * Highlights the active route and collapses on small screens (CSS-driven).
 */
import Component from './Component.js';
import { el, qsa } from '../utils/dom.js';
import { enabledFeatures } from '../data/features.registry.js';

export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.ctx = props.ctx;
  }

  _sync(path) {
    if (!this.el) return;
    qsa('.sidebar__item', this.el).forEach((a) => {
      a.classList.toggle('is-active', a.getAttribute('href') === `#${path}`);
    });
  }

  render() {
    const items = [
      el('a', { class: 'sidebar__item', href: '#/', dataset: { route: '/' } }, [
        el('span', { class: 'sidebar__icon', text: '🏠' }),
        el('span', { text: this.ctx.i18n.t('nav.home') }),
      ]),
      ...enabledFeatures().map((f) =>
        el('a', { class: 'sidebar__item', href: `#${f.route}`, dataset: { route: f.route } }, [
          el('span', { class: 'sidebar__icon', text: f.icon }),
          el('span', { text: f.title }),
        ]),
      ),
    ];

    const nav = el('nav', { class: 'sidebar' }, [
      el('div', { class: 'sidebar__label', text: 'الأنشطة' }),
      ...items,
    ]);

    this.el = nav;
    this.track(this.ctx.bus.on('router:navigate', ({ path }) => this._sync(path)));
    return nav;
  }
}
