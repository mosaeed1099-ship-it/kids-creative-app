/**
 * Module.js — base class for FEATURE modules (coloring, draw, trace, …).
 * A feature module is a self-contained View plus static metadata used by
 * the dashboard and router. Each real feature lives in its own folder under
 * js/modules/ and does `export default class extends Module`.
 *
 * NOTE: This is architecture only. Concrete feature logic is added later,
 * without touching the core.
 */
import View from './View.js';

export default class Module extends View {
  /**
   * Static metadata every feature module should override.
   * @type {{id:string,title:string,icon:string,route:string,description:string}}
   */
  static meta = {
    id: 'base-module',
    title: 'Module',
    icon: '⭐',
    route: '/module',
    description: '',
  };

  constructor(ctx) {
    super(ctx);
    this.meta = this.constructor.meta;
  }

  /**
   * Default placeholder view. Real modules override render().
   * Shown now so the module system is demonstrably wired end-to-end.
   */
  render() {
    const meta = this.meta;
    const wrap = document.createElement('section');
    wrap.className = 'module-placeholder';
    wrap.innerHTML = `
      <div class="module-placeholder__icon">${meta.icon || '🧩'}</div>
      <h2 class="module-placeholder__title">${meta.title}</h2>
      <p class="module-placeholder__desc">${meta.description || ''}</p>
      <p class="module-placeholder__note">🚧 هذه الميزة ستُبنى لاحقًا — البنية جاهزة لاستقبالها.</p>
      <a class="btn btn--ghost" href="#/">◀ رجوع للرئيسية</a>
    `;
    return wrap;
  }
}
