// Tests de funcionalidades: picker, fuentes, export, presets, atajos, mobile, robustez.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { startServer, launch, createRunner, setControl, setText, settle, download, pngSize, selectFont, ROOT, OUT } from './helpers.mjs';

const { server, base } = await startServer();
const browser = await launch();
const t = createRunner('Features');

async function freshPage(options = {}, seed = null) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true, ...options });
    const page = await context.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    await page.addInitScript(s => {
        if (sessionStorage.getItem('seeded')) return;
        sessionStorage.setItem('seeded', '1');
        localStorage.clear();
        if (s) for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    }, seed);
    await page.goto(base, { waitUntil: 'networkidle' });
    return page;
}
const toastText = page => page.$$eval('.toast', ts => ts.map(t => t.textContent).join(' | '));

let page = await freshPage();
// El registro de fuentes se lee de la propia app (mismo módulo que usa la página).
const FONTS = await page.evaluate(() => import('./js/fonts.js').then(m => m.FONTS.map(f => ({ label: f.label, family: f.family, file: !!f.file, google: !!f.google, textWeight: f.textWeight, weights: f.weights }))));

// ---- Picker de emojis ----
await t.step('emoji nav bar: one icon per category, favorites/recent hidden when empty', async () => {
    await page.click('#emoji-btn');
    const icons = await page.$$eval('#emoji-nav .emoji-nav-btn', bs => bs.map(b => ({ key: b.dataset.nav, hidden: b.hidden })));
    assert.equal(icons.length, 12);
    assert.ok(icons.find(i => i.key === 'favorites').hidden);
    assert.ok(icons.find(i => i.key === 'recent').hidden);
    await page.screenshot({ path: join(OUT, 'features-emoji-nav.png') });
});

for (const key of ['Animals & Nature', 'Flags', 'Food & Drink', 'Smileys & Emotion']) {
    await t.step(`emoji nav jumps to "${key}"`, async () => {
        await page.click(`#emoji-nav [data-nav="${key}"]`);
        await page.waitForTimeout(100);
        const r = await page.evaluate(k => {
            const header = document.querySelector('.emoji-panel-header').getBoundingClientRect();
            const title = document.querySelector(`.emoji-section[data-nav="${k}"] .emoji-section-title`).getBoundingClientRect();
            const panel = document.getElementById('emoji-panel');
            const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
            return { gap: title.top - header.bottom, atBottom, active: document.querySelector('#emoji-nav .active')?.dataset.nav };
        }, key);
        // El título queda justo debajo del encabezado fijo (o la última sección, al fondo).
        assert.ok(r.atBottom || (r.gap >= 0 && r.gap < 20), `section title gap ${r.gap}`);
        assert.equal(r.active, key);
    });
}

await t.step('emoji nav while searching clears the search', async () => {
    await page.fill('#emoji-search', 'cat');
    await page.click('#emoji-nav [data-nav="Objects"]');
    assert.equal(await page.inputValue('#emoji-search'), '');
    assert.ok(await page.$eval('.emoji-section[data-nav="Objects"]', s => s.offsetParent !== null));
});

await t.step('emoji without cursor placed goes to the end; favorites icon appears', async () => {
    await page.keyboard.press('Escape');
    await setText(page, 'Hola');
    await page.evaluate(() => document.activeElement.blur());
    page = await freshPage();
    await setText(page, 'Hola');
    await page.click('h1');
    await page.click('#emoji-btn');
    await page.click('.emoji-section[data-nav="Smileys & Emotion"] .emoji-item[data-emoji="😀"]');
    assert.equal(await page.inputValue('#text-input'), 'Hola😀');
    await page.click('.emoji-section[data-nav="Smileys & Emotion"] .emoji-item[data-emoji="😀"]', { button: 'right' });
    assert.equal(await page.$eval('#emoji-nav [data-nav="favorites"]', b => b.hidden), false);
    assert.equal(await page.$eval('#emoji-nav [data-nav="recent"]', b => b.hidden), false);
    await page.click('#emoji-nav [data-nav="Flags"]');
    await page.click('#emoji-nav [data-nav="favorites"]');
    await page.waitForTimeout(100);
    // Favoritos es la primera sección: vuelve al tope del panel.
    assert.equal(await page.$eval('#emoji-panel', p => p.scrollTop), 0);
    assert.equal(await page.$eval('#emoji-nav .active', b => b.dataset.nav), 'favorites');
});

await t.step('long-press (touch) toggles a favorite without inserting', async () => {
    const before = await page.inputValue('#text-input');
    const btn = page.locator('.emoji-section[data-nav="Animals & Nature"] .emoji-item[data-emoji="🐶"]');
    await btn.scrollIntoViewIfNeeded();
    const box = await btn.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1200); // margen sobre los 500ms del long-press (CI cargado)
    await page.mouse.up();
    assert.equal(await page.inputValue('#text-input'), before);
    const favs = await page.evaluate(() => JSON.parse(localStorage.getItem('favoriteEmojis')));
    assert.ok(favs.includes('🐶'));
    await page.keyboard.press('Escape');
});

await t.step('keyboard: arrows move inside the grid, typing goes back to search', async () => {
    await page.click('#emoji-btn');
    await page.fill('#emoji-search', 'heart');
    await page.waitForTimeout(1500);
    await page.press('#emoji-search', 'ArrowDown');
    const first = await page.evaluate(() => document.activeElement.dataset.emoji);
    await page.keyboard.press('ArrowRight');
    const second = await page.evaluate(() => document.activeElement.dataset.emoji);
    assert.ok(first && second && first !== second);
    await page.keyboard.type('x');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'emoji-search');
    await page.keyboard.press('Escape'); // limpia
    await page.keyboard.press('Escape'); // cierra
    assert.ok(await page.$eval('#emoji-panel', p => p.hidden));
});

// ---- Fuentes ----
for (const f of FONTS) {
    await t.step(`font "${f.label}": loads and exports`, async () => {
        await setText(page, 'Fonty Text 123');
        await selectFont(page, f.label);
        assert.equal(await page.inputValue('#font-search'), f.label);
        await page.waitForTimeout(800);
        // Se dibuja con su peso propio, y ese peso existe en la fuente (sin faux bold).
        const style = await page.$eval('#text-svg .text-content text', el => el.getAttribute('style'));
        assert.ok(style.includes(`font-weight: ${f.textWeight};`), `expected weight ${f.textWeight}: ${style}`);
        assert.ok(f.textWeight >= f.weights[0] && f.textWeight <= f.weights[1], `weights ${f.weights}`);
        if (f.file || f.google) {
            const ok = await page.evaluate(([fam, w]) => document.fonts.check(`${w} 40px "${fam}"`), [f.family, f.textWeight]);
            assert.ok(ok, `${f.family} not loaded`);
        }
        const { buf } = await download(page, '#download-btn');
        const { w, h } = pngSize(buf);
        assert.ok(w > 150 && h > 40, `png ${w}x${h}`);
    });
}

await t.step('font combobox: filter + keyboard selection', async () => {
    await page.click('#font-search');
    await page.fill('#font-search', 'mont');
    const items = await page.$$eval('#font-list .font-list-item', els => els.map(e => e.textContent));
    assert.deepEqual(items, ['Montserrat']);
    await page.press('#font-search', 'ArrowDown');
    await page.press('#font-search', 'Enter');
    assert.equal(await page.inputValue('#font-search'), 'Montserrat');
    assert.ok(await page.$eval('#font-list', l => l.hidden));
});

await t.step('custom font upload is used for rendering and export', async () => {
    await selectFont(page, 'Custom');
    assert.equal(await page.$eval('#custom-font-group', g => g.hidden), false);
    await page.setInputFiles('#custom-font-file', join(ROOT, 'Fonts', 'Aveny-T.ttf'));
    await page.waitForTimeout(500);
    assert.equal(await page.inputValue('#font-search'), 'Custom: Aveny-T');
    const style = await page.$eval('#text-svg .text-content text', el => el.getAttribute('style'));
    assert.ok(style.includes('CustomFont-Aveny-T'), style);
    const { buf } = await download(page, '#download-btn');
    assert.ok(pngSize(buf).w > 100);
});

await t.step('invalid custom font shows an error toast', async () => {
    await page.setInputFiles('#custom-font-file', join(ROOT, 'index.html'));
    await page.waitForTimeout(500);
    assert.match(await toastText(page), /not a valid font/);
});

// ---- Peso ----
const textStyle = () => page.$eval('#text-svg .text-content text', el => ({
    style: el.getAttribute('style'), stroke: el.getAttribute('stroke'), fill: el.getAttribute('fill')
}));
const weightUI = () => page.evaluate(() => ({
    min: document.getElementById('font-weight').min,
    value: document.getElementById('font-weight').value,
    label: document.getElementById('font-weight-value').textContent
}));

await t.step('weight: variable font (Montserrat) uses real weights 100–900, no outline', async () => {
    await setText(page, 'Weight test');
    await selectFont(page, 'Montserrat');
    assert.equal((await weightUI()).min, '100');
    for (const w of [100, 350, 900]) {
        await setControl(page, 'font-weight', w);
        await settle(page);
        const s = await textStyle();
        assert.ok(s.style.includes(`font-weight: ${w};`), s.style);
        assert.ok(!s.style.includes('stroke-width') && !s.stroke, `no outline at ${w}`);
        assert.match((await weightUI()).label, new RegExp(`^${w} · real`));
    }
});

await t.step('weight: single-weight font (Modern) simulates heavier weights with an outline', async () => {
    await selectFont(page, 'Modern');
    const ui = await weightUI();
    assert.equal(ui.min, '400');
    assert.match(ui.label, /^400 · real · default/);
    await setControl(page, 'font-weight', 700);
    await settle(page);
    const s = await textStyle();
    assert.ok(s.style.includes('font-weight: 400;'), 'requests the real Regular weight: ' + s.style);
    assert.ok(/stroke-width: [\d.]+px/.test(s.style) && s.stroke === s.fill, 'outline in the text color');
    assert.match((await weightUI()).label, /^700 · simulated \(real 400\)/);
});

await t.step('weight: cannot go below the lightest real weight', async () => {
    await setControl(page, 'font-weight', 200);
    await settle(page);
    assert.equal((await weightUI()).value, '400');
    assert.ok((await textStyle()).style.includes('font-weight: 400;'));
});

await t.step('weight: changing font resets to that font\'s default; double-click resets too', async () => {
    await setControl(page, 'font-weight', 800);
    await selectFont(page, 'Classic');
    assert.match((await weightUI()).label, /^600 · real · default/);
    await setControl(page, 'font-weight', 750);
    await page.dblclick('#font-weight');
    assert.match((await weightUI()).label, /default/);
});

await t.step('weight: browser faux bold is disabled on every text', async () => {
    const all = await page.$$eval('#text-svg .text-content text', ts => ts.map(t => t.getAttribute('style')));
    for (const s of all) assert.ok(s.includes('font-synthesis: style'), s);
});

await t.step('weight: emojis never get the outline', async () => {
    await selectFont(page, 'Modern');
    await setText(page, 'Hi 😀');
    await setControl(page, 'font-weight', 800);
    await settle(page);
    const emojiStyle = await page.$eval('#text-svg .text-content tspan:last-child', el => el.getAttribute('style'));
    assert.ok(emojiStyle.includes('stroke: none'), emojiStyle);
});

// Tinta (opacidad acumulada) del PNG exportado: más peso → más tinta, siempre.
async function exportedInk() {
    const { buf } = await download(page, '#download-btn');
    return page.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data; let n = 0;
        for (let k = 3; k < d.length; k += 4) n += d[k] / 255;
        return n;
    }, buf.toString('base64'));
}

for (const font of ['Modern', 'Montserrat']) {
    await t.step(`weight: exported PNG gets heavier step by step (${font})`, async () => {
        await setText(page, 'Heavier and heavier');
        await setControl(page, 'transparent-bg', true);
        await selectFont(page, font);
        const inks = [];
        for (const w of [400, 550, 700, 900]) {
            await setControl(page, 'font-weight', w);
            await settle(page, 300);
            inks.push(await exportedInk());
        }
        for (let i = 1; i < inks.length; i++) assert.ok(inks[i] > inks[i - 1] * 1.03, `ink ${inks.map(Math.round)}`);
        await setControl(page, 'transparent-bg', false);
    });
}

await t.step('italic changes the rendered style', async () => {
    await selectFont(page, 'Classic');
    await setControl(page, 'italic', true);
    await settle(page);
    assert.ok((await textStyle()).style.includes('font-style: italic'));
    await setControl(page, 'italic', false);
});

// ---- Fondo, safe zones, export ----
await t.step('background image: preview, story export 1080×1920, remove', async () => {
    await page.setInputFiles('#bg-image-file', join(ROOT, 'Safezones', 'paid safezone.png'));
    await page.waitForFunction(() => !document.getElementById('bg-image-preview').hidden);
    const story = await download(page, '#download-story-btn');
    assert.deepEqual(pngSize(story.buf), { w: 1080, h: 1920 });
    await page.click('#remove-bg-image');
    assert.ok(await page.$eval('#bg-image-preview', i => i.hidden));
    assert.ok(await page.$eval('#remove-bg-image', i => i.hidden));
});

await t.step('safe zones overlays toggle', async () => {
    await setControl(page, 'safe-zones-select', 'organic');
    assert.deepEqual(await page.evaluate(() => [document.getElementById('safe-zone-organic').hidden, document.getElementById('safe-zone-paid').hidden]), [false, true]);
    await setControl(page, 'safe-zones-select', 'paid');
    assert.deepEqual(await page.evaluate(() => [document.getElementById('safe-zone-organic').hidden, document.getElementById('safe-zone-paid').hidden]), [true, false]);
    await setControl(page, 'safe-zones-select', 'none');
});

await t.step('empty text: export shows an error and does not download', async () => {
    await setText(page, '');
    let downloaded = false;
    const onDl = () => { downloaded = true; };
    page.on('download', onDl);
    await page.click('#download-btn');
    await page.waitForTimeout(800);
    page.off('download', onDl);
    assert.equal(downloaded, false);
    assert.match(await toastText(page), /Write some text/);
});

await t.step('sticker export matches the preview proportions', async () => {
    await setText(page, 'First line\nSecond line ✌️\nsdsdsdsdsdsddsadsds');
    await settle(page, 300);
    const bb = await page.$eval('#text-svg .text-content', g => { const b = g.getBBox(); return { w: b.width, h: b.height }; });
    const { buf } = await download(page, '#download-btn');
    const { w, h } = pngSize(buf);
    assert.ok(Math.abs(w - bb.w * 3) <= 3 && Math.abs(h - bb.h * 3) <= 3, `png ${w}x${h} vs bbox×3 ${bb.w * 3}x${bb.h * 3}`);
});

// ---- Presets ----
await t.step('presets: save, overwrite confirm, rename, delete', async () => {
    const answers = ['My preset', 'My preset', 'Renamed'];
    const confirms = [];
    page.on('dialog', async d => {
        if (d.type() === 'prompt') await d.accept(answers.shift());
        else { confirms.push(d.message()); await d.accept(); }
    });
    await setControl(page, 'font-size', 44);
    await page.click('#save-preset-btn');
    await page.waitForTimeout(200);
    assert.equal(await page.inputValue('#preset-select'), 'My preset');
    await page.click('#save-preset-btn'); // mismo nombre → confirmar sobrescritura
    await page.waitForTimeout(200);
    assert.ok(confirms.some(m => /already exists/.test(m)));
    await page.click('#rename-preset-btn');
    await page.waitForTimeout(200);
    assert.deepEqual(await page.$$eval('#preset-select option', os => os.map(o => o.value).filter(Boolean)), ['Renamed']);
    await setControl(page, 'font-size', 20);
    await setControl(page, 'preset-select', 'Renamed');
    await settle(page);
    assert.equal(await page.inputValue('#font-size'), '44');
    await page.click('#delete-preset-btn');
    await page.waitForTimeout(200);
    assert.deepEqual(await page.$$eval('#preset-select option', os => os.map(o => o.value).filter(Boolean)), []);
    page.removeAllListeners('dialog');
});

// ---- Atajos y controles ----
await t.step('Ctrl+S downloads the PNG', async () => {
    await page.click('h1');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.keyboard.press('Control+s')]);
    assert.ok(dl.suggestedFilename().endsWith('.png'));
});

await t.step('Ctrl+Z / Ctrl+Y outside text fields', async () => {
    await setControl(page, 'border-radius', 22);
    await page.waitForTimeout(500);
    await page.click('h1');
    await page.keyboard.press('Control+z');
    assert.equal(await page.inputValue('#border-radius'), '10');
    await page.keyboard.press('Control+y');
    assert.equal(await page.inputValue('#border-radius'), '22');
});

await t.step('double-click on a slider resets it', async () => {
    await page.dblclick('#border-radius');
    assert.equal(await page.inputValue('#border-radius'), '10');
    assert.equal(await page.textContent('#border-radius-value'), '10px');
});

await t.step('no page errors (desktop)', async () => assert.deepEqual(page.errors, []));
await page.context().close();

// ---- Robustez ----
await t.step('corrupted localStorage does not break the app', async () => {
    const p = await freshPage({}, {
        textEditorLastState: '{not json',
        textEditorPresets: '"oops"',
        recentEmojis: '{"a":1}',
        favoriteEmojis: 'null'
    });
    assert.equal(await p.locator('#text-svg .text-content text').count(), 2);
    await p.click('#emoji-btn');
    assert.deepEqual(p.errors, []);
    await p.context().close();
});

await t.step('legacy autosave with bold: true becomes weight 700', async () => {
    const p = await freshPage({}, { textEditorLastState: JSON.stringify({ text: 'Old bold', textStyle: 'modern', bold: true }) });
    assert.match(await p.textContent('#font-weight-value'), /^700 · simulated/);
    assert.deepEqual(p.errors, []);
    await p.context().close();
});

await t.step('offline flags fall back to text and export still works', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
    await context.route(/twemoji/, r => r.abort());
    const p = await context.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(base, { waitUntil: 'networkidle' });
    await setText(p, 'Vamos 🇦🇷');
    await p.waitForTimeout(1000);
    assert.equal(await p.locator('#text-svg .text-content image').count(), 0);
    assert.ok((await p.$eval('#text-svg .text-content text', el => el.textContent)).includes('🇦🇷'));
    const { buf } = await download(p, '#download-btn');
    assert.ok(pngSize(buf).w > 100);
    assert.deepEqual(errs, []);
    await context.close();
});

// ---- Mobile ----
await t.step('mobile: touch drag moves the text without scrolling the page', async () => {
    const p = await freshPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    await p.locator('.story-container').scrollIntoViewIfNeeded();
    const box = await p.locator('#text-svg').boundingBox();
    const scrollBefore = await p.evaluate(() => window.scrollY);
    const cdp = await p.context().newCDPSession(p);
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + i * 5, y: y - i * 15 }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await p.waitForTimeout(500);
    const st = await p.evaluate(() => JSON.parse(localStorage.getItem('textEditorLastState')));
    assert.ok(st.offsetY < -50 && st.offsetX > 15, `offset ${st.offsetX},${st.offsetY}`);
    assert.equal(await p.evaluate(() => window.scrollY), scrollBefore);
    await p.click('#center-btn');
    await p.waitForTimeout(500);
    const st2 = await p.evaluate(() => JSON.parse(localStorage.getItem('textEditorLastState')));
    assert.deepEqual([st2.offsetX, st2.offsetY], [0, 0]);
    await p.click('#emoji-btn');
    await p.screenshot({ path: join(OUT, 'features-mobile-emoji.png') });
    assert.deepEqual(p.errors, []);
    await p.context().close();
});

t.done();
await browser.close();
server.close();
