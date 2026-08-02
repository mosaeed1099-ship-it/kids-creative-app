/**
 * backup.js — full CMS backup / restore (Phase 17A.1, C3).
 *
 * A backup is a single self-contained JSON: the whole store state PLUS every
 * IndexedDB asset (resolved to inline data), so it survives a cache-clear, moves
 * between browsers/devices, and can fully reconstruct the CMS. This is the safety
 * net the CMS previously lacked (localStorage-only, no export).
 */
import { assetStore, assetStoreReady } from '../io/assets.js';

export const BACKUP_KIND = 'kcs-cms-backup';
export const BACKUP_VERSION = 1;

/** Build a complete backup object (state + all binary assets). */
export async function exportBackup(store) {
  const assets = assetStoreReady() ? await assetStore().all() : [];
  return { kind: BACKUP_KIND, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), state: store.snapshot(), assets };
}

/**
 * Restore a backup: repopulate IndexedDB assets, then replace the store state.
 * Validates the envelope and surfaces a real error on persistence failure.
 * @returns {Promise<{items:number, assets:number}>}
 */
export async function importBackup(store, data) {
  if (!data || data.kind !== BACKUP_KIND || !data.state || typeof data.state !== 'object') throw new Error('bad-backup');
  if (assetStoreReady()) {
    const as = assetStore();
    await as.clear();
    for (const rec of (data.assets || [])) { const { ref, ...value } = rec; if (ref) await as.put(ref, value); } // eslint-disable-line no-await-in-loop
  }
  const ok = store.replace(data.state);
  if (!ok) throw new Error('persist-failed');
  return { items: (data.state.items || []).length, assets: (data.assets || []).length };
}
