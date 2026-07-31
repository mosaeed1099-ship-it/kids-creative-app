/**
 * Toast.js — transient notifications. Static API so any code can call
 * Toast.show('حُفظ!'). A single container is lazily created and reused.
 */
import { el } from '../utils/dom.js';

let _container = null;

function container() {
  if (!_container) {
    _container = el('div', { class: 'toast-container', attrs: { 'aria-live': 'polite' } });
    document.body.appendChild(_container);
  }
  return _container;
}

const Toast = {
  /**
   * @param {string} message
   * @param {object} [opts] - { type: 'info'|'success'|'error', duration: ms }
   */
  show(message, { type = 'info', duration = 2600 } = {}) {
    const node = el('div', { class: `toast toast--${type}`, text: message });
    container().appendChild(node);
    requestAnimationFrame(() => node.classList.add('is-visible'));
    setTimeout(() => {
      node.classList.remove('is-visible');
      setTimeout(() => node.remove(), 250);
    }, duration);
    return node;
  },
  success(m, o) { return this.show(m, { ...o, type: 'success' }); },
  error(m, o) { return this.show(m, { ...o, type: 'error' }); },
};

export default Toast;
