/**
 * EmptyPlugin — a no-op template. Copy this to start a real plugin.
 * Demonstrates every hook without doing anything.
 */
import IPlugin from '../interfaces/IPlugin.js';

export default class EmptyPlugin extends IPlugin {
  constructor() {
    super('empty');
  }

  onInstall(/* engine */) { /* set up resources / listeners here */ }
  onUninstall(/* engine */) { /* tear down here */ }
  update(/* dt, engine */) { /* per-frame logic here */ }
  render(/* ctx, engine */) { /* draw overlays here (world space) */ }
}
