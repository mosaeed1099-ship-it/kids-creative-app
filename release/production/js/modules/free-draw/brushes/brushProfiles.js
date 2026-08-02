/**
 * brushProfiles.js — parameter presets for every drawing tool. The stroke
 * renderer is generic; these presets are what make a "pencil" feel different
 * from an "airbrush". One profile per tool → the 7 tool files stay tiny and
 * share ONE renderer (no duplicated drawing logic).
 *
 * Fields
 *   composite    how the finished stroke is blended onto its layer
 *   minW / maxW  stamp radius as a fraction of (size/2), mapped by pressure
 *   flow         per-stamp alpha inside the stroke scratch (build-up feel)
 *   opacity      default whole-stroke opacity
 *   hardness     0 soft … 1 hard edge
 *   spacing      stamp spacing as a fraction of stamp diameter (smaller = smoother)
 *   pressureSize pressure changes radius
 *   pressureFlow pressure changes alpha
 *   grain        0..1 crayon-like texture (alpha + position jitter)
 *   spray        {density} airbrush scatter (0 = off)
 *   nib          {ratio, angle} calligraphy elliptical nib (null = round)
 */

export const PROFILES = {
  pencil: {
    id: 'pencil', label: 'قلم رصاص', emoji: '✏️',
    composite: 'source-over',
    minW: 0.55, maxW: 1.0, flow: 1, opacity: 1, hardness: 0.9, spacing: 0.12,
    pressureSize: true, pressureFlow: false, grain: 0.12, spray: null, nib: null,
  },
  brush: {
    id: 'brush', label: 'فرشاة', emoji: '🖌️',
    composite: 'source-over',
    minW: 0.25, maxW: 1.15, flow: 1, opacity: 1, hardness: 0.55, spacing: 0.08,
    pressureSize: true, pressureFlow: true, grain: 0, spray: null, nib: null,
  },
  marker: {
    id: 'marker', label: 'قلم تحديد', emoji: '🖊️',
    composite: 'multiply',
    minW: 0.95, maxW: 1.0, flow: 1, opacity: 0.72, hardness: 0.85, spacing: 0.06,
    pressureSize: false, pressureFlow: false, grain: 0, spray: null, nib: null,
  },
  crayon: {
    id: 'crayon', label: 'شمعي', emoji: '🖍️',
    composite: 'source-over',
    minW: 0.7, maxW: 1.0, flow: 0.85, opacity: 0.95, hardness: 0.4, spacing: 0.14,
    pressureSize: true, pressureFlow: true, grain: 0.6, spray: null, nib: null,
  },
  calligraphy: {
    id: 'calligraphy', label: 'خط عربي', emoji: '✒️',
    composite: 'source-over',
    minW: 0.9, maxW: 1.0, flow: 1, opacity: 1, hardness: 0.95, spacing: 0.05,
    pressureSize: true, pressureFlow: false, grain: 0, spray: null,
    nib: { ratio: 0.28, angle: -Math.PI / 4 },
  },
  airbrush: {
    id: 'airbrush', label: 'رذاذ', emoji: '💨',
    composite: 'source-over',
    minW: 1.0, maxW: 1.0, flow: 0.12, opacity: 1, hardness: 0.0, spacing: 0.25,
    pressureSize: false, pressureFlow: true, grain: 0, spray: { density: 14 }, nib: null,
  },
  eraser: {
    id: 'eraser', label: 'ممحاة', emoji: '🧽',
    composite: 'destination-out',
    minW: 0.6, maxW: 1.0, flow: 1, opacity: 1, hardness: 0.8, spacing: 0.08,
    pressureSize: true, pressureFlow: false, grain: 0, spray: null, nib: null,
  },
};

export const getProfile = (id) => PROFILES[id] || PROFILES.brush;

/** Ordered list of the seven drawing tools for the toolbar. */
export const BRUSH_ORDER = ['pencil', 'brush', 'marker', 'crayon', 'calligraphy', 'airbrush', 'eraser'];

export default PROFILES;
