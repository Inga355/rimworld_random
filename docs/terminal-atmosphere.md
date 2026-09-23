# Terminal atmosphere

All sounds are original procedural synthesis in `static/terminal-audio.js` using
the browser's Web Audio API. No downloaded recordings, external services, or new
runtime dependencies are needed. These source files use the project's license.

- Ambient: 50 Hz transformer hum with quiet harmonics, slow load variation and air noise.
  A separate 0.8 gain trims this background by 20% without changing effect levels.
- Mechanics: filtered-noise clicks, valve hiss, and a heavier lever mechanism.
- Lamps: short ballast buzz and starter crackle synchronized with a light dip.
- CRT: quiet static, a brief descending whine and a screen tracking disturbance.
- Mechanical events recur after 5-13 seconds, lamp events after 7-16 seconds,
  and screen events after 22-45 seconds. These are randomized intervals.

Audio always starts off and requires the sound switch. The volume defaults to 30%.
Volume and the effects preference are stored locally when browser storage is available.
The effects switch controls both visual faults and their paired sounds; mechanical
sounds and hum remain available independently. Reduced motion disables visual faults.
Hidden tabs pause audio and timers without accumulating missed events.

The existing GET form still works without JavaScript. With JavaScript it requests a
JSON response containing the server-rendered parameter rows. Only the readout changes,
so the sound continues and the terminal retains its position. A failed request retains
the previous route, reports the failure and enables the lever for another attempt.

## Verification and listening preview

Run the local Flask server and `node tests/check_audio.cjs` with Playwright installed.
`PLAYWRIGHT_MODULE_PATH`, `UI_BASE_URL` (default `http://127.0.0.1:5070`), and
`UI_BROWSER_CHANNEL` can override the test environment. This check covers activation,
continuous audio across rerolls, request recovery, volume persistence, tab visibility,
audio/visual timing, reduced motion and disabling effects.

It also renders the actual sound graph using OfflineAudioContext, checks its levels,
and saves `output/ui/terminal-sound-preview.wav`. The 24-second preview contains the
hum throughout, then click (3s), hiss (6s), lamp (10s), CRT (15s), and lever (20s).
The preview is not a runtime asset; the app synthesizes the sounds live.
# Power-up sequence

The startup dialog appears on every page load and leaves the existing main CRT
illuminated, without its own background or frame. A 92% black overlay with a
screen-shaped opening dims only the cockpit, then fades out over 2.4 seconds. Reduced-motion
preferences disable this visual transition. Audio remains opt-in.
Volume and effects preferences persist; the startup choice no longer skips the
dialog on subsequent visits. Each power-up click unlocks browser audio again.

The original procedural `boot` effect combines relay contacts, rising transformer
tones, filtered air noise and two quiet ready tones over 2.37 seconds. It follows
the master volume and uses the existing effect cleanup on mute/tab suspension.
The startup master fade uses a 0.60-second time constant; the normal mix is unchanged.

Sound research: "Power up sine wave.wav" by vjoe1985 is listed as CC0 at
https://beta.freesound.org/people/vjoe1985/sounds/467723/ (checked 2026-09-23).
Its download requires login. It was not downloaded or used; the implemented
sequence is synthesized locally and contains no third-party samples.
