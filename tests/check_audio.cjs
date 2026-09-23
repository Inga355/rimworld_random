const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5070';
const output = path.join(__dirname, '..', 'output', 'ui');

(async () => {
    await fs.mkdir(output, { recursive: true });
    const browser = await chromium.launch({ headless: true, channel: process.env.UI_BROWSER_CHANNEL || 'chrome' });
    try {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.querySelector('#boot-silent')?.click()));
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => {
            window.audioContexts = [];
            window.toneEvents = [];
            const Original = window.AudioContext;
            window.AudioContext = class extends Original {
                constructor(...args) { super(...args); window.audioContexts.push(this); }
                createOscillator() {
                    const oscillator = super.createOscillator();
                    const start = oscillator.start.bind(oscillator);
                    let scheduledFrequency;
                    const setFrequency = oscillator.frequency.setValueAtTime.bind(oscillator.frequency);
                    oscillator.frequency.setValueAtTime = (value, when) => {
                        scheduledFrequency = value;
                        return setFrequency(value, when);
                    };
                    oscillator.start = when => {
                        window.toneEvents.push({ frequency: scheduledFrequency ?? oscillator.frequency.value, time: performance.now() });
                        start(when);
                    };
                    return oscillator;
                }
            };
        });
        await page.goto(baseURL);
        assert.equal(await page.evaluate(() => window.audioContexts.length), 0, 'Audio started without consent');
        await page.getByRole('checkbox', { name: 'Ambient sound', exact: true }).check();
        await page.waitForFunction(() => window.audioContexts[0]?.state === 'running' && !document.querySelector('#sound-toggle').disabled);
        await page.evaluate(() => { window.documentMarker = 'same-document'; });
        const seedBefore = await page.locator('.parameter').filter({ hasText: 'Seed' }).locator('dd').innerText();
        await page.getByRole('checkbox', { name: 'Biotech', exact: true }).check();
        await page.getByRole('button', { name: 'Pull to randomize', exact: true }).click();
        await page.waitForURL('**/?dlc=biotech');
        await page.waitForFunction(() => !document.querySelector('.lever').disabled);
        assert.equal(await page.evaluate(() => window.documentMarker), 'same-document');
        assert.equal(await page.evaluate(() => window.audioContexts.length), 1);
        assert.equal(await page.evaluate(() => window.audioContexts[0].state), 'running');
        assert.notEqual(await page.locator('.parameter').filter({ hasText: 'Seed' }).locator('dd').innerText(), seedBefore);

        const lastReadout = await page.locator('.readout-list').innerHTML();
        await page.route('**/?dlc=biotech', route => route.fulfill({ status: 503, body: 'Unavailable' }));
        await page.getByRole('button', { name: 'Pull to randomize', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('#route-status').textContent.includes('CONNECTION LOST'));
        assert.equal(await page.locator('.readout-list').innerHTML(), lastReadout, 'Failed request discarded the previous route');
        assert.equal(await page.locator('.lever').isEnabled(), true);
        assert.equal(await page.evaluate(() => window.audioContexts[0].state), 'running');
        await page.unroute('**/?dlc=biotech');
        await page.getByRole('button', { name: 'Pull to randomize', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('#route-status').textContent.includes('/ READY'));

        await page.getByRole('slider', { name: 'Volume', exact: true }).focus();
        await page.keyboard.press('Home');
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('rimworld-terminal-atmosphere')).volume), 0);
        await page.evaluate(() => {
            Object.defineProperty(document, 'hidden', { configurable: true, value: true });
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => window.audioContexts[0].state === 'suspended');
        await page.evaluate(() => {
            delete document.hidden;
            document.dispatchEvent(new Event('visibilitychange'));
        });
        await page.waitForFunction(() => window.audioContexts[0].state === 'running');

        await page.clock.install();
        await page.getByRole('checkbox', { name: 'Light and screen effects', exact: true }).uncheck();
        await page.getByRole('checkbox', { name: 'Light and screen effects', exact: true }).check();
        await page.evaluate(() => {
            window.visualEvents = [];
            new MutationObserver(records => {
                for (const { target } of records) {
                    if (target.classList.contains('light-flicker')) window.visualEvents.push({ kind: 'lamp', time: performance.now() });
                    if (target.classList.contains('screen-flicker')) window.visualEvents.push({ kind: 'crt', time: performance.now() });
                }
            }).observe(document.querySelector('.console'), { attributes: true, attributeFilter: ['class'], subtree: true });
        });
        await page.clock.fastForward(46000);
        const timing = await page.evaluate(() => ({ visual: window.visualEvents, tones: window.toneEvents }));
        await fs.writeFile(path.join(output, 'audio-timing.json'), JSON.stringify(timing, null, 2));
        for (const [kind, frequency] of [['lamp', 100], ['crt', 6400]]) {
            assert(timing.visual.some(event => event.kind === kind), `${kind} visual did not run`);
            assert(timing.tones.some(tone => Math.abs(tone.frequency - frequency) < 1
                && timing.visual.some(event => event.kind === kind && Math.abs(event.time - tone.time) < 50)), `${kind} audio is not synchronized`);
        }
        await page.getByRole('checkbox', { name: 'Light and screen effects', exact: true }).uncheck();
        assert.equal(await page.locator('.light-flicker, .screen-flicker').count(), 0);
        const stoppedAt = await page.evaluate(() => window.visualEvents.length);
        await page.clock.fastForward(60000);
        assert.equal(await page.evaluate(() => window.visualEvents.length), stoppedAt, 'Disabled flicker restarted');
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => document.querySelector('#effects-toggle').disabled);
        assert.equal(await page.locator('#effects-toggle').isDisabled(), true);
        await page.getByRole('checkbox', { name: 'Ambient sound', exact: true }).uncheck();
        await page.clock.fastForward(500);
        await page.waitForFunction(() => window.audioContexts[0].state === 'suspended');
        await page.reload();
        assert.equal(await page.locator('#volume').inputValue(), '0');
        assert.equal(await page.locator('#effects-toggle').isChecked(), false);
        assert.equal(await page.locator('#sound-toggle').isChecked(), false);
        assert.equal(await page.evaluate(() => window.audioContexts.length), 0);

        const preview = await page.evaluate(async () => {
            const { createSoundGraph } = await import('/static/terminal-audio.js');
            const sampleRate = 44100;
            const context = new OfflineAudioContext(1, sampleRate * 24, sampleRate);
            const graph = createSoundGraph(context);
            graph.master.gain.setValueAtTime(0, 0);
            graph.master.gain.linearRampToValueAtTime(0.3, 0.2);
            for (const [kind, at] of [['boot', 0], ['click', 3], ['hiss', 6], ['lamp', 10], ['crt', 15], ['lever', 20]]) graph.play(kind, at);
            graph.master.gain.setValueAtTime(0.3, 23);
            graph.master.gain.linearRampToValueAtTime(0, 24);
            const rendered = await context.startRendering();
            const samples = rendered.getChannelData(0);
            const buffer = new ArrayBuffer(44 + samples.length * 2);
            const view = new DataView(buffer);
            const text = (offset, value) => [...value].forEach((character, i) => view.setUint8(offset + i, character.charCodeAt(0)));
            text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
            view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true);
            view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, 'data'); view.setUint32(40, samples.length * 2, true);
            let peak = 0;
            let squared = 0;
            samples.forEach((sample, i) => {
                peak = Math.max(peak, Math.abs(sample));
                squared += sample * sample;
                view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true);
            });
            const bytes = new Uint8Array(buffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i += 32768) binary += String.fromCharCode(...bytes.subarray(i, i + 32768));
            return { wav: btoa(binary), peak, rms: Math.sqrt(squared / samples.length) };
        });
        assert(preview.peak > 0.01 && preview.peak < 0.9, 'Silent or clipped preview');
        assert(preview.rms > 0.001 && preview.rms < 0.1, 'Unexpected ambient level');
        await fs.writeFile(path.join(output, 'terminal-sound-preview.wav'), Buffer.from(preview.wav, 'base64'));
        assert.deepEqual(errors, []);
        console.log(JSON.stringify({ result: 'PASS', peak: preview.peak, rms: preview.rms, checks: 'Opt-in audio; seamless randomize; request recovery; volume persistence; hidden-tab pause; synchronized flicker; effects off; reduced motion; offline WAV preview' }));
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
