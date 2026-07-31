/**
 * SettingsPage.js — theme, language and sound controls, wired to
 * SettingsManager. Demonstrates the settings/theme/i18n systems working
 * together. (Content is intentionally minimal; not a creative feature.)
 */
import Page from './Page.js';
import { el } from '../utils/dom.js';

export default class SettingsPage extends Page {
  static pageId = 'settings';

  render() {
    const { i18n, settings, theme } = this.ctx;

    const themeRow = el('div', { class: 'settings__row' }, [
      el('span', { class: 'settings__label', text: `🎨 ${i18n.t('settings.theme')}` }),
      el('div', { class: 'settings__control' }, theme.available.map((name) =>
        el('button', {
          class: `chip ${theme.current === name ? 'is-active' : ''}`,
          text: name === 'dark' ? '🌙 داكن' : '☀️ فاتح',
          on: { click: (e) => {
            settings.setTheme(name);
            [...e.target.parentNode.children].forEach((c) => c.classList.remove('is-active'));
            e.target.classList.add('is-active');
          } },
        }),
      )),
    ]);

    const langRow = el('div', { class: 'settings__row' }, [
      el('span', { class: 'settings__label', text: `🌐 ${i18n.t('settings.language')}` }),
      el('div', { class: 'settings__control' }, i18n.available.map((lang) =>
        el('button', {
          class: `chip ${i18n.lang === lang ? 'is-active' : ''}`,
          text: lang === 'ar' ? 'العربية' : 'English',
          on: { click: () => settings.setLanguage(lang) },
        }),
      )),
    ]);

    const soundRow = el('div', { class: 'settings__row' }, [
      el('span', { class: 'settings__label', text: `🔊 ${i18n.t('settings.sound')}` }),
      el('div', { class: 'settings__control' }, [
        el('button', {
          class: `chip ${settings.get('sound') ? 'is-active' : ''}`,
          text: settings.get('sound') ? 'يعمل' : 'متوقف',
          on: { click: (e) => {
            const next = !settings.get('sound');
            settings.setSound(next);
            e.target.textContent = next ? 'يعمل' : 'متوقف';
            e.target.classList.toggle('is-active', next);
          } },
        }),
      ]),
    ]);

    return el('section', { class: 'settings page-pad' }, [
      el('h1', { class: 'page-title', text: `⚙️ ${i18n.t('nav.settings')}` }),
      el('div', { class: 'settings__card' }, [themeRow, langRow, soundRow]),
      el('a', { class: 'btn btn--ghost', href: '#/', text: `◀ ${i18n.t('common.back')}` }),
    ]);
  }
}
