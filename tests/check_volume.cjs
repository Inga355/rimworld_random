const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');

(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    try {
        const page = await browser.newPage();
        await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.querySelector('#boot-silent')?.click()));
        await page.goto(process.env.UI_BASE_URL || 'http://127.0.0.1:5070');
        const volume = page.locator('#volume');
        await page.locator('.service-controls').waitFor({ state: 'visible' });
        assert.equal(await volume.inputValue(), '30');
        assert.equal(await page.locator('.volume-segments .is-lit').count(), 3);
        for (const width of [1366, 1024, 390, 320]) {
            await page.setViewportSize({ width, height: 768 });
            await volume.scrollIntoViewIfNeeded();
            const box = await volume.boundingBox();
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            assert.equal(await volume.inputValue(), '50');
            assert.equal(await page.locator('.volume-segments .is-lit').count(), 5);
            const fits = await page.locator('.status-panel').evaluate(panel => {
                const controls = panel.querySelector('.service-controls').getBoundingClientRect();
                const text = panel.querySelector('p:last-of-type').getBoundingClientRect();
                return text.bottom <= controls.top;
            });
            assert.ok(fits, `Status text overlaps controls at ${width}`);
        }
        await volume.press('Home');
        assert.equal(await volume.inputValue(), '0');
        assert.equal(await page.locator('.volume-segments .is-lit').count(), 0);
        await volume.press('End');
        assert.equal(await volume.inputValue(), '100');
        assert.equal(await page.locator('.volume-segments .is-lit').count(), 10);
        await page.reload();
        await page.locator('.service-controls').waitFor({ state: 'visible' });
        assert.equal(await volume.inputValue(), '100');
        console.log('PASS: segment clicks, keyboard endpoints, persistence, no status overlap at four sizes.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
