/**
 * Dialog.js — reusable, premium dialog (Phase 2 UI foundation).
 * Bigger, softer and more playful than the low-level Modal, with an
 * optional big emoji. Backdrop click + Esc close. Promise-friendly.
 *
 *   new Dialog({
 *     emoji:'🎉', title:'أحسنت!', body:'حُفظت رسمتك',
 *     actions:[{ label:'تمام', variant:'primary', onClick(){} }],
 *   }).open();
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class Dialog extends Component {
  render() {
    const { emoji = null, title = '', body = '', actions = [] } = this.props;

    const dialog = el('div', { class: 'ui-dialog', attrs: { role: 'dialog', 'aria-modal': 'true' } }, [
      el('div', { class: 'ui-dialog__head' }, [
        el('h3', { class: 'ui-dialog__title', text: title }),
        el('button', { class: 'iconbtn', text: '✕', attrs: { 'aria-label': 'إغلاق' }, on: { click: () => this.close() } }),
      ]),
      emoji ? el('div', { class: 'ui-dialog__emoji', text: emoji }) : null,
      el('div', { class: 'ui-dialog__body' }, [body.nodeType ? body : el('div', { html: String(body) })]),
      actions.length
        ? el('div', { class: 'ui-dialog__footer' }, actions.map((a) =>
            el('button', {
              class: `ui-btn ui-btn--${a.variant || 'primary'} ui-btn--pill`,
              text: a.label,
              on: { click: () => { a.onClick?.(); if (a.close !== false) this.close(); } },
            })))
        : null,
    ]);

    const backdrop = el('div', {
      class: 'ui-dialog-backdrop',
      on: { click: (e) => { if (e.target === backdrop) this.close(); } },
    }, [dialog]);

    this._onKey = (e) => { if (e.key === 'Escape') this.close(); };
    document.addEventListener('keydown', this._onKey);

    this.el = backdrop;
    return backdrop;
  }

  open() {
    this.mount(document.body);
    requestAnimationFrame(() => this.el?.classList.add('is-open'));
    return this;
  }

  close() {
    document.removeEventListener('keydown', this._onKey);
    if (this.el) {
      this.el.classList.remove('is-open');
      const node = this.el;
      setTimeout(() => { if (node.parentNode) node.remove(); }, 220);
      this.el = null;
    }
    this.props.onClose?.();
  }
}
