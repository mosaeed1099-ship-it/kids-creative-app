# Accessibility Report — v1.0.0

This release adds a **global, additive accessibility layer** (`css/a11y.css`)
that sits on top of the frozen module styles without changing any of them, plus
existing good practices already present in the modules.

## What the a11y layer provides

- **Visible keyboard focus.** A clear `:focus-visible` ring on all interactive
  elements (links, buttons, inputs, `[role="button"]`, `[tabindex]`), shown for
  keyboard users without adding a ring on mouse clicks.
- **Reduced motion.** `@media (prefers-reduced-motion: reduce)` collapses
  animations/transitions for users who request calmer motion (also a performance
  win). A host toggle `html[data-reduce-motion="1"]` is honored too.
- **Comfortable touch targets.** On touch devices (`pointer: coarse`) interactive
  controls get a minimum 44px height, meeting common tap-target guidance. The
  feature modules already use large 44–50px controls by design.
- **Screen-reader utilities.** A `.sr-only` helper for visually-hidden labels and
  a **skip link** (injected into hardened pages) to jump straight to `#app`.
- **High-contrast assist.** `@media (prefers-contrast: more)` thickens control
  borders.

Include order matters: `a11y.css` is added **last** so it layers cleanly. The
production build injects it into every page automatically.

## Already-present strengths

- **Semantic controls.** Interactive elements are real `<button>`/`<a>`/`<input>`
  elements, so they are keyboard-focusable and operable by default; the maze also
  supports arrow-key movement.
- **Large, friendly UI.** Kid-facing targets are big with generous spacing.
- **RTL & language.** Pages set `dir="rtl"` and `lang="ar"`; the error panels and
  skip link are localized.
- **Color + shape cues.** Correct/incorrect and completed states use more than
  color alone (checkmarks, stars, outlines, motion).
- **Meaningful titles.** Icon buttons in the activities carry `title` attributes;
  decorative emoji in the boot/error panels are marked `aria-hidden`.

## Recommended follow-ups (post-1.0, optional, non-blocking)

These would further improve screen-reader depth but are **not** required for the
release and would touch module internals (out of scope for RC1):

- Add `aria-label`s to purely-emoji icon buttons that lack a text label.
- Add `aria-live="polite"` regions to announce stars/score changes.
- Provide text alternatives for emoji-only content in activities.

## Standards touchpoints

The layer targets common WCAG 2.1 AA concerns: focus visibility (2.4.7),
target size (2.5.5/2.5.8), motion preferences (2.3.3), and bypass blocks (2.4.1
via the skip link). Full formal conformance testing is recommended per
deployment context.
