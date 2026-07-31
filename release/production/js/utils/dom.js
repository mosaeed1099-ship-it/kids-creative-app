/**
 * dom.js — tiny DOM helpers (no framework, no dependencies).
 * Keeps view code short and consistent across the app.
 */

/** Query one element. */
export const qs = (selector, root = document) => root.querySelector(selector);

/** Query all elements as a real array. */
export const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

/**
 * Create an element declaratively.
 * @param {string} tag - e.g. "div", "button", or "svg:rect" for SVG namespace.
 * @param {object} [props] - { class, id, text, html, dataset, style, attrs, on, ... }
 * @param {Array<Node|string>} [children]
 * @returns {Element}
 */
export function el(tag, props = {}, children = []) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let node;
  if (tag.startsWith('svg:')) {
    node = document.createElementNS(SVG_NS, tag.slice(4));
  } else {
    node = document.createElement(tag);
  }

  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;
    if (key === 'class' || key === 'className') node.setAttribute('class', value);
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(node.style, value);
    else if (key === 'attrs') for (const [a, v] of Object.entries(value)) node.setAttribute(a, v);
    else if (key === 'on') for (const [evt, fn] of Object.entries(value)) node.addEventListener(evt, fn);
    else node.setAttribute(key, value);
  }

  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Remove all children from a node. */
export function clear(node) {
  while (node && node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/** Run a callback once the DOM is ready. */
export function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}
