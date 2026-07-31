/**
 * PaintCommand — an undo/redo unit for the engine HistoryManager.
 * Stores the paint-layer ImageData BEFORE and AFTER a change. The change is
 * already applied when the command is recorded, so execute() (redo) restores
 * `after` and undo() restores `before`.
 *
 * Uses the engine's ICommand contract — no engine internals touched.
 */
import { ICommand } from '../../../engine/index.js';

export default class PaintCommand extends ICommand {
  /**
   * @param {import('./PaintSurface.js').default} surface
   * @param {ImageData} before
   * @param {ImageData} after
   * @param {() => void} [onChange] - e.g. engine.invalidate + save
   * @param {string} [label]
   */
  constructor(surface, before, after, onChange = null, label = 'Paint') {
    super(label);
    this.surface = surface;
    this.before = before;
    this.after = after;
    this.onChange = onChange;
  }

  execute() { this.surface.restore(this.after); this.onChange?.(); }
  undo() { this.surface.restore(this.before); this.onChange?.(); }
}
