/**
 * theme.config.js — data-driven theme tokens.
 * ThemeManager reads these and applies them as CSS custom properties on
 * <html>, so themes are defined in one place and can be extended freely
 * (add a "highContrast" or seasonal theme without touching CSS).
 *
 * Token names intentionally mirror the CSS variables used in app.css.
 */
export const THEMES = {
  light: {
    '--c-bg': '#f6f4ff',
    '--c-surface': '#ffffff',
    '--c-surface-2': '#f2f4ff',
    '--c-text': '#2b2b3a',
    '--c-muted': '#8a8aa3',
    '--c-border': '#e6e6ef',
    '--c-primary': '#5b6bff',
    '--c-primary-ink': '#ffffff',
    '--c-accent': '#ff6b9d',
    '--c-accent-2': '#ffcf6b',
    '--c-success': '#57c98a',
    '--c-danger': '#ff5a5a',
    '--c-shadow': 'rgba(91,107,255,.14)',
  },
  dark: {
    '--c-bg': '#161726',
    '--c-surface': '#20223a',
    '--c-surface-2': '#282a48',
    '--c-text': '#f2f3ff',
    '--c-muted': '#a6a8c8',
    '--c-border': '#33355a',
    '--c-primary': '#8b97ff',
    '--c-primary-ink': '#161726',
    '--c-accent': '#ff8fbb',
    '--c-accent-2': '#ffd782',
    '--c-success': '#6bd79b',
    '--c-danger': '#ff7a7a',
    '--c-shadow': 'rgba(0,0,0,.45)',
  },
};

export const DEFAULT_THEME = 'light';
export default THEMES;
