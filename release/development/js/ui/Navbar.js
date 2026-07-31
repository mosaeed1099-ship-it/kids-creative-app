/**
 * Navbar.js — top application bar: logo/home link + theme toggle.
 * Pure presentation; it talks to the app only through the EventBus/ctx.
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';
import { APP_CONFIG } from '../config/app.config.js';
import ThemeToggle from './ThemeToggle.js';

export default class Navbar extends Component {
  /** @param {object} props - { ctx } */
  constructor(props) {
    super(props);
    this.ctx = props.ctx;
  }

  render() {
    const { i18n } = this.ctx;

    const brand = el('a', { class: 'navbar__brand', href: '#/' }, [
      el('span', { class: 'navbar__logo', text: '🎨' }),
      el('span', { class: 'navbar__title', text: APP_CONFIG.name }),
    ]);

    const themeToggle = new ThemeToggle({ ctx: this.ctx });

    const actions = el('div', { class: 'navbar__actions' });
    themeToggle.mount(actions);
    actions.appendChild(
      el('a', { class: 'navbar__link', href: '#/settings', text: `⚙️ ${i18n.t('nav.settings')}` }),
    );

    this.track(() => themeToggle.destroy());

    return el('header', { class: 'navbar' }, [brand, actions]);
  }
}
