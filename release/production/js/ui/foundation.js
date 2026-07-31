/**
 * foundation.js — UI foundation bootstrap (Phase 2).
 *
 * Loaded as a SECOND module entry from index.html (additive). It layers the
 * premium UI on top of the app WITHOUT modifying the core:
 *   - mounts the mobile BottomNav (self-contained, hash-driven)
 *   - adds a subtle navbar elevation on scroll
 *   - guarantees the boot splash fades out even if fonts/network are slow
 *
 * It touches nothing in js/core or js/managers.
 */
import { onReady } from '../utils/dom.js';
import BottomNav from './BottomNav.js';

onReady(() => {
  // Mobile bottom navigation (CSS hides it on desktop).
  const bottomNav = new BottomNav();
  bottomNav.mount(document.body);

  // Elevate the navbar once the content scrolls.
  const outlet = document.getElementById('outlet');
  const navbar = document.querySelector('.navbar');
  if (outlet && navbar) {
    outlet.addEventListener('scroll', () => {
      navbar.classList.toggle('is-scrolled', outlet.scrollTop > 4);
    }, { passive: true });
  }

  // Safety net: never leave the splash up forever.
  setTimeout(() => document.body.classList.add('app-loaded'), 4000);
});
