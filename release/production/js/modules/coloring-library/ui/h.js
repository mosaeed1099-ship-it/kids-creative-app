/**
 * h.js — minimal element builder shared by the library UI (self-contained).
 */
export function h(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'on') for (const [e, fn] of Object.entries(v)) el.addEventListener(e, fn);
    else el.setAttribute(k, v);
  }
  for (const c of [].concat(children)) if (c != null) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}
export default h;
