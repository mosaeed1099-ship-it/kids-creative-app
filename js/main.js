/**
 * main.js — application entry point (loaded as <script type="module">).
 * Boots the App once the DOM is ready and reveals the shell.
 */
import App from './core/App.js';
import { onReady } from './utils/dom.js';
import { logger } from './utils/logger.js';

onReady(async () => {
  const root = document.getElementById('app');
  if (!root) {
    console.error('[KCS] #app root not found');
    return;
  }

  try {
    const app = new App(root);
    await app.start();
    document.body.classList.add('app-loaded'); // hides the boot splash
  } catch (err) {
    logger.error('fatal boot error:', err);
    root.innerHTML = '<div class="boot-error">تعذّر تشغيل التطبيق. حاول تحديث الصفحة.</div>';
  }
});
