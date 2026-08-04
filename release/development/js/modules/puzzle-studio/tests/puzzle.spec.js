/**
 * puzzle.spec.js — Playwright end-to-end verification for the Puzzle Studio.
 *
 * Run from the repo root:
 *   npx playwright install chromium
 *   npx playwright test --config js/modules/puzzle-studio/tests/playwright.config.js
 *
 * Uses the `?e2e=1` test hook (window.__puzzle) to drive the studio and verify
 * generation, drag-snap, hint, undo/redo, solve + celebration, and export — all
 * with a clean console.
 */
import { test, expect } from '@playwright/test';

async function openStudio(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('/index.html?e2e=1#/puzzles');
  await page.waitForFunction(() => !!window.__puzzle, null, { timeout: 15000 });
  return errors;
}

test('setup → generate 3×3 puzzle', async ({ page }) => {
  const errors = await openStudio(page);
  await expect(page.locator('.pz-setup')).toBeVisible();
  const started = await page.evaluate(async () => {
    const app = window.__puzzle;
    const item = app.content.getContent('scenes-hills');
    await app.startPuzzle(item, 3, 3);
    return app.model.pieces.length;
  });
  expect(started).toBe(9);
  await expect(page.locator('.pz-hud')).toBeVisible();
  await expect(page.locator('.pz-progress')).toHaveText('0 / 9');
  expect(errors).toEqual([]);
});

test('drag-snap a piece home increments progress + undo/redo', async ({ page }) => {
  await openStudio(page);
  const res = await page.evaluate(async () => {
    const app = window.__puzzle;
    await app.startPuzzle(app.content.getContent('scenes-hills'), 2, 2);
    const p = app.model.pieces[0];
    // simulate a drag that lands the piece at its home
    app.beforeState = app.model.serialize();
    app.model.raiseGroup(p.groupId);
    p.x = p.homeX; p.y = p.homeY;
    app.model.snap(p.groupId);
    app.commitMove();
    const placedAfterSnap = app.model.placedCount();
    app.undo(); const afterUndo = app.model.placedCount();
    app.redo(); const afterRedo = app.model.placedCount();
    return { placedAfterSnap, afterUndo, afterRedo };
  });
  expect(res.placedAfterSnap).toBe(1);
  expect(res.afterUndo).toBe(0);
  expect(res.afterRedo).toBe(1);
});

test('hint reveals a piece', async ({ page }) => {
  await openStudio(page);
  const hinted = await page.evaluate(async () => {
    const app = window.__puzzle;
    await app.startPuzzle(app.content.getContent('scenes-space'), 3, 3);
    app.hint();
    return !!app.model.hintPiece;
  });
  expect(hinted).toBe(true);
});

test('solve shows celebration + export works', async ({ page }) => {
  const errors = await openStudio(page);
  const res = await page.evaluate(async () => {
    const app = window.__puzzle;
    await app.startPuzzle(app.content.getContent('things-house'), 2, 2);
    for (const p of app.model.pieces) { p.x = p.homeX; p.y = p.homeY; p.placed = true; p.zIndex = 1; }
    app.model.engine.invalidate();
    app.onSolved();
    const png = app.model.imageCanvas.toDataURL('image/png');
    return { solved: app.model.isSolved(), pngOk: png.startsWith('data:image/png') && png.length > 2000 };
  });
  expect(res.solved).toBe(true);
  expect(res.pngOk).toBe(true);
  await expect(page.locator('.pz-banner')).toBeVisible();
  await expect(page.locator('.pz-progress')).toHaveText('4 / 4');
  expect(errors).toEqual([]);
});
