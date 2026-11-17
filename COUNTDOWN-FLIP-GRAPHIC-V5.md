# Getoh Countdown Graphic Flip v5

## Scope
- Based on the existing Countdown v4 overlay.
- Replaces plain text flip digits with individual illustrated 3D flip tiles.
- Adds cream enamel-like tile faces, rounded edges, subtle shadows, a center hinge line, side hinge details, and small sakura/airplane accents around the day counter.
- Hours, minutes, and seconds use compact matching mini-tiles.
- Keeps the existing flight-time source, pause control, milestone logic, Pixel Journey scene, hotel pages, Firebase integration, and all other app behavior unchanged.
- No sound is added. `prefers-reduced-motion` disables flip animations when requested by the device.

## Files
- `index.html` — presentation/CSS only.
- `app.js` — digit rendering and per-digit flip animation.

## Installation
Back up the current `index.html` and `app.js`, then replace them with the two files in this overlay. Deploy the static site as usual. No Firebase rules, database values, or Functions need to change.

## Validation
- `node --check app.js`
- HTML parsed successfully; countdown and all three time units are present.
- ZIP integrity checked.
- Not yet tested on a physical device or deployed to production.
