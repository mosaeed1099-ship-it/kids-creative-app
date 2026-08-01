/**
 * Celebration.js — a lightweight confetti burst + "well done" banner shown when
 * the puzzle is solved. Pure DOM/CSS (no libraries), auto-cleans after ~4s.
 */
import { el } from '../../../utils/dom.js';

export default class Celebration {
  constructor(host) { this.host = host; }

  play() {
    const layer = el('div', { class: 'pz-celebrate', attrs: { 'aria-hidden': 'true' } });
    const colors = ['#ff5a5a', '#ffb02e', '#ffd93b', '#57c98a', '#4ab8ff', '#b06bff', '#ff6f9c'];
    for (let i = 0; i < 90; i++) {
      const c = el('span', { class: 'pz-confetti' });
      c.style.left = `${Math.random() * 100}%`;
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = `${Math.random() * 0.7}s`;
      c.style.setProperty('--x', `${(Math.random() * 2 - 1) * 140}px`);
      c.style.setProperty('--r', `${Math.random() * 900 - 450}deg`);
      c.style.setProperty('--d', `${1.8 + Math.random() * 1.6}s`);
      layer.append(c);
    }
    layer.append(el('div', { class: 'pz-banner', text: '🎉 أحسنت! 🎉' }));
    this.host.append(layer);
    setTimeout(() => layer.remove(), 4200);
  }
}
