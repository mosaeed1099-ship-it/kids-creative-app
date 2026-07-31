/**
 * SettingsPanel — print settings controls: page size, orientation, margins,
 * scale, fit-to-page, and color / black&white. Writes to PrintSettings.
 */
import { h } from '../util.js';

export default function SettingsPanel(settings, onChange = () => {}) {
  const s = settings.get();
  const seg = (label, key, options) => h('div', { class: 'pc-set' }, [
    h('span', { class: 'pc-set__lbl', text: label }),
    h('div', { class: 'pc-seg' }, options.map((o) => h('button', {
      class: `pc-seg__b ${s[key] === o.v ? 'is-on' : ''}`, text: o.t,
      on: { click: (e) => { settings.set(key, o.v); [...e.target.parentNode.children].forEach((c) => c.classList.remove('is-on')); e.target.classList.add('is-on'); onChange(); } },
    }))),
  ]);

  const fitBtn = h('button', { class: `pc-seg__b ${s.fit ? 'is-on' : ''}`, text: s.fit ? 'مفعّل' : 'متوقف',
    on: { click: () => { const v = !settings.value('fit'); settings.set('fit', v); fitBtn.classList.toggle('is-on', v); fitBtn.textContent = v ? 'مفعّل' : 'متوقف'; onChange(); } } });

  const scaleVal = h('span', { class: 'pc-set__val', text: `${Math.round(s.scale * 100)}%` });
  const scale = h('input', { type: 'range', min: '50', max: '150', value: Math.round(s.scale * 100), class: 'pc-range',
    on: { input: (e) => { settings.set('scale', +e.target.value / 100); scaleVal.textContent = `${e.target.value}%`; onChange(); } } });

  const marginVal = h('span', { class: 'pc-set__val', text: `${s.marginMm}mm` });
  const margin = h('input', { type: 'range', min: '0', max: '25', value: s.marginMm, class: 'pc-range',
    on: { input: (e) => { settings.set('marginMm', +e.target.value); marginVal.textContent = `${e.target.value}mm`; onChange(); } } });

  return h('div', { class: 'pc-settings' }, [
    seg('حجم الورق', 'pageSize', [{ v: 'A4', t: 'A4' }, { v: 'Letter', t: 'Letter' }]),
    seg('الاتجاه', 'orientation', [{ v: 'portrait', t: 'طولي' }, { v: 'landscape', t: 'عرضي' }]),
    seg('الألوان', 'color', [{ v: 'color', t: '🌈 ملوّن' }, { v: 'bw', t: '⚫ أبيض وأسود' }]),
    h('div', { class: 'pc-set' }, [h('span', { class: 'pc-set__lbl', text: 'ملاءمة الصفحة' }), h('div', { class: 'pc-seg' }, [fitBtn])]),
    h('div', { class: 'pc-set' }, [h('span', { class: 'pc-set__lbl', text: 'التكبير' }), scale, scaleVal]),
    h('div', { class: 'pc-set' }, [h('span', { class: 'pc-set__lbl', text: 'الهوامش' }), margin, marginVal]),
  ]);
}
