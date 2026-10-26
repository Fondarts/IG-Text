// Tests de geometría del layout: escalera, alineación, agrupación, límites.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { startServer, launch, createRunner, setControl, setText, setLineSizes, settle, geometry, OUT } from './helpers.mjs';

const { server, base } = await startServer();
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.addInitScript(() => {
    if (!sessionStorage.getItem('seeded')) { sessionStorage.setItem('seeded', '1'); localStorage.clear(); }
});
await page.goto(base, { waitUntil: 'networkidle' });
const t = createRunner('Layout geometry');

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(2)} vs ${b.toFixed(2)} (tol ${tol})`);
const shot = name => page.locator('.story-container').screenshot({ path: join(OUT, `layout-${name}.png`) });

// Escenario reportado: 3 líneas con tamaño por línea 37/27/21 y global 53.
async function reportedScenario(align) {
    await setText(page, 'First line\nSecond line ✌️\nsdsdsdsdsdsddsadsds');
    await setControl(page, 'font-size', 53);
    await setControl(page, 'text-align', align);
    await settle(page);
    await setLineSizes(page, [37, 27, 21]);
    await settle(page, 300);
    return geometry(page);
}

await t.step('reported case (left): staircase with 3 different widths', async () => {
    const g = await reportedScenario('left');
    await shot('reported-left');
    assert.equal(g.length, 3);
    // Los anchos del fondo crecen línea a línea (escalera, no un bloque).
    assert.ok(g[1].bgWidth - g[0].bgWidth > 3, `L2 should be wider than L1: ${g.map(l => l.bgWidth.toFixed(1))}`);
    assert.ok(g[2].bgWidth - g[1].bgWidth > 3, `L3 should be wider than L2: ${g.map(l => l.bgWidth.toFixed(1))}`);
});

await t.step('reported case (left): text starts at the same x on every line', async () => {
    const g = await geometry(page);
    near(g[1].x, g[0].x, 0.01, 'L2 x');
    near(g[2].x, g[0].x, 0.01, 'L3 x');
    // Y el borde izquierdo del fondo también alineado.
    near(g[1].bgLeft, g[0].bgLeft, 0.5, 'L2 bg left');
    near(g[2].bgLeft, g[0].bgLeft, 0.5, 'L3 bg left');
});

await t.step('reported case (right): text and background right edges aligned', async () => {
    const g = await reportedScenario('right');
    await shot('reported-right');
    near(g[1].right, g[0].right, 0.01, 'L2 right');
    near(g[2].right, g[0].right, 0.01, 'L3 right');
    near(g[1].bgRight, g[0].bgRight, 0.5, 'L2 bg right');
    near(g[2].bgRight, g[0].bgRight, 0.5, 'L3 bg right');
    assert.ok(g[2].bgWidth - g[0].bgWidth > 6, 'staircase on the left side');
});

await t.step('reported case (center): every line centered in the story', async () => {
    const g = await reportedScenario('center');
    await shot('reported-center');
    for (const l of g) {
        near((l.x + l.right) / 2, 180, 0.01, `text center of "${l.text}"`);
        near((l.bgLeft + l.bgRight) / 2, 180, 0.5, `bg center of "${l.text}"`);
    }
});

await t.step('padding is symmetric around the text (center)', async () => {
    const g = await geometry(page);
    for (const l of g) near(l.x - l.bgLeft, l.bgRight - l.right, 0.6, `side padding of "${l.text}"`);
});

for (const ls of [-5, 20]) {
    await t.step(`letter-spacing ${ls}px keeps the text centered in its background`, async () => {
        await setText(page, 'Spacing test\nline two');
        await setControl(page, 'font-size', 33);
        await setControl(page, 'letter-spacing', ls);
        await settle(page, 300);
        const g = await geometry(page);
        for (const l of g) near(l.x - l.bgLeft, l.bgRight - l.right, 0.6, `side padding of "${l.text}"`);
        await setControl(page, 'letter-spacing', 0);
    });
}

await t.step('almost equal widths are merged into one block', async () => {
    await setText(page, 'HELLO\nHELLO\nHELLO!');
    await setControl(page, 'font-size', 33);
    await settle(page, 300);
    const g = await geometry(page);
    near(g[1].bgWidth, g[0].bgWidth, 0.5, 'L2 width');
    near(g[2].bgWidth, g[0].bgWidth, 0.5, 'L3 width');
});

await t.step('gradually widening lines still form a staircase (no chained merge)', async () => {
    await setText(page, 'aaaa\naaaaa\naaaaaa\naaaaaaa\naaaaaaaa\naaaaaaaaa');
    await settle(page, 300);
    const g = await geometry(page);
    await shot('gradual');
    const widths = [...new Set(g.map(l => Math.round(l.bgWidth)))];
    assert.ok(widths.length >= 3, `expected several steps, got widths ${g.map(l => l.bgWidth.toFixed(1))}`);
    for (let i = 1; i < g.length; i++) assert.ok(g[i].bgWidth >= g[i - 1].bgWidth - 0.5, 'widths never shrink');
});

await t.step('classic staircase: short / long / short', async () => {
    await setText(page, 'Hi\nA much longer line\nok');
    await settle(page, 300);
    const g = await geometry(page);
    assert.ok(g[1].bgWidth > g[0].bgWidth + 20 && g[1].bgWidth > g[2].bgWidth + 20);
});

for (const r of [1, 25]) {
    await t.step(`corner radius ${r}: path is valid and covers each line`, async () => {
        await setControl(page, 'border-radius', r);
        await setText(page, 'One\nTwo two two\nThree');
        await settle(page, 300);
        const d = await page.$eval('#text-svg .text-content path', p => p.getAttribute('d'));
        assert.ok(!/NaN|Infinity/.test(d), 'path has no NaN');
        const g = await geometry(page);
        for (const l of g) assert.ok(l.bgLeft <= l.x && l.bgRight >= l.right, `"${l.text}" inside its background`);
    });
}
await setControl(page, 'border-radius', 10);

await t.step('max size + long text: background stays inside the story', async () => {
    await setControl(page, 'font-size', 90);
    await setText(page, 'Huge text that will wrap a lot of times');
    await settle(page, 300);
    const g = await geometry(page);
    assert.ok(g.length >= 3);
    for (const l of g) assert.ok(l.bgLeft >= 0 && l.bgRight <= 360.25, `"${l.text}" bg ${l.bgLeft}..${l.bgRight}`);
    await shot('max-size');
});

await t.step('a single word wider than the story is split', async () => {
    await setControl(page, 'font-size', 60);
    await setText(page, 'Supercalifragilisticexpialidocious');
    await settle(page, 300);
    const g = await geometry(page);
    assert.ok(g.length >= 2, 'word should be split');
    for (const l of g) assert.ok(l.width <= 360, `line width ${l.width}`);
    assert.equal(g.map(l => l.text).join(''), 'Supercalifragilisticexpialidocious');
});

await t.step('emoji sequences are never split when wrapping', async () => {
    await setControl(page, 'font-size', 90);
    await setText(page, '👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦👨‍👩‍👧‍👦');
    await settle(page, 300);
    const lines = await page.$$eval('#text-svg .text-content text', ts => ts.map(t => t.textContent));
    for (const l of lines) assert.ok(/^(👨‍👩‍👧‍👦)+$/u.test(l), `broken sequence in "${l}"`);
});

await t.step('empty lines in the middle do not leave gaps', async () => {
    await setControl(page, 'font-size', 33);
    await setText(page, 'Top\n\n\nBottom');
    await settle(page, 300);
    const g = await geometry(page);
    assert.equal(g.length, 2);
});

await t.step('empty text shows the placeholder', async () => {
    await setText(page, '');
    await settle(page);
    const lines = await page.$$eval('#text-svg .text-content text', ts => ts.map(t => t.textContent));
    assert.equal(lines.join(' '), 'Your text will appear here');
});

await t.step('transparent background: no path', async () => {
    await setText(page, 'No bg');
    await setControl(page, 'transparent-bg', true);
    await settle(page);
    assert.equal(await page.locator('#text-svg .text-content path').count(), 0);
    await setControl(page, 'transparent-bg', false);
});

const fontSizes = () => page.$$eval('#text-svg .text-content text', ts => ts.map(t => parseFloat(t.style.fontSize)));

await t.step('global font size scales per-line sizes proportionally', async () => {
    await reportedScenario('center');
    assert.deepEqual(await fontSizes(), [37, 27, 21]);
    await setControl(page, 'font-size', 80);
    await settle(page);
    // (a 80px la última línea se parte en dos: se compara contra la lista por línea)
    assert.deepEqual(await page.$$eval('#per-line-size-list .per-line-value', vs => vs.map(v => v.textContent)), ['56px', '41px', '32px']);
    await setControl(page, 'font-size', 26);
    await settle(page);
    assert.deepEqual(await fontSizes(), [18, 13, 10]);
});

await t.step('dragging the global slider back and forth does not drift', async () => {
    for (const v of [15, 90, 40, 71, 22, 53]) await setControl(page, 'font-size', v);
    await settle(page);
    assert.deepEqual(await fontSizes(), [37, 27, 21]);
});

await t.step('per-line reset follows the global size again', async () => {
    await page.click('#per-line-size-list .per-line-size-row:nth-child(2) .per-line-reset');
    await settle(page);
    assert.deepEqual(await page.$$eval('#per-line-size-list .per-line-value', vs => vs.map(v => v.textContent)), ['37px', '53px', '21px']);
});

await t.step('horizontal padding 0%: background hugs the text', async () => {
    await setText(page, 'Hug me\nplease ok');
    await setControl(page, 'font-size', 40);
    await setControl(page, 'padding-x', 0);
    await settle(page, 300);
    const g = await geometry(page);
    for (const l of g) {
        near(l.x - l.bgLeft, 0, 0.5, `left gap of "${l.text}"`);
        near(l.bgRight - l.right, 0, 0.5, `right gap of "${l.text}"`);
    }
});

await t.step('horizontal padding 200%: twice the default gap', async () => {
    await setControl(page, 'padding-x', 200);
    await settle(page, 300);
    const g = await geometry(page);
    for (const l of g) near(l.x - l.bgLeft, 40 * 0.42 * 2, 0.5, `left gap of "${l.text}"`);
    await setControl(page, 'padding-x', 100);
});

await t.step('vertical padding changes only the block top/bottom', async () => {
    await setText(page, 'Vertical');
    await setControl(page, 'font-size', 40);
    const height = async v => {
        await setControl(page, 'padding-y', v);
        await settle(page);
        return page.$eval('#text-svg .text-content path', p => p.getBBox().height);
    };
    const h0 = await height(0), h100 = await height(100), h300 = await height(300);
    near(h100 - h0, 2 * 40 * 0.42, 0.5, 'default padding top+bottom');
    near(h300 - h0, 3 * 2 * 40 * 0.42, 0.5, '300% padding top+bottom');
    // El ancho no cambia.
    const g = await geometry(page);
    near(g[0].x - g[0].bgLeft, 40 * 0.42, 0.5, 'horizontal gap unchanged');
    await setControl(page, 'padding-y', 100);
});

await t.step('large paddings never push the background outside the story', async () => {
    await setControl(page, 'padding-x', 300);
    await setControl(page, 'font-size', 90);
    await setText(page, 'Big padding with long text inside');
    await settle(page, 300);
    const g = await geometry(page);
    for (const l of g) assert.ok(l.bgLeft >= 0 && l.bgRight <= 360.25, `"${l.text}" bg ${l.bgLeft}..${l.bgRight}`);
    await shot('big-padding');
    await setControl(page, 'padding-x', 100);
    await setControl(page, 'font-size', 33);
});

await t.step('olympic rings + flags get their own space and background', async () => {
    await setText(page, ' Team 🇦🇷 🇺🇸');
    await page.waitForTimeout(1500);
    const imgs = await page.$$eval('#text-svg .text-content image', els => els.map(e => { const b = e.getBBox(); return { x: b.x, width: b.width }; }));
    assert.equal(imgs.length, 3);
    const g = await geometry(page);
    for (const b of imgs) assert.ok(b.x >= g[0].bgLeft && b.x + b.width <= g[0].bgRight, `image inside background: ${JSON.stringify({ b, g })}`);
    for (let i = 1; i < imgs.length; i++) assert.ok(imgs[i].x >= imgs[i - 1].x + imgs[i - 1].width - 0.5, 'images do not overlap');
    await shot('images');
});

await t.step('no page errors', async () => assert.deepEqual(errors, []));

t.done();
await browser.close();
server.close();
