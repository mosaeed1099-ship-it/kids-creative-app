/**
 * PuzzleUI.js — assembles the studio DOM (top bar, canvas stage, HUD, setup
 * modal, celebration host) and exposes refresh hooks + toasts.
 */
import { el } from '../../../utils/dom.js';
import TopBar from './TopBar.js';
import SetupPanel from './SetupPanel.js';
import Hud from './Hud.js';

export default class PuzzleUI {
  constructor(app) { this.app = app; }

  build() {
    this.topbar = new TopBar(this.app);
    this.hud = new Hud(this.app);
    this.setupPanel = new SetupPanel(this.app);

    this.stage = el('div', { class: 'pz-stage', attrs: { 'aria-label': 'لوحة اللغز' } });
    this.celebrateHost = el('div', { class: 'pz-celebrate-host' });
    const stageArea = el('div', { class: 'pz-stage-area' }, [this.stage, this.hud.build(), this.celebrateHost]);

    this.setupEl = this.setupPanel.build();
    this.setupEl.hidden = true;
    this.toastHost = el('div', { class: 'pz-toasts', attrs: { 'aria-live': 'polite' } });

    this.root = el('div', { class: 'pz-root', attrs: { dir: 'rtl' } }, [
      this.topbar.build(),
      el('div', { class: 'pz-body' }, [stageArea]),
      this.setupEl,
      this.toastHost,
    ]);
    return this.root;
  }

  showSetup() { this.setupPanel.render(); this.setupEl.hidden = false; }
  hideSetup() { this.setupEl.hidden = true; }
  setPuzzleActive(on) { this.hud.setActive(on); }
  updateProgress() { const m = this.app.model; if (m?.pieces?.length) this.hud.setProgress(m.placedCount(), m.pieces.length); }
  setHistory(u, r) { this.topbar.setHistory(u, r); }
  setZoom(p) { this.topbar.setZoom(p); }
  setTimer(sec) { this.hud.setTimer(sec); }
  setTimerEnabled(on) { this.topbar.setTimerEnabled(on); this.hud.setTimerVisible(on); }

  toast(msg) {
    const chip = el('div', { class: 'pz-toast', text: msg });
    this.toastHost.append(chip);
    requestAnimationFrame(() => chip.classList.add('is-in'));
    setTimeout(() => { chip.classList.remove('is-in'); setTimeout(() => chip.remove(), 300); }, 1800);
  }
}
