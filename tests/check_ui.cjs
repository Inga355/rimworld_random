// Optional browser verification: set PLAYWRIGHT_MODULE_PATH if Playwright is not on NODE_PATH.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:5059';
const output = path.join(__dirname, '..', 'output', 'ui');
const allDLC = '?dlc=royalty&dlc=ideology&dlc=biotech&dlc=anomaly';
const viewports = [
    [1920, 940], [1440, 900], [1366, 768], [1280, 650],
    [1024, 768], [768, 1024], [390, 844], [320, 720],
];

async function checkGeometry(page, desktop) {
    const result = await page.evaluate(() => {
        const rect = selector => {
            const { x, y, width, height, right, bottom } = document.querySelector(selector).getBoundingClientRect();
            return { x, y, width, height, right, bottom };
        };
        const readout = document.querySelector('.readout');
        return {
            console: rect('.console'), screen: rect('.screen'), modules: rect('.dlc-panel'), lever: rect('.lever'),
            pageWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, viewportHeight: innerHeight,
            scrollable: readout.scrollHeight > readout.clientHeight,
            fontLoaded: document.fonts.check('18px "Share Tech Mono"'),
        };
    });
    assert(result.fontLoaded, 'Local terminal font did not load');
    assert(result.pageWidth <= result.viewportWidth, 'Horizontal page overflow');
    assert(result.scrollable, 'All DLC parameters should scroll within the screen');
    if (desktop) {
        assert(result.console.bottom <= result.viewportHeight + 1, 'Terminal exceeds viewport height');
        assert(result.modules.x > result.screen.right, 'DLC hardware overlaps the CRT');
    } else {
        assert(result.modules.y > result.screen.bottom, 'Mobile DLC hardware overlaps the CRT');
    }
    assert(result.lever.y > result.screen.bottom, 'Lever overlaps CRT');
    return result;
}

(async () => {
    await fs.mkdir(output, { recursive: true });
    const browser = await chromium.launch({ headless: true, channel: process.env.UI_BROWSER_CHANNEL || 'chrome', ignoreDefaultArgs: ['--hide-scrollbars'] });
    const errors = [];
    try {
        const page = await browser.newPage();
        await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.querySelector('#boot-silent')?.click()));
        page.on('pageerror', error => errors.push(error.message));
        page.on('response', response => {
            if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
        });
        const report = [];
        for (const [width, height] of viewports) {
            await page.setViewportSize({ width, height });
            await page.goto(baseURL + '/' + allDLC);
            await page.evaluate(() => document.fonts.ready);
            const geometry = await checkGeometry(page, width > 900);
            await page.screenshot({ path: path.join(output, `terminal-${width}x${height}.png`), fullPage: true });
            const before = await page.locator('.lever').boundingBox();
            await page.locator('.readout').evaluate(element => { element.scrollTop = element.scrollHeight; });
            assert.match(await page.locator('.readout').innerText(), /Anomaly content/);
            assert.deepEqual(await page.locator('.lever').boundingBox(), before, 'Scrolling moved the lever');
            report.push({ width, height, ...geometry });
        }

        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(baseURL);
        const vanillaLever = await page.locator('.lever').boundingBox();
        const vanillaConsole = await page.locator('.console').boundingBox();
        const seedBefore = await page.locator('.parameter').filter({ hasText: 'Seed' }).locator('dd').innerText();
        for (const name of ['Royalty', 'Ideology', 'Biotech', 'Anomaly']) {
            await page.getByRole('checkbox', { name, exact: true }).check();
        }
        assert.equal(await page.locator('#module-count').innerText(), '4 / 4');
        await page.getByRole('button', { name: 'Pull to randomize', exact: true }).click();
        await page.waitForURL('**/?dlc=royalty&dlc=ideology&dlc=biotech&dlc=anomaly');
        assert.equal(await page.locator('.parameter').count(), 10);
        assert.deepEqual(await page.locator('.lever').boundingBox(), vanillaLever, 'DLC rows moved the lever');
        assert.deepEqual(await page.locator('.console').boundingBox(), vanillaConsole, 'DLC rows resized the console');
        assert.notEqual(await page.locator('.parameter').filter({ hasText: 'Seed' }).locator('dd').innerText(), seedBefore);

        await page.getByRole('checkbox', { name: 'Royalty', exact: true }).focus();
        await page.keyboard.press('Space');
        assert.equal(await page.getByRole('checkbox', { name: 'Royalty', exact: true }).isChecked(), false);
        await page.getByRole('button', { name: 'Pull to randomize', exact: true }).focus();
        await page.keyboard.press('Enter');
        await page.waitForURL('**/?dlc=ideology&dlc=biotech&dlc=anomaly');
        assert.equal(await page.locator('.parameter').count(), 9);

        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await page.locator('.lever-grip').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
        const noJS = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1366, height: 768 } });
        const fallback = await noJS.newPage();
        await fallback.goto(baseURL);
        await fallback.getByRole('checkbox', { name: 'Biotech', exact: true }).check();
        await fallback.getByRole('button', { name: 'Pull to randomize', exact: true }).click();
        await fallback.waitForURL('**/?dlc=biotech');
        assert.equal(await fallback.locator('.parameter').count(), 7);
        await noJS.close();
        assert.deepEqual(errors, []);
        await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
        console.log('PASS: 8 viewport screenshots; DLC/scroll geometry; randomize; keyboard; reduced motion; no-JS fallback; no browser/asset errors.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
