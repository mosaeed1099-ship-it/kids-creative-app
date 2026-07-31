/**
 * LazyThumb — IntersectionObserver-based lazy image loading for card
 * thumbnails. A single shared observer watches all thumbs; each loads its
 * real image only when it scrolls near the viewport, then fades in. Falls back
 * to eager loading where IntersectionObserver is unavailable.
 */
export default class LazyThumb {
  constructor({ rootMargin = '300px' } = {}) {
    this.supported = typeof IntersectionObserver !== 'undefined';
    if (this.supported) {
      this._io = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) { this._load(e.target); this._io.unobserve(e.target); }
        }
      }, { rootMargin });
    }
  }

  /**
   * Register an <img>-holding element for lazy load.
   * @param {HTMLElement} imgEl - the <img> element with data-src set
   */
  observe(imgEl) {
    if (!imgEl?.dataset?.src) return;
    if (this.supported) this._io.observe(imgEl);
    else this._load(imgEl);
  }

  _load(imgEl) {
    const src = imgEl.dataset.src;
    if (!src || imgEl.dataset.loaded) return;
    imgEl.dataset.loaded = '1';
    const probe = new Image();
    probe.onload = () => { imgEl.src = src; imgEl.classList.add('is-loaded'); };
    probe.onerror = () => { imgEl.classList.add('is-error'); };
    probe.src = src;
  }

  disconnect() { this._io?.disconnect(); }
}
