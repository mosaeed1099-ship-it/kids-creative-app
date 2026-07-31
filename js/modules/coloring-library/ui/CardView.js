/**
 * CardView — one artwork card: a large lazy-loaded thumbnail (the real line-art
 * as an image, emoji fallback), title, meta chips, a favorite heart, and a
 * "continue" badge when saved progress exists. Tapping opens the Coloring
 * Module via the library's open() callback.
 */
import { h } from './h.js';

const DIFF_LABEL = { easy: 'سهل', medium: 'متوسط', hard: 'صعب' };

export default function CardView(item, { lib, size = 'md' } = {}) {
  const inProgress = lib.model.hasProgress(item.id);
  const fav = lib.model.isFavorite(item.id);
  const bg = item.thumbnail?.color || '#eef1ff';

  // lazy image thumbnail (real artwork); emoji shows underneath as fallback
  const img = h('img', {
    class: 'clrlib-card__img', alt: item.getTitle('ar'),
    dataset: { src: lib.resolveThumb(item) }, loading: 'lazy',
  });
  const emoji = h('span', { class: 'clrlib-card__emoji', text: item.thumbnail?.value || '🎨' });

  const heart = h('button', {
    class: `clrlib-heart ${fav ? 'is-fav' : ''}`, title: 'المفضلة',
    on: { click: (e) => { e.stopPropagation(); const nowFav = lib.model.toggleFavorite(item.id); heart.classList.toggle('is-fav', nowFav); heart.textContent = nowFav ? '❤️' : '🤍'; } },
  }, fav ? '❤️' : '🤍');

  const badge = inProgress ? h('span', { class: 'clrlib-card__badge', text: '▶ أكمل' }) : null;

  const thumb = h('div', { class: 'clrlib-card__thumb', style: { background: bg } }, [emoji, img, heart, badge]);

  const meta = h('div', { class: 'clrlib-card__meta' }, [
    h('span', { class: 'clrlib-chip', text: DIFF_LABEL[item.difficulty] || item.difficulty || '' }),
  ]);

  const card = h('button', {
    class: `clrlib-card clrlib-card--${size} anim-pop`,
    on: { click: () => lib.open(item) },
  }, [
    thumb,
    h('div', { class: 'clrlib-card__title', text: item.getTitle('ar') }),
    meta,
  ]);

  lib.lazy.observe(img);
  return card;
}
