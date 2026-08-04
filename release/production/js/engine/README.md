# Canvas Engine

A **reusable, framework-free 2D graphics engine** for the browser. It is fully
standalone — it imports nothing from the app (`js/core`, `js/ui`) — so every
future module (Coloring, Drawing, Trace, Funny Animals, …) plugs into the *same*
engine instead of reinventing canvas plumbing.

```
CanvasEngine ─┬─▶ Coloring Module
              ├─▶ Drawing Module
              ├─▶ Trace Module
              └─▶ Funny Animals Module
```

> Phase 3 scope: the **engine only**. No coloring, drawing, tracing, stickers or
> game logic. Tools and History ship as empty systems (mechanism, not content).

## Quick start

```js
import { CanvasEngine, SceneObject, GridPlugin } from '../engine/index.js';

const engine = new CanvasEngine('#stage', { background: '#fff' }).mount();
engine.plugins.install(new GridPlugin());

class Star extends SceneObject {
  constructor(p){ super({ type:'star', width:100, height:100, ...p }); }
  draw(ctx){ ctx.fillStyle = '#ff6b9d'; ctx.fillRect(0, 0, this.width, this.height); }
}
engine.objects.add(new Star({ x: 0, y: 0 }));
```

Drag to pan, wheel/pinch to zoom — built in. See `../../examples/engine-basic.html`
and `../../examples/engine-plugins.html` for runnable demos.

## The engine object

| Member        | Type                | Purpose |
|---------------|---------------------|---------|
| `viewport`    | Viewport            | canvas + High-DPI + responsive resize |
| `camera`      | Camera              | pan / zoom / reset, home view |
| `coords`      | CoordinateSystem    | client ↔ screen ↔ world conversions |
| `input`       | InputManager        | unified mouse/touch/pen + gestures |
| `loop`        | RenderLoop          | requestAnimationFrame driver |
| `layers`      | LayerManager        | ordered drawing layers |
| `objects`     | ObjectManager       | add/remove/query scene objects |
| `selection`   | Selection           | selection state + hit testing |
| `history`     | HistoryManager      | undo/redo (Command pattern) — *empty* |
| `tools`       | ToolManager         | interaction tools — *empty* |
| `plugins`     | PluginManager       | installable extensions/overlays |
| `perf`        | PerformanceManager  | fps / frame timing / counts |
| `exporter`    | ExportManager       | PNG/JPEG/Blob + scene JSON |
| `importer`    | ImportManager       | images + scene JSON |
| `events`      | EngineEventBus      | engine-scoped pub/sub |

### Options

```js
new CanvasEngine(container, {
  background: null,      // CSS color or null (transparent)
  cameraControls: true,  // built-in pan/zoom gestures
  autoStart: true,       // start render loop on mount()
  onDemand: false,       // only redraw after invalidate()
  maxDPR: 3,             // High-DPI cap
});
```

### Lifecycle

```js
engine.mount();      // create canvas, wire input, start loop
engine.start();      // start the render loop
engine.stop();       // stop the loop
engine.invalidate(); // request a redraw (on-demand mode)
engine.resetView();  // camera back to home
engine.fit(rect);    // center+zoom to a world rectangle
engine.destroy();    // full teardown
```

## Coordinate spaces

- **client** — raw `event.clientX/Y`.
- **screen** — CSS pixels inside the canvas (origin: canvas top-left).
- **world** — logical scene units after camera pan/zoom.

```js
engine.coords.clientToWorld(e.clientX, e.clientY); // → {x, y}
engine.coords.worldToScreen(wx, wy);               // → {x, y}
```

Every input event payload already includes both `screen` and `world` points.

## Extending the engine (interfaces)

Modules extend four base classes — the engine ships the contracts, not the
implementations:

### Tool — `ITool`

```js
import { ITool } from '../engine/index.js';
class BrushTool extends ITool {
  constructor(){ super('brush'); }
  onPointerDown(p, engine){ /* start stroke */ return true; } // true = consume
  onPointerMove(p, engine){ /* extend stroke */ return true; }
  onPointerUp(p, engine){ /* commit + engine.history.push(cmd) */ return true; }
}
engine.tools.register(new BrushTool());
engine.tools.activate('brush');
```

### Object — `SceneObject`

Override `draw(ctx)` (local space). Optionally `hitTest`, `getBounds`, `toJSON`.

### Plugin — `IPlugin`

```js
import { IPlugin } from '../engine/index.js';
class RulerPlugin extends IPlugin {
  constructor(){ super('ruler'); }
  render(ctx, engine){ /* draw overlay in world space */ }
}
engine.plugins.install(new RulerPlugin());
```

### Command — `ICommand` (history)

```js
import { ICommand } from '../engine/index.js';
class Paint extends ICommand {
  constructor(layer, stroke){ super('Paint'); this.layer = layer; this.stroke = stroke; }
  execute(){ this.layer.add(this.stroke); }
  undo(){ this.layer.remove(this.stroke); }
}
engine.history.push(new Paint(layer, stroke));  // executes + records
engine.history.undo(); engine.history.redo();
```

## Export / Import

```js
// PNG of the whole canvas
engine.exporter.download(engine.exporter.toDataURL({ background:'#fff' }), 'art.png');

// PNG of a world region at 2× (camera-independent)
const url = engine.exporter.toDataURL({ region:{x:0,y:0,w:800,h:600}, scale:2 });

// Save / load the scene
const json = engine.exporter.toJSON();
engine.importer.fromJSON(json, (data) => Factory.create(data)); // module supplies the factory

// Load an image
const img = await engine.importer.image(fileOrUrl);
```

## Events

```js
engine.events.on('frame',        ({dt}) => {});
engine.events.on('camera:change',(cam)  => {});
engine.events.on('pointerdown',  (p)    => p.world /* {x,y} */);
engine.events.on('selection:change', (items) => {});
engine.events.on('history:change',   (h) => h.canUndo);
```

## Files

```
engine/
  CanvasEngine.js          facade (wires everything)
  index.js                 public barrel exports
  core/                    EngineEventBus, Viewport, Camera, CoordinateSystem,
                           InputManager, RenderLoop
  scene/                   SceneObject, Layer, LayerManager, ObjectManager, Selection
  systems/                 HistoryManager, ToolManager, PluginManager, PerformanceManager
  io/                      ExportManager, ImportManager
  interfaces/              ITool, IPlugin, ICommand, IExporter
  plugins/                 EmptyPlugin (template), GridPlugin (example overlay)
```

## Design principles

- **Standalone.** No app imports; drop the `engine/` folder into any project.
- **Generic.** The engine never assumes what an object/tool/plugin *does*.
- **Additive.** Modules extend via interfaces; they never edit the engine.
- **Static-friendly.** Native ES modules, no build step, no dependencies.
