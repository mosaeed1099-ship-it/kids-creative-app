/**
 * SetupPanel.js — the start screen: pick a picture (from Content-Engine packs)
 * and a difficulty / piece count, then start. Data-driven: images come from the
 * loaded packs, so adding a pack adds puzzles with no code change.
 */
import { el, clear } from '../../../utils/dom.js';
import { chip } from './helpers.js';
import { imageThumb } from '../puzzle/image.js';

const LEVELS = [
  { id: 'vs', label: 'سهل جداً', pieces: '٤ قطع', rows: 2, cols: 2 },
  { id: 'easy', label: 'سهل', pieces: '٩ قطع', rows: 3, cols: 3 },
  { id: 'med', label: 'متوسط', pieces: '١٦ قطعة', rows: 4, cols: 4 },
  { id: 'hard', label: 'صعب', pieces: '٢٥ قطعة', rows: 5, cols: 5 },
  { id: 'expert', label: 'خبير', pieces: '٣٦ قطعة', rows: 6, cols: 6 },
];

export default class SetupPanel {
  constructor(app) { this.app = app; this.item = null; this.level = LEVELS[1]; }

  build() {
    this.imgGrid = el('div', { class: 'pz-setup-grid' });
    this.levelRow = el('div', { class: 'pz-levels' });
    this.startBtn = el('button', {
      class: 'pz-start', attrs: { type: 'button', disabled: 'true' },
      on: { click: () => { if (this.item) this.app.startPuzzle(this.item, this.level.rows, this.level.cols); } },
    }, ['▶ ابدأ اللعب']);

    this.el = el('div', { class: 'pz-setup', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'اختيار اللغز' } }, [
      el('div', { class: 'pz-setup__box' }, [
        el('h2', { class: 'pz-setup__title', text: '🧩 اختر صورة اللغز' }),
        this.imgGrid,
        el('h3', { class: 'pz-setup__sub', text: 'مستوى الصعوبة' }),
        this.levelRow,
        this.startBtn,
      ]),
    ]);
    this.render();
    return this.el;
  }

  render() {
    const cm = this.app.content;
    clear(this.imgGrid);
    const items = cm.getPacks().flatMap((p) => cm.getPack(p.id)?.items || []).filter((i) => i.assetType === 'puzzle');
    for (const item of items) {
      const card = el('button', {
        class: `pz-pic ${this.item === item ? 'is-active' : ''}`,
        attrs: { type: 'button', title: item.getTitle('ar') },
        on: { click: () => { this.item = item; this.render(); this.startBtn.removeAttribute('disabled'); } },
      }, [imageThumb(item), el('span', { class: 'pz-pic__name', text: item.getTitle('ar') })]);
      this.imgGrid.append(card);
    }
    clear(this.levelRow);
    for (const lv of LEVELS) {
      this.levelRow.append(chip({
        label: `${lv.label} — ${lv.pieces}`, active: this.level.id === lv.id,
        onClick: () => { this.level = lv; this.render(); },
      }));
    }
  }
}
