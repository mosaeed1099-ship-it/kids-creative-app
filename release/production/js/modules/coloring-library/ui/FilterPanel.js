/**
 * FilterPanel — collapsible chips for age, difficulty, language and pack.
 * Purely reflects `facets` and reports changes via onChange(state). The library
 * decides what to do with the state (search + filter through the Content Engine).
 */
import { h } from './h.js';

const AGE_LABEL = { toddler: '2–3', preschool: '4–5', kids: '6–8', tweens: '9–12' };
const DIFF_LABEL = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
const LANG_LABEL = { ar: 'العربية', en: 'English' };

export default class FilterPanel {
  constructor({ facets, state, onChange }) {
    this.facets = facets;
    this.state = state;
    this.onChange = onChange;
  }

  _group(label, key, options, labelFn) {
    const chips = options.map((val) => {
      const active = this.state[key] === val;
      const chip = h('button', {
        class: `clrlib-fchip ${active ? 'is-active' : ''}`,
        text: labelFn ? labelFn(val) : val,
        on: { click: () => {
          this.state[key] = this.state[key] === val ? null : val; // toggle
          this._refresh();
          this.onChange({ ...this.state });
        } },
      });
      return chip;
    });
    return h('div', { class: 'clrlib-fgroup' }, [
      h('span', { class: 'clrlib-fgroup__label', text: label }),
      h('div', { class: 'clrlib-fgroup__chips' }, chips),
    ]);
  }

  _refresh() {
    // re-render chips' active state in place
    this.el.querySelectorAll('.clrlib-fgroup').forEach((g) => {
      g.querySelectorAll('.clrlib-fchip').forEach((c) => c.classList.remove('is-active'));
    });
    // simplest: rebuild
    const fresh = this.build();
    this.el.replaceWith(fresh);
    this.el = fresh;
  }

  build() {
    const clear = h('button', {
      class: 'clrlib-fclear', text: '✕ مسح الفلاتر',
      on: { click: () => { this.state = { age: null, ageGroup: null, difficulty: null, language: null, packId: null, favorites: false }; this.onChange({ ...this.state }); this._refresh(); } },
    });

    this.el = h('div', { class: 'clrlib-filters' }, [
      this._group('العمر', 'ageGroup', this.facets.age, (v) => AGE_LABEL[v] || v),
      this._group('الصعوبة', 'difficulty', this.facets.difficulty, (v) => DIFF_LABEL[v] || v),
      this._group('اللغة', 'language', this.facets.languages, (v) => LANG_LABEL[v] || v),
      this._group('الباقة', 'packId', this.facets.packs.map((p) => p.id),
        (id) => { const p = this.facets.packs.find((x) => x.id === id); return `${p.emoji || ''} ${p.title.ar || id}`; }),
      clear,
    ]);
    return this.el;
  }
}
