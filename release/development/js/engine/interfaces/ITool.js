/**
 * ITool — the contract every interaction tool follows.
 * Extend this base class in a module (e.g. BrushTool, FillTool, SelectTool).
 * Input handlers return `true` to CONSUME the event (skips camera gestures).
 *
 * The engine ships NO concrete tools — this is the interface only.
 */
export default class ITool {
  /** @param {string} id - unique tool id */
  constructor(id) {
    this.id = id;
    this.engine = null; // set by ToolManager.register
  }

  /* lifecycle */
  onActivate(/* engine */) {}
  onDeactivate(/* engine */) {}

  /* input — return true to consume */
  onPointerDown(/* input, engine */) { return false; }
  onPointerMove(/* input, engine */) { return false; }
  onPointerUp(/* input, engine */) { return false; }
  onWheel(/* input, engine */) { return false; }

  /* per-frame (optional) */
  update(/* dt, engine */) {}
  render(/* ctx, engine */) {}
}
