/**
 * SelectTool.js — thin ITool wrapper that drives the SelectionController (owned
 * by the app so the floating toolbar can call flip/rotate/delete). Committing on
 * deactivate means switching tools keeps the selection in the artwork.
 */
import { ITool } from '../../../engine/index.js';

export default class SelectTool extends ITool {
  constructor(app) { super('select'); this.app = app; this._pid = null; }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'default'; }
  onDeactivate() { this.app.selection.commitIfFloating(); }

  onPointerDown(p) {
    if (this._pid !== null) return true;
    if (!this.app.canDrawOnActive()) { this.app.warnLocked(); return true; }
    this._pid = p.id;
    this.app.selection.begin(this.app.view.clientToDoc(p.native.clientX, p.native.clientY));
    return true;
  }

  onPointerMove(p) {
    if (this._pid !== p.id) return false;
    this.app.selection.move(this.app.view.clientToDoc(p.native.clientX, p.native.clientY));
    return true;
  }

  onPointerUp(p) {
    if (this._pid !== p.id) return this._pid !== null;
    this._pid = null;
    this.app.selection.end();
    return true;
  }

  cancel() { this._pid = null; this.app.selection.cancelDrag(); }

  render(ctx) {
    ctx.save();
    this.app.applyDocTransform(ctx);
    this.app.selection.render(ctx);
    ctx.restore();
  }
}
