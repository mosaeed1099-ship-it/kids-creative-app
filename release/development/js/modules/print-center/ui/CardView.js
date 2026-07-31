/**
 * CardView — a printable item card: large lazy preview thumbnail, title, type
 * badge, a select checkbox, a favorite heart and an add-to-queue toggle.
 */
import { h } from '../util.js';

const TYPE_LABEL = {
  coloring: 'تلوين', trace: 'تتبّع', pdf: 'PDF', worksheet: 'ورقة عمل',
  flashcard: 'بطاقة', activity: 'نشاط', certificate: 'شهادة', poster: 'بوستر',
};

export default function CardView(item, { pc }) {
  const bg = item.thumbnail?.color || '#eef1ff';
  const img = h('img', { class: 'pc-card__img', alt: item.getTitle('ar'), dataset: { src: pc.resolveThumb(item) } });
  const emoji = h('span', { class: 'pc-card__emoji', text: item.thumbnail?.value || '📄' });

  const check = h('button', { class: `pc-check ${pc.isSelected(item.id) ? 'is-on' : ''}`, title: 'تحديد',
    on: { click: (e) => { e.stopPropagation(); const on = pc.toggleSelect(item.id); check.classList.toggle('is-on', on); } } }, pc.isSelected(item.id) ? '✔' : '');

  const heart = h('button', { class: `pc-heart ${pc.isFav(item.id) ? 'is-fav' : ''}`, title: 'المفضلة',
    on: { click: (e) => { e.stopPropagation(); const f = pc.toggleFav(item.id); heart.classList.toggle('is-fav', f); heart.textContent = f ? '❤️' : '🤍'; } } }, pc.isFav(item.id) ? '❤️' : '🤍');

  const queueBtn = h('button', { class: `pc-qbtn ${pc.inQueue(item.id) ? 'is-in' : ''}`, title: 'أضف للطابور',
    on: { click: (e) => { e.stopPropagation(); const inq = pc.toggleQueue(item.id); queueBtn.classList.toggle('is-in', inq); queueBtn.textContent = inq ? '✓ في الطابور' : '➕ الطابور'; } } },
    pc.inQueue(item.id) ? '✓ في الطابور' : '➕ الطابور');

  const thumb = h('div', { class: 'pc-card__thumb', style: { background: bg } }, [emoji, img, check, heart]);
  const card = h('div', { class: 'pc-card anim-pop', on: { click: () => pc.preview([item.id]) } }, [
    thumb,
    h('div', { class: 'pc-card__title', text: item.getTitle('ar') }),
    h('div', { class: 'pc-card__row' }, [
      h('span', { class: 'pc-badge', text: TYPE_LABEL[item.assetType] || item.assetType }),
      queueBtn,
    ]),
  ]);
  pc.lazy.observe(img);
  return card;
}
