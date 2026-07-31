/**
 * PluginManager — install/uninstall extensions that hook into the engine.
 *
 * A plugin implements IPlugin: { id, onInstall(engine), onUninstall(engine),
 * update(dt, engine), render(ctx, engine) }. Plugins can draw overlays (grid,
 * rulers, selection handles), add behaviour, or listen to engine events.
 * Emits 'plugin:change'.
 */
export default class PluginManager {
  constructor({ engine } = {}) {
    this.engine = engine;
    this.events = engine?.events;
    this._plugins = new Map();
  }

  install(plugin) {
    if (!plugin || !plugin.id) throw new Error('[PluginManager] plugin needs an id');
    if (this._plugins.has(plugin.id)) return this._plugins.get(plugin.id);
    this._plugins.set(plugin.id, plugin);
    plugin.engine = this.engine;
    plugin.onInstall?.(this.engine);
    this.events?.emit('plugin:change', { action: 'install', plugin });
    return plugin;
  }

  uninstall(id) {
    const plugin = this._plugins.get(id);
    if (!plugin) return false;
    plugin.onUninstall?.(this.engine);
    this._plugins.delete(id);
    this.events?.emit('plugin:change', { action: 'uninstall', plugin });
    return true;
  }

  get(id) { return this._plugins.get(id) || null; }
  list() { return [...this._plugins.values()]; }
  has(id) { return this._plugins.has(id); }

  update(dt) {
    for (const p of this._plugins.values()) {
      if (p.enabled !== false) p.update?.(dt, this.engine);
    }
  }

  render(ctx) {
    for (const p of this._plugins.values()) {
      if (p.enabled !== false) p.render?.(ctx, this.engine);
    }
  }
}
