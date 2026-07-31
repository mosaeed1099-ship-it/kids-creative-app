/**
 * Library — the activity picker: search + type/difficulty/age filters and a
 * responsive card grid with per-item progress (stars, completed, continue).
 * Presentation only; the controller supplies items + callbacks.
 */
import { h } from '../activities/base.js';
import { TYPE_META } from '../ActivityRegistry.js';

const DIFF = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };
const AGE = { toddler: 'صغار', preschool: 'تمهيدي', child: 'أطفال', kids: 'أطفال' };

export default class Library {
  constructor({ items, tracker, onOpen }) {
    this.items = items; this.tracker = tracker; this.onOpen = onOpen;
    this.state = { q: '', type: null, difficulty: null, age: null };
  }

  build() {
    this.el = h('div', { class: 'la-lib' });

    // hero / stats
    this.statsEl = h('div', { class: 'la-lib__stats' });
    this.el.appendChild(h('div', { class: 'la-lib__hero' }, [
      h('div', { class: 'la-lib__brand' }, [h('span', { text: '🎯' }), h('span', { class: 'la-lib__brandT', text: 'أنشطة تعليمية' })]),
      this.statsEl,
    ]));

    // search
    this.search = h('input', { class: 'la-lib__search', type: 'search', placeholder: '🔍 ابحث عن نشاط…', on: { input: () => { this.state.q = this.search.value; this._renderGrid(); } } });
    this.el.appendChild(this.search);

    // filters
    this.filtersEl = h('div', { class: 'la-lib__filters' });
    this.el.appendChild(this.filtersEl);

    // grid
    this.grid = h('div', { class: 'la-lib__grid' });
    this.el.appendChild(this.grid);

    this._buildFilters();
    this._renderStats();
    this._renderGrid();
    return this.el;
  }

  refresh() { this._renderStats(); this._renderGrid(); }

  _renderStats() {
    const s = this.tracker.stats();
    this.statsEl.replaceChildren(
      h('span', { class: 'la-lib__stat', text: `✅ ${s.completed}/${this.items.length}` }),
      h('span', { class: 'la-lib__stat', text: `⭐ ${s.totalStars}` }),
    );
  }

  _chip(label, key, val, active) {
    return h('button', { class: 'la-chip' + (active ? ' is-on' : ''), text: label,
      on: { click: () => { this.state[key] = this.state[key] === val ? null : val; this._buildFilters(); this._renderGrid(); } } });
  }

  _buildFilters() {
    const types = [...new Set(this.items.map((i) => i.data?.type).filter(Boolean))];
    const diffs = [...new Set(this.items.map((i) => i.difficulty).filter(Boolean))];
    const ages = [...new Set(this.items.map((i) => i.ageGroup).filter(Boolean))];

    const row = (label, chips) => h('div', { class: 'la-lib__frow' }, [h('span', { class: 'la-lib__flabel', text: label }), ...chips]);

    this.filtersEl.replaceChildren(
      row('النوع', [this._chip('الكل', 'type', null, !this.state.type),
        ...types.map((t) => this._chip(`${TYPE_META[t]?.icon || ''} ${TYPE_META[t]?.label || t}`, 'type', t, this.state.type === t))]),
      row('المستوى', [this._chip('الكل', 'difficulty', null, !this.state.difficulty),
        ...diffs.map((d) => this._chip(DIFF[d] || d, 'difficulty', d, this.state.difficulty === d))]),
      row('العمر', [this._chip('الكل', 'age', null, !this.state.age),
        ...ages.map((a) => this._chip(AGE[a] || a, 'age', a, this.state.age === a))]),
    );
  }

  _filtered() {
    const q = this.state.q.trim().toLowerCase();
    return this.items.filter((it) => {
      if (this.state.type && it.data?.type !== this.state.type) return false;
      if (this.state.difficulty && it.difficulty !== this.state.difficulty) return false;
      if (this.state.age && it.ageGroup !== this.state.age) return false;
      if (q && !(it.getTitle('ar').toLowerCase().includes(q) || it.tagSlugs().some((t) => t.includes(q)) || (TYPE_META[it.data?.type]?.label || '').includes(q))) return false;
      return true;
    });
  }

  _renderGrid() {
    const items = this._filtered();
    if (!items.length) { this.grid.replaceChildren(h('div', { class: 'la-lib__empty' }, [h('div', { class: 'la-lib__emptyE', text: '🔎' }), h('div', { text: 'لا توجد أنشطة مطابقة' })])); return; }
    this.grid.replaceChildren(...items.map((it) => this._card(it)));
  }

  _card(it) {
    const stars = this.tracker.best(it.id);
    const completed = this.tracker.isCompleted(it.id);
    const cont = this.tracker.hasSaved(it.id) && !completed;
    const type = it.data?.type;
    const thumb = it.thumbnail?.value || TYPE_META[type]?.icon || '🎯';

    const starRow = h('div', { class: 'la-card__stars' }, [1, 2, 3].map((i) => h('span', { class: 'la-card__star' + (i <= stars ? ' is-on' : ''), text: '★' })));

    const card = h('button', { class: 'la-card' + (completed ? ' is-done' : ''),
      on: { click: () => this.onOpen(it, { resume: cont }) } }, [
      h('div', { class: 'la-card__thumb' }, [
        h('span', { class: 'la-card__emoji', text: thumb }),
        completed ? h('span', { class: 'la-card__check', text: '✓' }) : null,
        cont ? h('span', { class: 'la-card__cont', text: 'متابعة' }) : null,
      ]),
      h('div', { class: 'la-card__title', text: it.getTitle('ar') }),
      h('div', { class: 'la-card__meta' }, [
        h('span', { class: 'la-badge la-badge--type', text: `${TYPE_META[type]?.icon || ''} ${TYPE_META[type]?.label || type}` }),
        h('span', { class: 'la-badge la-badge--' + (it.difficulty || 'easy'), text: DIFF[it.difficulty] || '' }),
      ]),
      starRow,
    ]);
    return card;
  }
}
