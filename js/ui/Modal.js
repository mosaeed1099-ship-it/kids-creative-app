/**
 * Modal.js — reusable, accessible-ish dialog. Backdrop click and Esc close.
 * Usage: new Modal({ title, content:Node|string, actions:[{label,onClick,variant}] }).open()
 */
import Component from './Component.js';
import { el } from '../utils/dom.js';

export default class Modal extends Component {
  render() {
    const { title = '', content = '', actions = [] } = this.props;

    const body = el('div', { class: 'modal__body' });
    body.append(content.nodeType ? content : el('div', { html: String(content) }));

    const footer = el('div', { class: 'modal__footer' },
      actions.map((a) =>
        el('button', {
          class: `btn ${a.variant ? `btn--${a.variant}` : 'btn--primary'}`,
          text: a.label,
          on: { click: () => { a.onClick?.(); if (a.close !== false) this.close(); } },
        }),
      ),
    );

    const dialog = el('div', { class: 'modal__dialog', attrs: { role: 'dialog', 'aria-modal': 'true' } }, [
      el('div', { class: 'modal__head' }, [
        el('h3', { class: 'modal__title', text: title }),
        el('button', { class: 'iconbtn', text: '✕', on: { click: () => this.close() } }),
      ]),
      body,
      actions.length ? footer : null,
    ]);

    const backdrop = el('div', {
      class: 'modal',
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
    this.destroy();
  }
}
