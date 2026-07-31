/**
 * Component.js — base class for reusable UI widgets (navbar, modal, toast…).
 * Lighter than a View: a widget builds an element and can be mounted into
 * any parent. It owns its own disposers for clean teardown.
 */
export default class Component {
  constructor(props = {}) {
    this.props = props;
    this.el = null;
    this._disposers = [];
  }

  /** Override: build and return the root element. */
  render() {
    return document.createElement('div');
  }

  track(disposer) {
    if (typeof disposer === 'function') this._disposers.push(disposer);
    return disposer;
  }

  /** Build (if needed) and append to a parent. */
  mount(parent) {
    if (!this.el) this.el = this.render();
    parent.appendChild(this.el);
    if (this.onMount) this.onMount();
    return this.el;
  }

  destroy() {
    if (this.onDestroy) this.onDestroy();
    this._disposers.splice(0).forEach((d) => { try { d(); } catch (_) {} });
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
