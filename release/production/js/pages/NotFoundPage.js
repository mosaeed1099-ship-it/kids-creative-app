/**
 * NotFoundPage.js — fallback view for unknown routes.
 */
import Page from './Page.js';
import { el } from '../utils/dom.js';

export default class NotFoundPage extends Page {
  static pageId = 'notFound';

  render() {
    const { i18n } = this.ctx;
    return el('section', { class: 'notfound page-pad' }, [
      el('div', { class: 'notfound__emoji', text: '🧭' }),
      el('h1', { class: 'page-title', text: i18n.t('notfound.title') }),
      el('a', { class: 'btn btn--primary', href: '#/', text: `🏠 ${i18n.t('nav.home')}` }),
    ]);
  }
}
