# Getoh Countdown Graphic Flip v6

## Scope
- Refines the v5 countdown for the 414 x 750 mobile viewport and desktop.
- Rebuilds each digit as a split-flap tile with separate upper/lower faces, a hinged animated flap, center seam, side hinge details, enamel-like surface, and soft depth shadows.
- Keeps day digits visually dominant; hours, minutes, and seconds are compact and aligned in one row.
- Tightens spacing around the milestone, countdown, controls, scene, and trip details so the fixed bottom navigation is less likely to cover content.
- Retains the existing flight-time source, pause control, milestone thresholds/messages, Pixel Journey scenes, hotel pages, Firebase integration, and other app behavior.
- No sound. Honors `prefers-reduced-motion`.

## Files
- `index.html` — countdown presentation and responsive CSS.
- `app.js` — split-flap digit rendering and animation.

## Installation
Back up the current `index.html` and `app.js`, then replace them with the files in this overlay. Deploy the static site as usual. No Firebase rules, database values, or Functions need to change.

## Validation
- `node --check app.js` passed.
- HTML parser passed.
- ZIP integrity checked.
- Not yet tested on a physical device or deployed to production.
