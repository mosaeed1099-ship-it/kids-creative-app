/**
 * ThemeToggle.js — button that flips light/dark via SettingsManager and
 * stays in sync when the theme changes elsewhere.
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class ThemeToggle extends Component {
  constructor(props) {
    super(props);
    this.ctx = props.ctx;
  }

  _label() {
    return this.ctx.theme.current === 'dark' ? '☀️' : '🌙';
  }

  render() {
    const btn = el('button', {
      class: 'iconbtn',
      attrs: { 'aria-label': 'theme', title: 'المظهر' },
      text: this._label(),
      on: { click: () => this.ctx.settings.toggleTheme() },
    });

    this.track(
      this.ctx.bus.on('theme:changed', () => { btn.textContent = this._label(); }),
    );

    this.el = btn;
    return btn;
  }
}
