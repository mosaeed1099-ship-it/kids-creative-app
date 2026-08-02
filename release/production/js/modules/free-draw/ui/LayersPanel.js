/**
 * LayersPanel.js — the layer stack UI: add / duplicate / merge-down / delete /
 * clear, per-layer visibility, lock, opacity, rename and reorder (up/down), with
 * a live thumbnail and active-layer selection. Drives app layer operations.
 */
import { el, clear } from '../../../utils/dom.js';
import { section, iconBtn } from './helpers.js';

export default class LayersPanel {
  constructor(app) { this.app = app; }

  build() {
    const a = this.app;
    const bar = el('div', { class: 'fd-layers-bar' }, [
      iconBtn({ emoji: '➕', title: 'طبقة جديدة', onClick: () => a.addLayer() }),
      iconBtn({ emoji: '📑', title: 'تكرار الطبقة', onClick: () => a.duplicateActiveLayer() }),
      iconBtn({ emoji: '⬇️', title: 'دمج مع الأسفل', onClick: () => a.mergeActiveDown() }),
      iconBtn({ emoji: '🧹', title: 'مسح الطبقة', onClick: () => a.clearActiveLayer() }),
      iconBtn({ emoji: '🗑️', title: 'حذف الطبقة', onClick: () => a.deleteActiveLayer() }),
    ]);
    this.list = el('div', { class: 'fd-layers-list' });
    this.el = section('الطبقات', '🗂️', [bar, this.list]);
    this.refresh();
    return this.el;
  }

  refresh() {
    const a = this.app;
    if (!a.doc) return; // built before the document exists; app re-refreshes later
    clear(this.list);
    const active = a.doc.active;
    // top layer first
    [...a.doc.layers].reverse().forEach((layer) => {
      const idx = a.doc.indexOf(layer);
      const thumb = el('canvas', { class: 'fd-layer-thumb', attrs: { width: 52, height: 40 } });
      this._thumb(thumb, layer);

      const name = el('span', { class: 'fd-layer-name', text: layer.name, attrs: { title: 'انقر مرتين لإعادة التسمية' } });
      name.addEventListener('dblclick', () => {
        const n = window.prompt('اسم الطبقة', layer.name);
        if (n != null) { a.renameLayer(layer, n.trim() || layer.name); }
      });

      const vis = iconBtn({ emoji: layer.visible ? '👁️' : '🚫', title: 'إظهار/إخفاء',
        onClick: (e) => { e.stopPropagation(); a.toggleLayerVisible(layer); } });
      const lock = iconBtn({ emoji: layer.locked ? '🔒' : '🔓', title: 'قفل/فتح',
        onClick: (e) => { e.stopPropagation(); a.toggleLayerLock(layer); } });
      const up = iconBtn({ emoji: '🔼', title: 'أعلى', onClick: (e) => { e.stopPropagation(); a.moveLayer(layer, +1); } });
      const down = iconBtn({ emoji: '🔽', title: 'أسفل', onClick: (e) => { e.stopPropagation(); a.moveLayer(layer, -1); } });

      const op = el('input', { class: 'fd-layer-op', attrs: { type: 'range', min: '0', max: '100', value: String(Math.round(layer.opacity * 100)), 'aria-label': 'شفافية الطبقة' } });
      op.addEventListener('input', (e) => { e.stopPropagation(); a.setLayerOpacity(layer, +e.target.value / 100); });
      op.addEventListener('pointerdown', (e) => e.stopPropagation());

      const row = el('div', { class: `fd-layer ${layer === active ? 'is-active' : ''}`, attrs: { role: 'button', 'aria-label': layer.name } }, [
        thumb,
        el('div', { class: 'fd-layer-info' }, [name, op]),
        el('div', { class: 'fd-layer-ctrls' }, [vis, lock, up, down]),
      ]);
      row.addEventListener('click', () => { a.setActiveLayer(layer); });
      this.list.append(row);
    });
  }

  _thumb(canvas, layer) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(127,127,127,0.12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(layer.canvas, 0, 0, canvas.width, canvas.height);
  }
}
