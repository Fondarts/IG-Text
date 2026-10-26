// Infraestructura compartida de los tests: servidor estático, navegador, pasos.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = join(ROOT, 'tests', 'output');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.otf': 'font/otf' };

export async function startServer() {
    const server = createServer(async (req, res) => {
        const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\.])+/, '') || 'index.html';
        try {
            const body = await readFile(join(ROOT, path));
            res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
            res.end(body);
        } catch {
            res.writeHead(404);
            res.end();
        }
    });
    await new Promise(r => server.listen(0, r));
    await mkdir(OUT, { recursive: true });
    return { server, base: `http://localhost:${server.address().port}/` };
}

export function launch() {
    return chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' });
}

export function createRunner(title) {
    let passed = 0, failed = 0;
    console.log(title);
    return {
        async step(name, fn) {
            try {
                await fn();
                passed++;
                console.log(`  ✓ ${name}`);
            } catch (e) {
                failed++;
                console.log(`  ✗ ${name}\n    ${e.message.split('\n').join('\n    ')}`);
                process.exitCode = 1;
            }
        },
        done() {
            console.log(`${passed} passed, ${failed} failed\n`);
        }
    };
}

export const pngSize = buf => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });

export async function download(page, selector) {
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click(selector)]);
    const file = join(OUT, dl.suggestedFilename());
    await dl.saveAs(file);
    return { name: dl.suggestedFilename(), buf: await readFile(file) };
}

// Cambia un control como lo haría el usuario (dispara input/change).
export async function setControl(page, id, value) {
    await page.$eval('#' + id, (el, v) => {
        if (el.type === 'checkbox') { el.checked = v; el.dispatchEvent(new Event('change')); }
        else if (el.tagName === 'SELECT') { el.value = v; el.dispatchEvent(new Event('change')); }
        else { el.value = String(v); el.dispatchEvent(new Event('input')); }
    }, value);
}

// Por defecto limpia los overrides de tamaño por línea (si no, se arrastran de un
// test al siguiente, que es lo que hace la app a propósito).
export async function setText(page, text, { keepLineSizes = false } = {}) {
    await page.fill('#text-input', text);
    if (!keepLineSizes) {
        await page.waitForTimeout(50);
        await page.$$eval('#per-line-size-list .per-line-reset:not(:disabled)', bs => bs.forEach(b => b.click()));
    }
}

export async function setLineSizes(page, sizes) {
    for (let i = 0; i < sizes.length; i++) {
        if (sizes[i] == null) continue;
        await page.$eval(`#per-line-size-list .per-line-size-row:nth-child(${i + 1}) input`, (s, v) => {
            s.value = String(v);
            s.dispatchEvent(new Event('input'));
        }, sizes[i]);
    }
}

export async function selectFont(page, label) {
    await page.click('#font-search');
    await page.fill('#font-search', label);
    await page.press('#font-search', 'Enter');
    await page.click('h1');
}

// Espera a que el render (coalescido por requestAnimationFrame) se aplique.
export const settle = (page, ms = 150) => page.waitForTimeout(ms);

// Geometría del render, en unidades lógicas del viewBox (360×640): por cada línea,
// extremos del texto y del fondo (muestreando el path con isPointInFill a la
// altura del centro de la línea).
export function geometry(page) {
    return page.evaluate(() => {
        const content = document.querySelector('#text-svg .text-content');
        const path = content.querySelector('path');
        const texts = [...content.querySelectorAll('text')];
        return texts.map(t => {
            const ls = parseFloat(t.style.letterSpacing) || 0;
            const x = parseFloat(t.getAttribute('x'));
            const lastIsImage = !!t.lastElementChild && t.lastElementChild.hasAttribute('textLength');
            const width = t.getComputedTextLength() - (lastIsImage ? 0 : ls);
            const bb = t.getBBox();
            const cy = bb.y + bb.height / 2;
            let bgLeft = null, bgRight = null;
            if (path) {
                const pt = new DOMPoint(0, cy);
                for (let px = -5; px <= 365; px += 0.25) {
                    pt.x = px;
                    if (path.isPointInFill(pt)) {
                        if (bgLeft === null) bgLeft = px;
                        bgRight = px;
                    }
                }
            }
            return { text: t.textContent, x, right: x + width, width, cy, bgLeft, bgRight, bgWidth: bgLeft === null ? null : bgRight - bgLeft };
        });
    });
}
