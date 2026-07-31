/**
 * DashboardView — pure builders for the dashboard pieces (profile strip, stat
 * tiles, weekly activity chart, achievements grid, item lists). No state; the
 * ParentDashboard controller passes computed data in and wires callbacks.
 */
import { h } from '../util.js';

/* ---------- profile strip (child switcher) ---------- */
export function profileStrip(profiles, activeId, { onSwitch, onAdd, onEdit }) {
  const cards = profiles.map((p) => h('button', {
    class: `pd-childcard ${p.id === activeId ? 'is-active' : ''}`,
    style: { '--child': p.favoriteColor },
    on: { click: () => onSwitch(p.id) },
  }, [
    h('span', { class: 'pd-childcard__avatar', text: p.avatar }),
    h('span', { class: 'pd-childcard__name', text: p.name }),
    h('span', { class: 'pd-childcard__age', text: p.age != null ? `${p.age} سنوات` : '' }),
    h('span', { class: 'pd-childcard__edit', title: 'تعديل', text: '✎', on: { click: (e) => { e.stopPropagation(); onEdit(p); } } }),
  ]));
  const add = h('button', { class: 'pd-childcard pd-childcard--add', on: { click: onAdd } }, [
    h('span', { class: 'pd-childcard__avatar', text: '＋' }),
    h('span', { class: 'pd-childcard__name', text: 'إضافة طفل' }),
  ]);
  return h('div', { class: 'pd-strip' }, [...cards, add]);
}

/* ---------- stat tiles ---------- */
export function statTile(icon, value, label, color) {
  return h('div', { class: 'pd-tile', style: { '--tile': color || 'var(--pd-primary)' } }, [
    h('div', { class: 'pd-tile__icon', text: icon }),
    h('div', { class: 'pd-tile__value', text: String(value) }),
    h('div', { class: 'pd-tile__label', text: label }),
  ]);
}

export function statTiles(totals, completionPercent) {
  return h('div', { class: 'pd-tiles' }, [
    statTile('✅', totals.completed, 'صفحات مكتملة', '#57c98a'),
    statTile('▶️', totals.started, 'قيد التنفيذ', '#ff9a3d'),
    statTile('❤️', totals.favorites, 'المفضلة', '#ff6bb0'),
    statTile('🖼️', totals.drawings, 'إجمالي الرسومات', '#5b6bff'),
    statTile('🖨️', totals.prints, 'طباعة', '#35b0ff'),
    statTile('📤', totals.exports, 'تصدير', '#b06bff'),
    statTile('🔥', `${totals.activeStreak}`, 'أيام متتالية', '#ff5a5a'),
    statTile('⏱️', `${totals.timeMinutes}د`, 'وقت اللعب', '#57c98a'),
    statTile('📦', totals.packsCompleted, 'باقات مكتملة', '#8a5a2b'),
    statTile('📊', `${completionPercent}%`, 'نسبة الإنجاز', '#ffb02e'),
  ]);
}

/* ---------- weekly activity chart (SVG bars) ---------- */
export function activityChart(days) {
  const W = 520, H = 180, pad = 28, gap = 12;
  const max = Math.max(1, ...days.map((d) => d.count));
  const bw = (W - pad * 2 - gap * (days.length - 1)) / days.length;
  const bars = [];
  days.forEach((d, i) => {
    const x = pad + i * (bw + gap);
    const bh = Math.round((d.count / max) * (H - pad - 28));
    const y = H - 28 - bh;
    bars.push(`<rect x="${x}" y="${y}" width="${bw}" height="${Math.max(2, bh)}" rx="7" fill="var(--pd-primary)"></rect>`);
    if (d.count > 0) bars.push(`<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" font-size="12" font-weight="700" fill="var(--pd-text)">${d.count}</text>`);
    bars.push(`<text x="${x + bw / 2}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--pd-muted)">${d.label}</text>`);
  });
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="النشاط الأسبوعي">${bars.join('')}</svg>`;
  return h('div', { class: 'pd-card pd-chartcard' }, [
    h('h3', { class: 'pd-card__title', text: '📈 النشاط الأسبوعي' }),
    h('div', { class: 'pd-chart', html: svg }),
  ]);
}

/* ---------- achievements ---------- */
export function achievementGrid(evaluated) {
  const badges = evaluated.map((r) => h('div', {
    class: `pd-badge ${r.unlocked ? 'is-unlocked' : 'is-locked'}`, title: r.def.desc?.ar || '',
  }, [
    h('div', { class: 'pd-badge__icon', text: r.unlocked ? r.def.icon : '🔒' }),
    h('div', { class: 'pd-badge__title', text: r.def.title.ar }),
  ]));
  const unlocked = evaluated.filter((r) => r.unlocked).length;
  return h('div', { class: 'pd-card' }, [
    h('h3', { class: 'pd-card__title', text: `🏆 الإنجازات (${unlocked}/${evaluated.length})` }),
    h('div', { class: 'pd-badges' }, badges),
  ]);
}

/* ---------- favorite colors / categories ---------- */
export function favoriteColors(colors) {
  const body = colors.length
    ? h('div', { class: 'pd-favcolors' }, colors.map((c) => h('div', { class: 'pd-favcolor' }, [
        h('span', { class: 'pd-favcolor__sw', style: { background: c.hex } }),
        h('span', { class: 'pd-favcolor__n', text: String(c.count) }),
      ])))
    : emptyText('لا توجد ألوان بعد');
  return h('div', { class: 'pd-card' }, [h('h3', { class: 'pd-card__title', text: '🎨 الألوان المفضّلة' }), body]);
}

export function favoriteCategories(cats, resolvePack) {
  const body = cats.length
    ? h('div', { class: 'pd-catlist' }, cats.map((c) => {
        const info = resolvePack(c.packId);
        return h('div', { class: 'pd-catrow' }, [
          h('span', { class: 'pd-catrow__emoji', text: info.emoji }),
          h('span', { class: 'pd-catrow__title', text: info.title }),
          h('span', { class: 'pd-catrow__count', text: `${c.count}` }),
        ]);
      }))
    : emptyText('لا توجد تصنيفات بعد');
  return h('div', { class: 'pd-card' }, [h('h3', { class: 'pd-card__title', text: '📚 التصنيفات المفضّلة' }), body]);
}

/* ---------- item lists (continue / recent / favorites) ---------- */
export function itemList(title, icon, items, { resolveItem, onOpen, emptyMsg }) {
  const body = items.length
    ? h('div', { class: 'pd-items' }, items.map((entry) => {
        const info = resolveItem(entry.id || entry);
        return h('button', { class: 'pd-item', on: { click: () => onOpen && onOpen(entry.id || entry) } }, [
          h('span', { class: 'pd-item__emoji', text: info.emoji }),
          h('span', { class: 'pd-item__title', text: info.title }),
        ]);
      }))
    : emptyText(emptyMsg);
  return h('div', { class: 'pd-card' }, [h('h3', { class: 'pd-card__title' }, [`${icon} `, title]), body]);
}

function emptyText(msg) {
  return h('div', { class: 'pd-empty' }, [h('span', { class: 'pd-empty__emoji', text: '🌱' }), h('span', { text: msg || 'لا توجد بيانات بعد' })]);
}
