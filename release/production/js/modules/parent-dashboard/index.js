/**
 * index.js — public barrel for the Parent Dashboard module.
 *
 *   import ParentDashboard, { ProfileManager, ActivityTracker } from '../modules/parent-dashboard/index.js';
 */
import ParentDashboard from './ParentDashboard.js';

export default ParentDashboard;
export { ParentDashboard };
export { default as ProfileManager } from './ProfileManager.js';
export { default as Profile } from './model/Profile.js';
export { default as ActivityTracker } from './ActivityTracker.js';
export { default as AchievementEngine } from './AchievementEngine.js';
export { default as StatsService } from './StatsService.js';
export { ACHIEVEMENTS } from './data/achievements.def.js';
export { Store } from './util.js';
