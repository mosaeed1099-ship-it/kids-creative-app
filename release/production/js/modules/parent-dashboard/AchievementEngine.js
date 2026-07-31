/**
 * AchievementEngine — reusable: evaluates achievement definitions against a
 * stats object. Pure (no storage); the tracker records unlocks. Any module can
 * reuse this with its own definitions.
 */
import ACHIEVEMENTS from './data/achievements.def.js';

export default class AchievementEngine {
  constructor(defs = ACHIEVEMENTS) { this.defs = defs; }

  /** @returns {Array<{def, unlocked:boolean, at:number|null}>} */
  evaluate(stats) {
    const unlockedMap = stats.achievements || {};
    return this.defs.map((def) => {
      const passes = !!def.test(stats);
      return { def, unlocked: passes || !!unlockedMap[def.id], at: unlockedMap[def.id] || null, justEligible: passes && !unlockedMap[def.id] };
    });
  }

  /** ids that currently pass but aren't recorded yet. */
  newlyUnlocked(stats) {
    return this.evaluate(stats).filter((r) => r.justEligible).map((r) => r.def.id);
  }

  progress(stats) {
    const list = this.evaluate(stats);
    const unlocked = list.filter((r) => r.unlocked).length;
    return { unlocked, total: list.length, percent: Math.round((unlocked / list.length) * 100) };
  }
}
