/**
 * index.js — public API barrel for the Canvas Engine.
 * Import everything a module needs from one place:
 *
 *   import { CanvasEngine, SceneObject, ITool, GridPlugin } from '../engine/index.js';
 */

// Facade
export { default as CanvasEngine } from './CanvasEngine.js';

// Core
export { default as EngineEventBus } from './core/EngineEventBus.js';
export { default as Viewport } from './core/Viewport.js';
export { default as Camera } from './core/Camera.js';
export { default as CoordinateSystem } from './core/CoordinateSystem.js';
export { default as InputManager } from './core/InputManager.js';
export { default as RenderLoop } from './core/RenderLoop.js';

// Scene
export { default as SceneObject } from './scene/SceneObject.js';
export { default as Layer } from './scene/Layer.js';
export { default as LayerManager } from './scene/LayerManager.js';
export { default as ObjectManager } from './scene/ObjectManager.js';
export { default as Selection } from './scene/Selection.js';

// Systems
export { default as HistoryManager } from './systems/HistoryManager.js';
export { default as ToolManager } from './systems/ToolManager.js';
export { default as PluginManager } from './systems/PluginManager.js';
export { default as PerformanceManager } from './systems/PerformanceManager.js';

// IO
export { default as ExportManager } from './io/ExportManager.js';
export { default as ImportManager } from './io/ImportManager.js';

// Interfaces (extend these in modules)
export { default as ITool } from './interfaces/ITool.js';
export { default as IPlugin } from './interfaces/IPlugin.js';
export { default as ICommand } from './interfaces/ICommand.js';
export { default as IExporter } from './interfaces/IExporter.js';

// Example plugins
export { default as EmptyPlugin } from './plugins/EmptyPlugin.js';
export { default as GridPlugin } from './plugins/GridPlugin.js';
