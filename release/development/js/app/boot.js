/**
 * boot.js — Phase 12 (RC1). NEW, ADDITIVE. A tiny production boot harness that
 * gives any page graceful, offline-friendly error handling WITHOUT touching the
 * frozen modules. Opt in from a page:
 *
 *   import { safeBoot } from '../js/app/boot.js';
 *   safeBoot('#app', async (mount) => { ...start a module... });
 *
 * It installs global error/rejection handlers, guards unsupported browsers,
 * and shows a friendly Arabic message instead of a blank screen if start-up
 * fails (missing content, broken JSON, failed import, etc.).
 */
import { browserSupported } from './safe.js';

const CARD = 'font-family:system-ui,"Noto Kufi Arabic",sans-serif;max-width:520px;margin:12vh auto;background:#fff;border:1px solid #e6e6ef;border-radius:20px;padding:28px;text-align:center;box-shadow:0 12px 40px rgba(91,107,255,.15);color:#2b2b3a';

function panel(mount, { emoji, title, body, retry }) {
  const el = typeof mount === 'string' ? document.querySelector(mount) : mount;
  const host = el || document.body;
  const btn = retry ? `<button id="kcs-retry" style="font:inherit;font-weight:800;margin-top:16px;background:#5b6bff;color:#fff;border:none;border-radius:30px;padding:12px 22px;cursor:pointer;min-height:44px">🔄 إعادة المحاولة</button>` : '';
  host.innerHTML = `<div dir="rtl" role="alert" style="${CARD}">
      <div style="font-size:52px" aria-hidden="true">${emoji}</div>
      <h2 style="margin:8px 0;color:#ff6b9d">${title}</h2>
      <p style="color:#8a8aa3;line-height:1.7;margin:0">${body}</p>${btn}
    </div>`;
  if (retry) host.querySelector('#kcs-retry')?.addEventListener('click', () => location.reload());
}

let installed = false;
export function installGlobalHandlers() {
  if (installed) return; installed = true;
  window.addEventListener('error', (e) => { try { console.error('[KCS] error:', e.error || e.message); } catch (_) {} });
  window.addEventListener('unhandledrejection', (e) => { try { console.error('[KCS] promise:', e.reason); } catch (_) {} });
}

/**
 * @param {string|Element} mount  where the app/module lives
 * @param {(mount:Element)=>Promise<any>} start  your start-up routine
 */
export async function safeBoot(mount, start) {
  installGlobalHandlers();
  const el = typeof mount === 'string' ? document.querySelector(mount) : mount;

  if (!browserSupported()) {
    panel(el, { emoji: '🧭', title: 'المتصفح غير مدعوم',
      body: 'يستخدم هذا التطبيق مزايا حديثة (ES Modules). فضلاً افتحه بأحدث إصدار من Chrome أو Edge أو Safari أو Firefox.' });
    return null;
  }
  try {
    return await start(el);
  } catch (err) {
    try { console.error('[KCS] boot failed:', err); } catch (_) {}
    panel(el, { emoji: '😅', title: 'تعذّر تحميل هذا القسم',
      body: 'قد يكون أحد ملفات المحتوى مفقودًا أو تالفًا. كل شيء يعمل دون إنترنت، لذا جرّب إعادة المحاولة.',
      retry: true });
    return null;
  }
}

export default safeBoot;
