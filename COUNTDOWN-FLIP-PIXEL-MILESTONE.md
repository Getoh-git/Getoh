# Getoh Countdown v4 — Flip + Pixel + Milestones

## Included files
- `index.html` — flip-clock markup and responsive styling for milestone badge.
- `app.js` — countdown digit updates with flip animation and milestone messaging.

## Behavior
- Days, hours, minutes, and seconds retain the existing flight-based countdown target.
- Changed digits animate with a short 3D flip; unchanged digits do not animate.
- Milestone messages change at 30 days, 7 days, 1 day, and departure day.
- Existing pixel couple scene and walking sprite animation are retained.
- No sound or audio assets are added.
- `prefers-reduced-motion: reduce` disables the new flip and milestone motion.
- Existing hotel decision support, Firebase paths, hotel data, navigation, and other pages are preserved from the previous overlay stack.

## Installation
This is an overlay package. Back up the current `index.html` and `app.js`, then copy the two files under `Getoh-main/` over the corresponding files in the existing project. Do not replace the whole project with this ZIP.

## Validation
JavaScript syntax (`node --check app.js`) and HTML parser checks passed. No production Firebase deployment or physical-device/browser interaction test was performed.
