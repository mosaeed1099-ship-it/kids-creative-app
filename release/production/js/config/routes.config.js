/**
 * routes.config.js — STATIC routes handled by Pages (not feature modules).
 * Feature routes (coloring/draw/trace) come from the features registry and
 * are merged by App, so adding a feature never means editing this file.
 */
export const STATIC_ROUTES = [
  { path: '/', pageId: 'dashboard' },
  { path: '/dashboard', pageId: 'dashboard' },
  { path: '/settings', pageId: 'settings' },
];

/** Route used when nothing matches. */
export const NOT_FOUND_PAGE = 'notFound';

export default STATIC_ROUTES;
