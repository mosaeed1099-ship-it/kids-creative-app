/**
 * index.js — public barrel for the Creative Studio module.
 *   import CreativeStudio from '../modules/creative-studio/index.js';
 */
import CreativeStudio from './CreativeStudio.js';

export default CreativeStudio;
export { CreativeStudio };
export { default as CharacterScene } from './scene/CharacterScene.js';
export { default as CharacterLoader } from './CharacterLoader.js';
export { default as MovableObject } from './scene/MovableObject.js';
export { default as SelectTool } from './tools/SelectTool.js';
