/**
 * ParentDashboard — the controller. Manages child profiles, resolves each
 * child's ActivityTracker + achievements, and renders the offline dashboard.
 *
 * 100% offline: profiles and stats live in localStorage. No backend, no login,
 * no cloud. Optionally accepts a Content Engine ContentManager to resolve item
 * / pack names for the "continue / recent / favorite" lists.
 */
import { h } from './util.js';
import ProfileManager from './ProfileManager.js';
import ActivityTracker from './ActivityTracker.js';
import AchievementEngine from './AchievementEngine.js';
import StatsService from './StatsService.js';
import ProfileEditor from './ui/ProfileEditor.js';
import * as V from './ui/DashboardView.js';

export default class ParentDashboard {
  constructor({ mount, options = {} } = {}) {
    this.mountEl = typeof mount === 'string' ? document.querySelector(mount) : mount;
    this.options = options;
    this.content = options.content || null;         // optional Content Engine
    this.onOpenItem = options.onOpenItem || null;   // optional: open a coloring item
    this.profiles = new ProfileManager();
    this.engine = new AchievementEngine();
    this._trackers = new Map();
  }

  tracker(profileId) {
    if (!this._trackers.has(profileId)) this._trackers.set(profileId, new ActivityTracker(profileId));
    return this._trackers.get(profileId);
  }

  /** Expose the active child's tracker so feature modules can record activity. */
  activeTracker() { const a = this.profiles.active(); return a ? this.tracker(a.id) : null; }

  mount() {
    this.root = h('div', { class: 'pd' }, [
      h('header', { class: 'pd-header' }, [
        h('div', { class: 'pd-brand' }, [h('span', { class: 'pd-brand__logo', text: '👨‍👩‍👧' }), h('span', { class: 'pd-brand__title', text: 'لوحة الأهل' })]),
        h('div', { class: 'pd-brand__sub', text: 'كل البيانات محفوظة على جهازك — بدون إنترنت' }),
      ]),
      (this._strip = h('div')),
      (this._content = h('div', { class: 'pd-content' })),
    ]);
    this.mountEl.appendChild(this.root);
    this.profiles.events.on('change', () => this.render());
    this.render();
    return this;
  }

  // ---------- resolvers (Content Engine, optional) ----------
  _resolveItem(id) {
    const it = this.content?.getContent?.(id);
    if (it) return { emoji: it.thumbnail?.value || '🎨', title: it.getTitle ? it.getTitle('ar') : id };
    return { emoji: '🎨', title: id };
  }
  _resolvePack(packId) {
    const p = this.content?.getPack?.(packId);
    if (p) return { emoji: p.thumbnail?.value || '📦', title: p.getTitle ? p.getTitle('ar') : packId };
    const d = this.content?.getPacks?.().find((x) => x.id === packId);
    if (d) return { emoji: d.thumbnail?.value || '📦', title: d.title?.ar || packId };
    return { emoji: '📦', title: packId };
  }
  _totalPages() {
    if (this.options.totalPages) return this.options.totalPages;
    const n = this.content?.filter?.({ assetType: 'coloring' })?.length;
    return n || 44;
  }

  // ---------- rendering ----------
  render() {
    const profiles = this.profiles.list();
    const active = this.profiles.active();

    this._strip.replaceWith(this._strip = V.profileStrip(profiles, active?.id, {
      onSwitch: (id) => { this.profiles.setActive(id); this.render(); },
      onAdd: () => this._openEditor(null),
      onEdit: (p) => this._openEditor(p),
    }));

    if (!active) { this._content.replaceChildren(this._noProfiles()); return; }

    const tr = this.tracker(active.id);
    // evaluate + persist any newly-earned achievements, then read fresh stats
    tr.recordUnlocks(this.engine.newlyUnlocked(tr.getStats()));
    const stats = tr.getStats();
    const totals = StatsService.totals(stats);
    const completion = StatsService.completionPercent(stats, this._totalPages());
    const evaluated = this.engine.evaluate(stats);

    const startedItems = Object.keys(stats.started).map((id) => ({ id }));
    const recentItems = stats.opened.slice(0, 10);
    const favPacks = StatsService.favoriteCategories(stats, 5);

    const overviewHead = h('div', { class: 'pd-overview', style: { '--child': active.favoriteColor } }, [
      h('div', { class: 'pd-overview__avatar', text: active.avatar }),
      h('div', { class: 'pd-overview__info' }, [
        h('div', { class: 'pd-overview__name', text: active.name }),
        h('div', { class: 'pd-overview__meta', text: `${active.age ?? '—'} سنوات · انضم ${new Date(active.createdAt).toLocaleDateString('ar-EG')}` }),
      ]),
      h('div', { class: 'pd-overview__actions' }, [
        h('button', { class: 'pd-btn pd-btn--ghost', text: '✎ تعديل', on: { click: () => this._openEditor(active) } }),
        h('button', { class: 'pd-btn pd-btn--danger', text: '🗑️ حذف', on: { click: () => this._confirmDelete(active) } }),
      ]),
    ]);

    const grid = h('div', { class: 'pd-grid' }, [
      V.activityChart(StatsService.activityByDay(stats, 7)),
      V.achievementGrid(evaluated),
      V.favoriteColors(StatsService.favoriteColors(stats, 6)),
      V.favoriteCategories(favPacks, (id) => this._resolvePack(id)),
      V.itemList('أكمل التلوين', '▶', startedItems, { resolveItem: (id) => this._resolveItem(id), onOpen: (id) => this._open(id), emptyMsg: 'لا توجد صفحات غير مكتملة' }),
      V.itemList('المستخدمة مؤخرًا', '🕘', recentItems, { resolveItem: (id) => this._resolveItem(id), onOpen: (id) => this._open(id), emptyMsg: 'لا يوجد نشاط بعد' }),
    ]);

    this._content.replaceChildren(overviewHead, V.statTiles(totals, completion), grid);
  }

  _open(id) { if (this.onOpenItem) this.onOpenItem(id); }

  _openEditor(profile) {
    new ProfileEditor({
      profile,
      onSave: (data) => {
        if (profile) this.profiles.update(profile.id, data);
        else this.profiles.setActive(this.profiles.create(data).id);
        this.render();
      },
    }).open();
  }

  _confirmDelete(profile) {
    const back = h('div', { class: 'pd-backdrop is-open', on: { click: (e) => { if (e.target === back) back.remove(); } } }, [
      h('div', { class: 'pd-dialog' }, [
        h('h3', { class: 'pd-dialog__title', text: 'حذف الملف؟' }),
        h('p', { class: 'pd-confirm__text', text: `سيتم حذف ملف "${profile.name}" وكل بياناته من هذا الجهاز.` }),
        h('div', { class: 'pd-dialog__actions' }, [
          h('button', { class: 'pd-btn pd-btn--ghost', text: 'إلغاء', on: { click: () => back.remove() } }),
          h('button', { class: 'pd-btn pd-btn--danger', text: 'حذف', on: { click: () => { this.profiles.remove(profile.id); back.remove(); this.render(); } } }),
        ]),
      ]),
    ]);
    document.body.appendChild(back);
  }

  _noProfiles() {
    return h('div', { class: 'pd-noprofiles' }, [
      h('div', { class: 'pd-noprofiles__emoji', text: '👶' }),
      h('h2', { text: 'أضِف أول طفل' }),
      h('p', { text: 'أنشئ ملفًا لكل طفل لتتبّع تقدّمه وإنجازاته — كل شيء يُحفظ على جهازك.' }),
      h('button', { class: 'pd-btn pd-btn--primary pd-btn--lg', text: '＋ إنشاء ملف', on: { click: () => this._openEditor(null) } }),
    ]);
  }

  destroy() { this.root?.remove(); }
}
