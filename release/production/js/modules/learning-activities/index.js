/**
 * index.js — public barrel for the Kids Learning Activities module (Phase 11).
 *   import LearningActivities from '../modules/learning-activities/index.js';
 */
import LearningActivities from './LearningActivities.js';

export default LearningActivities;
export { LearningActivities };
export { default as ActivityRegistry, TYPE_META } from './ActivityRegistry.js';
export { default as ActivityHost } from './ActivityHost.js';
export { default as ProgressTracker } from './ProgressTracker.js';
export { default as Rewards } from './Rewards.js';
export { default as Library } from './ui/Library.js';
