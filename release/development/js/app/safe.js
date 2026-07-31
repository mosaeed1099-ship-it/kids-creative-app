/**
 * safe.js — Phase 12 (RC1). NEW, ADDITIVE. Small, dependency-free helpers for
 * graceful degradation in production. Nothing here modifies existing systems;
 * pages/modules may opt in.
 */

/** Parse JSON without ever throwing. Returns `fallback` on any problem. */
export function safeParse(text, fallback = null) {
  try { return JSON.parse(text); } catch (_) { return fallback; }
}

/** Is localStorage usable right now? (private mode / quota / sandbox safe.) */
export function storageAvailable() {
  try { const k = '__kcs_probe__'; localStorage.setItem(k, '1'); localStorage.removeItem(k); return true; }
  catch (_) { return false; }
}

/**
 * Load JSON over fetch with graceful failure. Resolves to `fallback` (default
 * null) instead of rejecting, so a missing/broken pack never crashes a page.
 */
export async function safeFetchJSON(url, { fallback = null, timeout = 15000 } = {}) {
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const t = ctrl ? setTimeout(() => ctrl.abort(), timeout) : null;
    const res = await fetch(url, { credentials: 'same-origin', signal: ctrl?.signal });
    if (t) clearTimeout(t);
    if (!res.ok) return fallback;
    return await res.json();
  } catch (_) { return fallback; }
}

/** Minimal feature probe for an unsupported-browser guard. */
export function browserSupported() {
  try {
    return typeof Promise !== 'undefined'
      && typeof fetch !== 'undefined'
      && typeof Map !== 'undefined'
      && 'replaceChildren' in Element.prototype
      && 'noModule' in HTMLScriptElement.prototype; // ES-module capable
  } catch (_) { return false; }
}

/** Swap a missing <img> for a friendly emoji/box so layout never breaks. */
export function attachImageFallback(img, emoji = '🖼️') {
  if (!img) return;
  img.addEventListener('error', () => {
    const span = document.createElement('span');
    span.textContent = emoji;
    span.setAttribute('aria-hidden', 'true');
    span.style.cssText = 'display:inline-grid;place-items:center;width:100%;height:100%;font-size:2rem;opacity:.6';
    img.replaceWith(span);
  }, { once: true });
}

export default { safeParse, storageAvailable, safeFetchJSON, browserSupported, attachImageFallback };
