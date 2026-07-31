/**
 * IPlugin — the contract for engine extensions (overlays, behaviours, tools
 * bundles). Extend this base class. Set `enabled = false` to keep an installed
 * plugin dormant. The engine ships only EMPTY example plugins.
 */
export default class IPlugin {
  /** @param {string} id - unique plugin id */
  constructor(id) {
    this.id = id;
    this.enabled = true;
    this.engine = null; // set by PluginManager.install
  }

  onInstall(/* engine */) {}
  onUninstall(/* engine */) {}

  /** Called every frame before render if enabled. */
  update(/* dt, engine */) {}

  /** Called every frame after layers render (draw overlays here). ctx is in world space. */
  render(/* ctx, engine */) {}
}
