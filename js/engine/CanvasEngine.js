/**
 * CanvasEngine — the public facade that wires every subsystem together and
 * exposes ONE clean object for modules to build on.
 *
 * It is fully standalone: it imports nothing from the app (js/core, js/ui).
 * A feature module receives an engine instance and plugs in tools, objects,
 * plugins, commands — without touching the engine internals.
 *
 *   const engine = new CanvasEngine('#stage', { background:'#fff' });
 *   engine.mount();
 *   engine.plugins.install(new GridPlugin());
 *   engine.objects.add(new MyObject({...}));
 *   engine.tools.register(new MyBrushTool()); engine.tools.activate('brush');
 *
 * Public members:
 *   viewport, camera, coords, input, loop            (core)
 *   layers, objects, selection                        (scene)
 *   history, tools, plugins, perf                     (systems)
 *   exporter, importer, events                        (io + bus)
 */
import EngineEventBus from './core/EngineEventBus.js';
import Viewport from './core/Viewport.js';
import Camera from './core/Camera.js';
import CoordinateSystem from './core/CoordinateSystem.js';
import InputManager from './core/InputManager.js';
import RenderLoop from './core/RenderLoop.js';

import LayerManager from './scene/LayerManager.js';
import ObjectManager from './scene/ObjectManager.js';
import Selection from './scene/Selection.js';

import HistoryManager from './systems/HistoryManager.js';
import ToolManager from './systems/ToolManager.js';
import PluginManager from './systems/PluginManager.js';
import PerformanceManager from './systems/PerformanceManager.js';

import ExportManager from './io/ExportManager.js';
import ImportManager from './io/ImportManager.js';

const DEFAULTS = {
  background: null,       // CSS color or null (transparent)
  cameraControls: true,   // built-in pan/zoom gestures
  autoStart: true,        // start the render loop on mount
  onDemand: false,        // only redraw when invalidate() is called
  maxDPR: 3,              // High-DPI cap
};

export default class CanvasEngine {
  /**
   * @param {HTMLElement|string} container - element or selector to fill
   * @param {object} [options]
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    if (!this.container) throw new Error('CanvasEngine: container not found');
    this.options = { ...DEFAULTS, ...options };

    // --- bus + core ---
    this.events = new EngineEventBus();
    this.viewport = new Viewport({
      container: this.container,
      background: this.options.background,
      maxDPR: this.options.maxDPR,
    });
    this.camera = new Camera({ events: this.events });
    this.coords = new CoordinateSystem({ viewport: this.viewport, camera: this.camera });

    // --- scene ---
    this.layers = new LayerManager({ events: this.events });
    this.objects = new ObjectManager({ layers: this.layers, events: this.events });
    this.selection = new Selection({ objects: this.objects, events: this.events });

    // --- systems ---
    this.history = new HistoryManager({ events: this.events });
    this.tools = new ToolManager({ engine: this });
    this.plugins = new PluginManager({ engine: this });
    this.perf = new PerformanceManager({ engine: this });

    // --- io ---
    this.exporter = new ExportManager({ engine: this });
    this.importer = new ImportManager({ engine: this });

    // --- loop / input (created on mount) ---
    this.input = null;
    this.loop = new RenderLoop((dt, now) => this.tick(dt, now), { onDemand: this.options.onDemand });
    this._mounted = false;
  }

  /** Create the canvas, wire input, and (optionally) start rendering. */
  mount() {
    if (this._mounted) return this;
    this.viewport.mount();
    this.viewport.onResize = (w, h, dpr) => { this.events.emit('resize', { w, h, dpr }); this.invalidate(); };
    this.input = new InputManager({ engine: this });
    this._mounted = true;
    this.events.emit('ready', this);
    if (this.options.autoStart) this.start();
    return this;
  }

  start() { this.loop.start(); return this; }
  stop() { this.loop.stop(); return this; }
  invalidate() { this.loop.invalidate(); }

  /** One frame: measure → update → render. */
  tick(dt, now) {
    this.perf.begin();
    this.update(dt);
    this.render();
    this.perf.end();
    this.events.emit('frame', { dt, now });
  }

  update(dt) {
    this.tools.update(dt);
    this.plugins.update(dt);
  }

  render() {
    const { ctx } = this.viewport;
    this.viewport.clear();
    this.coords.applyTo(ctx);       // context is now in WORLD space
    this.layers.render(ctx, this);  // scene
    this.plugins.render(ctx);       // overlays (grid, handles…)
    this.tools.render(ctx);         // active tool preview
  }

  /** Reset camera pan/zoom to the home view. */
  resetView() { this.camera.reset(); this.invalidate(); return this; }

  /** Fit/center the camera on a world rectangle. */
  fit(rect, padding = 40) {
    const zx = (this.viewport.width - padding * 2) / rect.w;
    const zy = (this.viewport.height - padding * 2) / rect.h;
    this.camera.setZoom(Math.min(zx, zy));
    this.camera.centerOn(rect.x + rect.w / 2, rect.y + rect.h / 2);
    this.invalidate();
    return this;
  }

  destroy() {
    this.stop();
    this.input?.destroy();
    this.viewport.destroy();
    this.events.clear();
    this._mounted = false;
  }
}
