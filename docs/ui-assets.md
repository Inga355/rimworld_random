# Terminal artwork

The desktop layout follows the supplied terminal reference, with the DLC switch bank
mounted on the chassis outside a narrower green CRT. The lever is an accessible
submit button; its grip reuses the same artwork and moves on activation.

- `static/art/terminal.png`: generated background plate, 1672 x 941, about 2 MB.
- Tool: built-in Imagegen, editing the user-supplied reference.
- All dynamic text, switch states and parameter values are HTML, not baked into the image.
- `static/fonts/ShareTechMono-Regular.ttf`: Share Tech Mono, Google Fonts, SIL OFL.
- `static/icons/*.svg`: Lucide icons, ISC license. Both licenses are included locally.
- All assets are served locally and bundled by `RimWorldRandomizer.spec`.

The percentage coordinates and background crops in `static/terminal.css` match this
specific plate. Below 900px, the same switch and lever artwork is rearranged beneath
the screen. The parameter viewport remains fixed in size as DLC selections change.

## Browser verification

Run the Flask app on port 5059, then run `node tests/check_ui.cjs` with Playwright
available on the Node module path (or set `PLAYWRIGHT_MODULE_PATH` to its location).
The check uses installed Chrome by default; `UI_BROWSER_CHANNEL` and `UI_BASE_URL`
can override these defaults. Screenshots and the geometry report go to `output/ui/`.

## Final Imagegen prompt

```text
Use case: precise-object-edit
Asset type: production background plate for a working HTML interface, landscape 16:9.
Input image: edit target, the user's RimWorld terminal reference.
Keep extremely close to the reference's detailed battered spaceship console: exact overall front-facing composition, dark gunmetal, chipped paint, bolts, side vents, warning placards, deeply recessed CRT bezel and large RED horizontal mechanical pull lever beneath it. Preserve the illustrated industrial videogame/comic aesthetic, believable materials and clear texture.
Change the layout: narrow the CRT to occupy ONLY the left part of the upper console. CRT outer bezel approx x=14%-65%, y=6%-70%. Its glass interior approx x=17%-62%, y=12%-65%. The CRT is convex polished GREEN-tinted GLASS, dark green luminous phosphor, soft edge reflections and strong black curved perimeter, NOT scratched metal. The screen is COMPLETELY EMPTY, no text, no rows, no icons, no grid; leave its central glass dark and calm for HTML overlays.
On the RIGHT, OUTSIDE the CRT and separated by a wide, solid metal structural column, place FOUR individual physical DLC switch faceplates in a vertical bank approx x=68%-85%, y=23%-60%. These live on the outer metal chassis, never on the screen. Each faceplate is blank with a small unlit round indicator recess at left and a dark recessed EMPTY horizontal rectangular switch slot at right. Do NOT draw slider handles. Leave space above bank for a HTML heading. No DLC words or ON labels. The right bank is steel, not glass.
Keep the bottom center mechanism approx x=34%-65%, y=75%-96%: horizontal weathered red cylindrical pull lever, bearings on both sides, black mechanical recess, yellow hazard strips. A blank faded red label plate immediately ABOVE the lever for live HTML 'PULL TO RANDOMIZE' text. Keep lower left status panel and lower right green mini log display, but both BLANK and without indicator lights for HTML content. Side warning placards may retain their original fixed wording. All functional labels, title, parameters, numbers, and logs MUST be removed.
No new controls, no round push button, no extra screens. Even frontal view, no perspective skew, no room around terminal. Fill image edge to edge. Preserve the high detail and textured visual depth of original. No hands, people, watermark.
```
