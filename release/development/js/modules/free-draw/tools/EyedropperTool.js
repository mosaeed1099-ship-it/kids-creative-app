/**
 * EyedropperTool.js — pick a colour from the artwork. Samples the top-most
 * opaque pixel across visible layers at the tapped point, sets it as the current
 * colour, then returns to the previously-used drawing tool.
 */
import { ITool } from '../../../engine/index.js';

export default class EyedropperTool extends ITool {
  constructor(app) { super('eyedropper'); this.app = app; }

  onActivate() { this.app.engine.viewport.canvas.style.cursor = 'copy'; }

  onPointerDown(p) {
    const d = this.app.view.clientToDoc(p.native.clientX, p.native.clientY);
    const hex = this.app.sampleColorAt(d);
    if (hex) this.app.colors.set(hex);
    this.app.restorePreviousTool();
    return true;
  }
}
