/**
 * Hud.js — the in-game control strip: progress (placed / total), timer, hint,
 * shuffle and a "peek" that flashes the finished picture.
 */
import { el } from '../../../utils/dom.js';
import { iconBtn, fmtTime } from './helpers.js';

export default class Hud {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    this.progress = el('span', { class: 'pz-progress', attrs: { dir: 'ltr' }, text: '0 / 0' });
    this.timer = el('span', { class: 'pz-timer', attrs: { dir: 'ltr' }, text: '00:00' });
    this.el = el('div', { class: 'pz-hud', attrs: { hidden: 'true' } }, [
      el('span', { class: 'pz-hud__stat' }, ['🧩 ', this.progress]),
      el('span', { class: 'pz-hud__stat pz-timer-wrap' }, ['⏱️ ', this.timer]),
      iconBtn({ emoji: '💡', label: 'تلميح', title: 'تلميح', onClick: () => a.hint() }),
      iconBtn({ emoji: '🔀', label: 'خلط', title: 'خلط القطع', onClick: () => a.reshuffle() }),
    ]);
    return this.el;
  }

  setActive(on) { this.el.toggleAttribute('hidden', !on); }
  setProgress(placed, total) { this.progress.textContent = `${placed} / ${total}`; }
  setTimer(sec) { this.timer.textContent = fmtTime(sec); }
  setTimerVisible(on) { this.el.querySelector('.pz-timer-wrap').style.display = on ? '' : 'none'; }
}
