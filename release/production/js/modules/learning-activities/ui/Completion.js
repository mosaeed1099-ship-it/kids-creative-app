/**
 * Completion — the celebration screen shown when an activity is finished.
 * Shows earned stars, any newly-unlocked reward badges, and next actions.
 */
import { h, celebrate } from '../activities/base.js';

export default function Completion({ item, stars, badges = [], onRetry, onNext, onBack, hasNext }) {
  const el = h('div', { class: 'la-done' });
  const card = h('div', { class: 'la-done__card la-pop' });

  card.appendChild(h('div', { class: 'la-done__burst', text: '🎉' }));
  card.appendChild(h('h2', { class: 'la-done__title', text: 'أحسنت!' }));
  card.appendChild(h('div', { class: 'la-done__sub', text: item.getTitle('ar') }));

  const starRow = h('div', { class: 'la-done__stars' });
  for (let i = 1; i <= 3; i++) starRow.appendChild(h('span', { class: 'la-done__star' + (i <= stars ? ' is-on' : ''), text: '★' }));
  card.appendChild(starRow);

  if (badges.length) {
    const bwrap = h('div', { class: 'la-done__badges' });
    bwrap.appendChild(h('div', { class: 'la-done__badgesH', text: '🎁 مكافأة جديدة!' }));
    const row = h('div', { class: 'la-done__badgeRow' });
    badges.forEach((b) => row.appendChild(h('div', { class: 'la-done__badge la-pop' }, [h('span', { class: 'la-done__badgeI', text: b.icon }), h('span', { class: 'la-done__badgeT', text: b.title })])));
    bwrap.appendChild(row); card.appendChild(bwrap);
  }

  const actions = h('div', { class: 'la-done__actions' });
  actions.appendChild(h('button', { class: 'la-btn', text: '🔁 مرة أخرى', on: { click: onRetry } }));
  if (hasNext) actions.appendChild(h('button', { class: 'la-btn la-btn--primary', text: 'التالي ⏭️', on: { click: onNext } }));
  actions.appendChild(h('button', { class: 'la-btn', text: '📚 المكتبة', on: { click: onBack } }));
  card.appendChild(actions);

  el.appendChild(card);
  setTimeout(() => celebrate(el), 60);
  return el;
}
