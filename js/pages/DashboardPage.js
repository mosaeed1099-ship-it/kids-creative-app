/**
 * DashboardPage.js — the home screen: a grid of activity cards built from
 * the features registry. This is NAVIGATION, not a feature: each card links
 * to a feature route, which the router lazy-loads. Adding a feature to the
 * registry makes a card appear here automatically.
 */
import Page from './Page.js';
import { el } from '../utils/dom.js';
import { enabledFeatures } from '../data/features.registry.js';
import { APP_CONFIG } from '../config/app.config.js';

export default class DashboardPage extends Page {
  static pageId = 'dashboard';

  render() {
    const { i18n } = this.ctx;

    const header = el('div', { class: 'dashboard__header' }, [
      el('h1', { class: 'dashboard__title', text: APP_CONFIG.name }),
      el('p', { class: 'dashboard__subtitle', text: i18n.t('dashboard.subtitle') }),
    ]);

    const cards = enabledFeatures().map((f) =>
      el('a', {
        class: 'feature-card',
        href: `#${f.route}`,
        style: { '--card-color': f.color || 'var(--c-primary)' },
      }, [
        el('div', { class: 'feature-card__icon', text: f.icon }),
        el('div', { class: 'feature-card__title', text: f.title }),
        el('div', { class: 'feature-card__desc', text: f.description }),
      ]),
    );

    const grid = el('div', { class: 'feature-grid' }, cards);

    return el('section', { class: 'dashboard' }, [header, grid]);
  }
}
