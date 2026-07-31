/**
 * ToolManager — registry + dispatcher for interaction tools (brush, select,
 * fill, move, …). "Empty" by design: no concrete tools ship with the engine.
 *
 * A tool implements the ITool contract. The InputManager forwards pointer/wheel
 * events to `current` and treats a truthy return as "consumed" (so the camera
 * gesture is skipped). Tools may also implement update(dt)/render(ctx).
 * Emits 'tool:change'.
 */
export default class ToolManager {
  constructor({ engine } = {}) {
    this.engine = engine;
    this.events = engine?.events;
    this._tools = new Map();
    this.current = null;
  }

  register(tool) {
    if (!tool || !tool.id) throw new Error('[ToolManager] tool needs an id');
    this._tools.set(tool.id, tool);
    tool.engine = this.engine;
    return tool;
  }

  unregister(id) {
    if (this.current?.id === id) this.deactivate();
    this._tools.delete(id);
  }

  get(id) { return this._tools.get(id) || null; }
  list() { return [...this._tools.values()]; }

  activate(id) {
    const tool = this._tools.get(id);
    if (!tool || tool === this.current) return this.current;
    this.deactivate();
    this.current = tool;
    tool.onActivate?.(this.engine);
    this.events?.emit('tool:change', tool);
    return tool;
  }

  deactivate() {
    if (this.current) {
      this.current.onDeactivate?.(this.engine);
      this.current = null;
      this.events?.emit('tool:change', null);
    }
  }

  update(dt) { this.current?.update?.(dt, this.engine); }
  render(ctx) { this.current?.render?.(ctx, this.engine); }
}
