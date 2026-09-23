# Status screen asset and controls

Generated with the built-in Imagegen tool, editing `static/art/terminal.png`.
Final asset: `static/art/terminal-v2.png`. The original remains available.

Prompt:

> Use case: precise-object-edit. Edit target: attached spaceship console background asset. Change ONLY the small blank metal panel at bottom LEFT of the red lever into a blank old green CRT glass screen matching the existing small CRT at bottom RIGHT. Replace interior approximately x250..460,y746..886 in the 1672x941 reference: subtly curved dark green glass, fine horizontal scanlines, faint green phosphor and edge reflections. Preserve its existing surrounding metal bezel and screws. Keep the entire composition, canvas aspect ratio, main screen, all four DLC socket and switch positions, lever, scratches, warning signs and every other object unchanged. No new text, icons, controls, labels or symbols on the screen; HTML will overlay these. Return the full console background, not a crop.

The status screen contains sound/effects toggles and ten volume segments.
A native accessible range input supports keyboard control; pointer clicks and
dragging map the strip to 0-100%. Filled segments track the saved volume.
Default volume (30%) and the audio mix remain unchanged.

Optional browser regression test: `node tests/check_volume.cjs`, using the same
`PLAYWRIGHT_MODULE_PATH` and `UI_BASE_URL` environment variables as the UI tests.
