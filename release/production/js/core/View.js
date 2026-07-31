/**
 * View.js — base class for anything that renders into the app outlet.
 * Both Pages and feature Modules extend this, so the Router can treat
 * them identically: it just calls mount(outlet) and unmount().
 *
 * Lifecycle:
 *   render()      -> build and return the root Element (override this)
 *   onMount()     -> optional async hook after the element is in the DOM
 *   onUnmount()   -> optional cleanup hook before removal
 */
export default class View {
  /** @param {import('./AppContext.js').AppContext} ctx - shared services */
  constructor(ctx = {}) {
    this.ctx = ctx;
    this.el = null;
    /** cleanup callbacks (event unsubscribes, timers, etc.) */
    this._disposers = [];
  }

  /** Override: return the root element for this view. */
  render() {
    const node = document.createElement('div');
    node.className = 'view';
    return node;
  }

  /** Register a disposer to run automatically on unmount. */
  track(disposer) {
    if (typeof disposer === 'function') this._disposers.push(disposer);
    return disposer;
  }

  async mount(outlet) {
    this.el = this.render();
    outlet.appendChild(this.el);
    if (this.onMount) await this.onMount();
    return this.el;
  }

  async unmount() {
    if (this.onUnmount) await this.onUnmount();
    this._disposers.splice(0).forEach((d) => {
      try { d(); } catch (err) { console.error('[View] disposer threw:', err); }
    });
    if (this.el && this.el.parentNode) this.el.parentNode.removeChild(this.el);
    this.el = null;
  }
}
