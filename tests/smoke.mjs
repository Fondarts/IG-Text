// Smoke test end-to-end con Playwright sobre el Chrome instalado.
//   cd tests && npm install && npm test
// Levanta su propio servidor estático, recorre las funciones principales y deja
// capturas y PNGs exportados en tests/output/.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { startServer, OUT } from './helpers.mjs';
import { chromium } from 'playwright';

const { server, base: BASE } = await startServer();
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.slice(0, -1) });
const page = await context.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));

let passed = 0;
async function step(name, fn) {
    try {
        await fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        console.log(`  ✗ ${name}\n    ${e.message}`);
        process.exitCode = 1;
    }
}

const pngSize = buf => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
async function download(selector) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(selector)]);
    const file = join(OUT, dl.suggestedFilename());
    await dl.saveAs(file);
    return { name: dl.suggestedFilename(), buf: await readFile(file) };
}
const textState = () => page.evaluate(() => JSON.parse(localStorage.getItem('textEditorLastState') || 'null'));

// Presets de la versión anterior (claves viejas, valores string) para probar la migración.
await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.clear();
    localStorage.setItem('textEditorPresets', JSON.stringify({
        Legacy: { text: 'Old\npreset', textStyle: 'montserrat', textColor: '#ff0000', bgColor: '#000000', bgOpacity: '80',
                  fontSize: '40', lineHeight: '120', letterSpacing: '0', borderRadius: '10', textVerticalPosition: '0',
                  bold: false, italic: false, transparentBg: false, textAlign: 'left', safeZones: 'none', perLineSizes: [60, null] }
    }));
});
await page.goto(BASE, { waitUntil: 'networkidle' });

console.log('Social text editor smoke test');

await step('renders the default text with background', async () => {
    assert.equal(await page.locator('#text-svg .text-content text').count(), 2);
    assert.equal(await page.locator('#text-svg .text-content path').count(), 1);
});

await step('new emojis (🫠 ⭐ ⌛) are rendered at emoji size', async () => {
    await page.fill('#text-input', '🫠 hi ⭐ ⌛');
    await page.waitForTimeout(200);
    const sizes = await page.$$eval('#text-svg .text-content tspan', ts => ts.map(t => [t.textContent, t.getAttribute('style')]));
    for (const e of ['🫠', '⭐', '⌛']) {
        const found = sizes.find(([t]) => t === e);
        assert.ok(found && /font-size: 26\.4px/.test(found[1]), `${e} should be 80% size, got ${JSON.stringify(found)}`);
    }
});

await step('layout does not depend on the window size', async () => {
    await page.fill('#text-input', 'This is a long sentence that wraps across lines');
    await page.waitForTimeout(200);
    const lines = () => page.$$eval('#text-svg .text-content text', ts => ts.map(t => t.textContent));
    const wide = await lines();
    await page.setViewportSize({ width: 700, height: 1000 });
    await page.fill('#text-input', 'This is a long sentence that wraps across lines ');
    await page.waitForTimeout(200);
    const narrow = await lines();
    await page.setViewportSize({ width: 1280, height: 1000 });
    assert.deepEqual(narrow, wide);
});

await step('emoji search (English and Spanish) inserts at the cursor', async () => {
    await page.fill('#text-input', 'Hello world');
    await page.evaluate(() => { const t = document.getElementById('text-input'); t.focus(); t.setSelectionRange(5, 5); });
    await page.click('#emoji-btn');
    await page.fill('#emoji-search', 'corazon rojo');
    await page.waitForFunction(() => document.querySelector('#emoji-sections .emoji-item[data-emoji="❤️"]'), null, { timeout: 15000 });
    await page.fill('#emoji-search', 'fire');
    await page.waitForTimeout(100);
    const first = await page.$eval('#emoji-sections .emoji-item', b => b.dataset.emoji);
    assert.equal(first, '🔥');
    await page.press('#emoji-search', 'Enter');
    assert.equal(await page.inputValue('#text-input'), 'Hello🔥 world');
    await page.fill('#emoji-search', 'bandera argentina');
    await page.waitForTimeout(100);
    assert.equal(await page.$eval('#emoji-sections .emoji-item', b => b.dataset.emoji), '🇦🇷');
});

await step('favorites: right-click toggles and persists', async () => {
    await page.fill('#emoji-search', 'fire');
    await page.waitForTimeout(100);
    await page.click('#emoji-sections .emoji-item[data-emoji="🔥"]', { button: 'right' });
    await page.fill('#emoji-search', '');
    await page.waitForSelector('.favorites-section .emoji-item[data-emoji="🔥"]');
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('favoriteEmojis'))), ['🔥']);
    assert.ok(await page.$eval('.emoji-section:not(.favorites-section) .emoji-item[data-emoji="🔥"]', b => b.classList.contains('is-favorite')));
    await page.screenshot({ path: join(OUT, 'emoji-panel.png') });
    await page.keyboard.press('Escape');
    assert.ok(await page.$eval('#emoji-panel', p => p.hidden));
});

await step('filename keeps numbers ("Top 10 tips")', async () => {
    await page.fill('#text-input', 'Top 10 tips 🔥');
    await page.check('#text-to-filename');
    const { name } = await download('#download-btn');
    assert.equal(name, 'Top 10 tips.png');
    await page.uncheck('#text-to-filename');
});

await step('per-line size follows its line when inserting a line above', async () => {
    await page.fill('#text-input', 'one\ntwo');
    await page.waitForTimeout(100);
    await page.$eval('#per-line-size-list .per-line-size-row:nth-child(2) input', s => { s.value = '60'; s.dispatchEvent(new Event('input')); });
    await page.evaluate(() => {
        const t = document.getElementById('text-input');
        t.value = 'zero\none\ntwo';
        t.dispatchEvent(new Event('input'));
    });
    await page.waitForTimeout(500);
    // Se guarda como escala relativa al tamaño global (60 / 33).
    const scales = (await textState()).perLineScales;
    assert.deepEqual(scales, [null, null, Math.round(60 / 33 * 10000) / 10000]);
});

await step('undo / redo', async () => {
    await page.fill('#text-input', 'Undo me');
    await page.waitForTimeout(500);
    await page.$eval('#font-size', s => { s.value = '50'; s.dispatchEvent(new Event('input')); });
    await page.waitForTimeout(500);
    await page.click('#undo-btn');
    assert.equal(await page.inputValue('#font-size'), '33');
    await page.click('#redo-btn');
    assert.equal(await page.inputValue('#font-size'), '50');
});

await step('legacy preset loads (migrated keys)', async () => {
    await page.selectOption('#preset-select', 'Legacy');
    await page.waitForTimeout(300);
    assert.equal(await page.inputValue('#text-input'), 'Old\npreset');
    // Tamaños por línea absolutos de la versión anterior → escala (60px sobre 40px).
    const sizes = await page.$$eval('#text-svg .text-content text', ts => ts.map(t => t.style.fontSize));
    assert.deepEqual(sizes, ['60px', '40px']);
    assert.equal(await page.inputValue('#text-align'), 'left');
    assert.equal(await page.inputValue('#font-search'), 'Montserrat');
    assert.equal(await page.inputValue('#bg-opacity'), '80');
});

await step('autosave restores the last state after reload', async () => {
    await page.fill('#text-input', 'Persist me');
    await page.waitForTimeout(600);
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.inputValue('#text-input'), 'Persist me');
});

await step('drag moves the text and the story export is 1080×1920', async () => {
    await page.fill('#text-input', 'Dragged 🇺🇸');
    await page.waitForTimeout(1500);
    const box = await page.locator('#text-svg').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 - 150, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    assert.ok((await textState()).offsetY < -100);
    await page.locator('.story-container').screenshot({ path: join(OUT, 'preview-dragged.png') });
    const story = await download('#download-story-btn');
    assert.deepEqual(pngSize(story.buf), { w: 1080, h: 1920 });
    assert.ok(story.name.endsWith('-story.png') || story.name === 'instagram-text-story.png');
});

await step('sticker export is cropped and copy to clipboard works', async () => {
    const sticker = await download('#download-btn');
    const { w, h } = pngSize(sticker.buf);
    assert.ok(w > 100 && w < 1080 && h > 50 && h < 600, `unexpected size ${w}x${h}`);
    await page.click('#copy-btn');
    await page.waitForTimeout(1500);
    const types = await page.evaluate(async () => (await navigator.clipboard.read())[0].types);
    assert.ok(types.includes('image/png'));
});

await step('no uncaught page errors', async () => {
    assert.deepEqual(errors, []);
});

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: join(OUT, 'mobile.png'), fullPage: true });

await browser.close();
server.close();
console.log(`${passed} checks passed${process.exitCode ? ', some FAILED' : ''}`);
