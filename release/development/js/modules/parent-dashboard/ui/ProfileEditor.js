/**
 * ProfileEditor — modal dialog to create or edit a child profile.
 * Fields: name, avatar (emoji picker), age, favorite color.
 */
import { h } from '../util.js';
import Profile from '../model/Profile.js';

const COLORS = ['#ff5a5a', '#ff9a3d', '#ffd23d', '#57c98a', '#35b0ff', '#5b6bff', '#b06bff', '#ff6bb0'];

export default class ProfileEditor {
  constructor({ profile = null, onSave = () => {}, onCancel = () => {} } = {}) {
    this.profile = profile;
    this.onSave = onSave;
    this.onCancel = onCancel;
    this.data = {
      name: profile?.name || '',
      avatar: profile?.avatar || Profile.avatars()[0],
      age: profile?.age ?? 4,
      favoriteColor: profile?.favoriteColor || '#5b6bff',
    };
  }

  open() {
    const nameInput = h('input', { class: 'pd-field__input', type: 'text', value: this.data.name, placeholder: 'اسم الطفل', maxlength: '20', on: { input: (e) => { this.data.name = e.target.value; } } });

    const avatarGrid = h('div', { class: 'pd-avatars' }, Profile.avatars().map((a) => {
      const b = h('button', { class: `pd-avatar ${a === this.data.avatar ? 'is-active' : ''}`, text: a, on: { click: () => { this.data.avatar = a; avatarGrid.querySelectorAll('.pd-avatar').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); } } });
      return b;
    }));

    const ageInput = h('input', { class: 'pd-field__input', type: 'number', min: '1', max: '14', value: this.data.age, on: { input: (e) => { this.data.age = +e.target.value; } } });

    const colorRow = h('div', { class: 'pd-colors' }, COLORS.map((c) => {
      const b = h('button', { class: `pd-color ${c === this.data.favoriteColor ? 'is-active' : ''}`, style: { background: c }, on: { click: () => { this.data.favoriteColor = c; colorRow.querySelectorAll('.pd-color').forEach((x) => x.classList.remove('is-active')); b.classList.add('is-active'); } } });
      return b;
    }));

    const err = h('div', { class: 'pd-editor__err' });
    const save = h('button', { class: 'pd-btn pd-btn--primary', text: this.profile ? 'حفظ' : 'إنشاء', on: { click: () => {
      if (!this.data.name.trim()) { err.textContent = 'من فضلك اكتب اسم الطفل'; return; }
      this.onSave({ ...this.data, name: this.data.name.trim() });
      this.close();
    } } });
    const cancel = h('button', { class: 'pd-btn pd-btn--ghost', text: 'إلغاء', on: { click: () => { this.onCancel(); this.close(); } } });

    const dialog = h('div', { class: 'pd-dialog' }, [
      h('h3', { class: 'pd-dialog__title', text: this.profile ? 'تعديل الملف' : 'ملف جديد' }),
      h('label', { class: 'pd-field' }, [h('span', { text: 'الاسم' }), nameInput]),
      h('label', { class: 'pd-field' }, [h('span', { text: 'الصورة الرمزية' }), avatarGrid]),
      h('label', { class: 'pd-field' }, [h('span', { text: 'العمر' }), ageInput]),
      h('label', { class: 'pd-field' }, [h('span', { text: 'اللون المفضّل' }), colorRow]),
      err,
      h('div', { class: 'pd-dialog__actions' }, [cancel, save]),
    ]);

    this.el = h('div', { class: 'pd-backdrop', on: { click: (e) => { if (e.target === this.el) { this.onCancel(); this.close(); } } } }, [dialog]);
    document.body.appendChild(this.el);
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    return this;
  }

  close() { this.el?.classList.remove('is-open'); const el = this.el; setTimeout(() => el?.remove(), 200); this.el = null; }
}
