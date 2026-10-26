import { STORY_W, STORY_H, EXPORT_SCALE } from './renderer.js';
import { stripEmoji } from './emoji.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

// Arma un SVG autocontenido a partir del preview y lo rasteriza a PNG.
//   mode 'sticker' → recortado al contenido (texto + fondo), fondo transparente.
//   mode 'story'   → 1080×1920 completo, con la posición arrastrada y la imagen de fondo.
export async function renderPNG({ svg, content, mode, fontCSS, backgroundImage }) {
    const clone = svg.cloneNode(true);
    clone.querySelector('[data-measure]')?.remove();
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', SVG_NS);
    clone.setAttribute('xmlns:xlink', XLINK_NS);

    let vb;
    if (mode === 'sticker') {
        // getBBox del grupo: coordenadas locales (sin el translate del drag).
        const bb = content.getBBox();
        if (!bb.width || !bb.height) throw new Error('Nothing to export');
        // Alinear el recorte a la grilla de píxeles de salida.
        const x0 = Math.floor(bb.x * EXPORT_SCALE) / EXPORT_SCALE;
        const y0 = Math.floor(bb.y * EXPORT_SCALE) / EXPORT_SCALE;
        const x1 = Math.ceil((bb.x + bb.width) * EXPORT_SCALE) / EXPORT_SCALE;
        const y1 = Math.ceil((bb.y + bb.height) * EXPORT_SCALE) / EXPORT_SCALE;
        vb = [x0, y0, x1 - x0, y1 - y0];
        clone.querySelector('.text-content').removeAttribute('transform');
    } else {
        vb = [0, 0, STORY_W, STORY_H];
        if (backgroundImage) {
            const bg = document.createElementNS(SVG_NS, 'image');
            bg.setAttribute('x', 0);
            bg.setAttribute('y', 0);
            bg.setAttribute('width', STORY_W);
            bg.setAttribute('height', STORY_H);
            bg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); // = object-fit: cover
            bg.setAttribute('href', backgroundImage);
            bg.setAttributeNS(XLINK_NS, 'xlink:href', backgroundImage);
            clone.insertBefore(bg, clone.firstChild);
        }
    }
    const outW = Math.round(vb[2] * EXPORT_SCALE);
    const outH = Math.round(vb[3] * EXPORT_SCALE);
    clone.setAttribute('viewBox', vb.join(' '));
    clone.setAttribute('width', outW);
    clone.setAttribute('height', outH);

    if (fontCSS) {
        const defs = document.createElementNS(SVG_NS, 'defs');
        const style = document.createElementNS(SVG_NS, 'style');
        style.textContent = fontCSS;
        defs.appendChild(style);
        clone.insertBefore(defs, clone.firstChild);
    }

    const svgData = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }));
    try {
        const img = await new Promise((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = () => reject(new Error('Could not rasterize the SVG'));
            im.src = url;
        });
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        canvas.getContext('2d').drawImage(img, 0, 0, outW, outH);
        return await new Promise((resolve, reject) => {
            canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Could not generate the PNG'))), 'image/png');
        });
    } finally {
        URL.revokeObjectURL(url);
    }
}

export function exportFilename(state, suffix = '') {
    let base = 'instagram-text';
    if (state.textToFilename) {
        // stripEmoji (no \p{Emoji}): \p{Emoji} incluye 0-9, # y *, y se comía los números.
        const sanitized = stripEmoji(state.text.trim())
            .replace(/[\\/:*?"<>|\r\n\u0000-\u001f]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 80)
            .trim();
        if (sanitized) base = sanitized;
    }
    return `${base}${suffix}.png`;
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Copiar al portapapeles. Se pasa la PROMESA del blob a ClipboardItem para no
// perder el gesto del usuario mientras se genera la imagen (requisito de Safari).
export async function copyPNGToClipboard(blobPromise) {
    if (!navigator.clipboard || typeof window.ClipboardItem === 'undefined') {
        throw new Error('Clipboard images are not supported in this browser');
    }
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
}
