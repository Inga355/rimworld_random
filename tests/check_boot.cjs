const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
(async () => {
    const browser = await chromium.launch({ headless: true, channel: 'chrome' });
    try {
        const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
        await page.goto('http://127.0.0.1:5070');
        await page.locator('.boot-dialog[open]').waitFor();
        assert.equal(await page.evaluate(() => getComputedStyle(document.body, '::before').opacity), '0.92');
        await page.screenshot({ path: 'output/ui/boot-desktop.png' });
        await page.locator('#boot-start').click();
        await page.waitForFunction(() => !document.querySelector('#sound-toggle').disabled);
        assert.equal(await page.locator('#sound-toggle').isChecked(), true);
        assert.equal(await page.locator('.boot-dialog').isVisible(), false);
        assert.equal(await page.evaluate(() => getComputedStyle(document.body, '::before').transitionDuration), '2.4s');
        await page.reload();
        await page.locator('.boot-dialog[open]').waitFor();
        assert.equal(await page.locator('#sound-toggle').isChecked(), false);
        await page.locator('#boot-silent').click();
        await page.locator('#volume').fill('45');
        await page.setViewportSize({ width: 320, height: 720 });
        await page.reload();
        await page.locator('.boot-dialog[open]').waitFor();
        assert.equal(await page.locator('#volume').inputValue(), '45');
        await page.screenshot({ path: 'output/ui/boot-mobile.png' });
        await page.locator('#boot-silent').click();
        await page.reload();
        await page.locator('.service-controls').waitFor();
        assert.equal(await page.locator('.boot-dialog').isVisible(), true);
        assert.equal(await page.locator('#sound-toggle').isChecked(), false);
        console.log('PASS: startup on every load, audio opt-in, saved volume, silent choice, desktop/mobile.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
