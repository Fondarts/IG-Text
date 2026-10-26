import { buildBackgroundPath } from './background-path.js';
import { tokenize, getFlagDataURI } from './emoji.js';
import { lineSize } from './state.js';
import { getTextWeight } from './fonts.js';

// Canvas lógico FIJO de la story (9:16). El layout ya no depende del tamaño de la
// ventana: el CSS escala el SVG y el export sale siempre 1:1 (×3 → 1080×1920).
export const STORY_W = 360;
export const STORY_H = 640;
export const EXPORT_SCALE = 1080 / STORY_W;

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const EMOJI_SCALE = 0.8;          // emojis de fuente 20% más chicos que el texto
const IMAGE_EMOJI_HEIGHT = 0.85;  // alto del emoji-imagen ≈ 0.85x el tamaño de fuente
const PLACEHOLDER = ' ';     // NBSP: un espacio normal colapsaría con los vecinos
const MEASURE_CACHE_MAX = 512;

function svgEl(name, attrs = {}) {
    const el = document.createElementNS(SVG_NS, name);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
}

// Padding proporcional al tamaño (~42% del tamaño de fuente da un padding visual
// equilibrado), escalado por los sliders de padding (100% = default).
const BASE_PADDING = 0.42;
function paddingForSize(s, percent) {
    return s * BASE_PADDING * percent / 100;
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Astas ascendentes/descendentes: ajustan el alto del fondo en la primera/última línea.
function hasAscenders(str) {
    return /[bdfhkltBDFHKLTÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜA-Z0-9]/.test(str);
}
function hasDescenders(str) {
    return /[gjpqyQ]/.test(str);
}

const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
function graphemes(str) {
    return segmenter ? [...segmenter.segment(str)].map(s => s.segment) : [...str];
}

function textStyleAttr(style, size) {
    return `font-family: ${style.fontFamily}; font-size: ${size}px; font-weight: ${style.weight}; font-style: ${style.fontStyle}; letter-spacing: ${style.letterSpacing}px;`;
}

export function createRenderer(svg) {
    svg.setAttribute('viewBox', `0 0 ${STORY_W} ${STORY_H}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.innerHTML = '';
    // Capa invisible donde se arman y miden las líneas (getBBox funciona con
    // visibility:hidden, no con display:none). El export la descarta.
    const measureLayer = svgEl('g', { visibility: 'hidden', 'data-measure': '' });
    const content = svgEl('g', { class: 'text-content' });
    svg.append(measureLayer, content);

    const measureCache = new Map();

    // Construye el <text> REAL de una línea (con emojis al 80% y huecos para
    // emoji-imagen). Se usa tanto para medir como para dibujar, así el ancho del
    // fondo sale de lo que efectivamente se ve, sin factores de corrección.
    function buildLine(text, size, style) {
        const textEl = svgEl('text', { 'dominant-baseline': 'central', 'text-anchor': 'start', style: textStyleAttr(style, size) });
        const tokens = tokenize(text);
        const images = [];
        if (tokens.every(t => t.type === 'text')) {
            textEl.textContent = text;
        } else {
            const emojiDy = size * 0.02;
            let currentDy = 0; // dy es acumulativo: hay que deshacerlo después del emoji
            for (const tok of tokens) {
                const tspan = svgEl('tspan');
                if (tok.type === 'image' || tok.type === 'flag') {
                    // Hueco estirado al ancho reservado; el <image> se superpone después,
                    // midiendo su posición real. 'spacingAndGlyphs' (no 'spacing'): con un
                    // solo carácter, 'spacing' no tiene nada que ajustar e ignora textLength.
                    const aspect = tok.type === 'image' ? tok.spec.aspect : 1;
                    const reserved = size * IMAGE_EMOJI_HEIGHT * aspect;
                    tspan.setAttribute('style', `font-size: ${size}px; letter-spacing: 0px;`);
                    tspan.setAttribute('textLength', reserved);
                    tspan.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                    if (currentDy) { tspan.setAttribute('dy', -currentDy); currentDy = 0; }
                    tspan.textContent = PLACEHOLDER;
                    images.push({
                        tspan, reserved, aspect,
                        dataURI: tok.type === 'image' ? tok.spec.dataURI : getFlagDataURI(tok.flag)
                    });
                } else if (tok.type === 'emoji') {
                    tspan.setAttribute('style', `font-size: ${+(size * EMOJI_SCALE).toFixed(2)}px;`);
                    if (currentDy !== emojiDy) { tspan.setAttribute('dy', emojiDy - currentDy); currentDy = emojiDy; }
                    tspan.textContent = tok.text;
                } else {
                    if (currentDy) { tspan.setAttribute('dy', -currentDy); currentDy = 0; }
                    tspan.textContent = tok.text;
                }
                textEl.appendChild(tspan);
            }
        }
        const first = tokens[0], last = tokens[tokens.length - 1];
        const isImg = t => t && (t.type === 'image' || t.type === 'flag');
        return { el: textEl, images, startsWithImage: isImg(first), endsWithImage: isImg(last) };
    }

    // Ancho visual: Chrome suma letter-spacing también después del último glifo.
    function visualWidth(built, style) {
        const trailing = built.endsWithImage ? 0 : style.letterSpacing;
        return Math.max(0, built.el.getComputedTextLength() - trailing);
    }

    function measure(text, size, style) {
        if (!text) return 0;
        const key = `${size}|${style.weight}|${style.fontStyle}|${style.letterSpacing}|${style.fontFamily}|${text}`;
        const cached = measureCache.get(key);
        if (cached !== undefined) {
            measureCache.delete(key);
            measureCache.set(key, cached);
            return cached;
        }
        const built = buildLine(text, size, style);
        measureLayer.appendChild(built.el);
        const width = visualWidth(built, style);
        built.el.remove();
        measureCache.set(key, width);
        if (measureCache.size > MEASURE_CACHE_MAX) measureCache.delete(measureCache.keys().next().value);
        return width;
    }

    // Wrap por palabras; una palabra sola más ancha que el máximo se corta por
    // grafemas (sin partir emojis).
    function wrapLine(line, maxWidth, size, style) {
        const words = line.split(' ').filter(w => w !== '');
        const lines = [];
        let current = '';
        for (const word of words) {
            const test = current ? `${current} ${word}` : word;
            if (current && measure(test, size, style) > maxWidth) {
                lines.push(current);
                current = word;
            } else {
                current = test;
            }
            if (measure(current, size, style) > maxWidth && graphemes(current).length > 1) {
                let chunk = '';
                for (const g of graphemes(current)) {
                    if (chunk && measure(chunk + g, size, style) > maxWidth) {
                        lines.push(chunk);
                        chunk = g;
                    } else {
                        chunk += g;
                    }
                }
                current = chunk;
            }
        }
        if (current) lines.push(current);
        return lines;
    }

    function render(state, fontFamily) {
        const style = {
            fontFamily,
            weight: getTextWeight(state.fontId, state.bold),
            fontStyle: state.italic ? 'italic' : 'normal',
            letterSpacing: state.letterSpacing
        };
        const lineHeightMultiplier = state.lineHeight / 100;
        const text = state.text || 'Your text will appear here';

        content.innerHTML = '';
        setOffset(state.offsetX, state.offsetY);

        // 1. Wrap de cada línea manual con su tamaño (override por línea o global).
        const manualLines = text.split('\n');
        const wrapped = [];
        manualLines.forEach((line, i) => {
            const size = lineSize(state, i);
            const padX = paddingForSize(size, state.paddingX);
            const padY = paddingForSize(size, state.paddingY);
            const lineH = size * lineHeightMultiplier;
            if (line.trim() === '') {
                if (manualLines.length === 1) wrapped.push({ text: ' ', size, padX, padY, lineH });
                return;
            }
            // Ancho disponible: la story menos el padding propio y un margen al borde
            // (igual al padding por defecto). Nunca menos del 40% de la story.
            const maxWidth = Math.max(STORY_W * 0.4, STORY_W - 2 * padX - 2 * paddingForSize(size, 100));
            wrapLine(line.trim(), maxWidth, size, style)
                .forEach(t => wrapped.push({ text: t, size, padX, padY, lineH }));
        });
        if (wrapped.length === 0) return;

        // 2. Construir cada línea real y medirla.
        const lines = wrapped.map(w => {
            const built = buildLine(w.text, w.size, style);
            measureLayer.appendChild(built.el);
            let width = visualWidth(built, style);
            if (w.text.trim() === '') width = Math.max(width, w.size * 0.5); // placeholder vacío
            return { ...w, ...built, width };
        });

        // 3. Layout: bloque centrado en la story; cada línea alineada dentro del bloque.
        // Con alineación izquierda/derecha todas las líneas usan el MISMO padding
        // horizontal (el mayor): si cada una usara el suyo (proporcional a su tamaño),
        // el texto arrancaría en x distintas y no quedaría alineado.
        const alignedPad = Math.max(...lines.map(l => l.padX));
        lines.forEach(l => { l.hpad = state.align === 'center' ? l.padX : alignedPad; });
        const blockW = Math.min(STORY_W, Math.max(...lines.map(l => l.width + 2 * l.hpad)));
        const topPad = lines[0].padY;
        const bottomPad = lines[lines.length - 1].padY;
        const totalH = lines.reduce((sum, l) => sum + l.lineH, 0) + topPad + bottomPad;
        const blockX = (STORY_W - blockW) / 2;
        let cursorY = (STORY_H - totalH) / 2 + topPad;

        lines.forEach(l => {
            l.centerY = cursorY + l.lineH / 2;
            cursorY += l.lineH;
            if (state.align === 'left') l.textX = blockX + l.hpad;
            else if (state.align === 'right') l.textX = blockX + blockW - l.hpad - l.width;
            else l.textX = STORY_W / 2 - l.width / 2;
        });

        // 4. Fondo continuo.
        if (!state.transparentBg) {
            const r = state.borderRadius;
            const rects = lines.map((l, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === lines.length - 1;
                const baseHalfHeight = l.size * 0.22;
                const ascenderExtra = hasAscenders(l.text) ? l.size * 0.12 : 0;
                const descenderExtra = hasDescenders(l.text) ? l.size * 0.08 : 0;
                let top = l.centerY - l.lineH / 2;
                let bottom = l.centerY + l.lineH / 2;
                if (isFirst) top = l.centerY - baseHalfHeight - ascenderExtra - l.padY;
                if (isLast) bottom = l.centerY + baseHalfHeight + descenderExtra + l.padY;
                let shiftLeft = l.textX - l.hpad;
                let shiftRight = l.textX + l.width + l.hpad;
                // Los emoji-imagen llenan su caja sin side-bearing: dar un respiro
                // similar al del texto del otro lado.
                if (l.startsWithImage) shiftLeft -= l.size * 0.08;
                if (l.endsWithImage) shiftRight += l.size * 0.08;
                return { shiftLeft, shiftRight, width: shiftRight - shiftLeft, top, bottom };
            });

            // Agrupación "same width": líneas de ancho casi igual comparten ancho
            // (evita escalones de pocos px donde no entran los arcos de radio r).
            // - Se compara contra el rango [min, max] de TODO el grupo, no sólo contra
            //   la línea anterior: si no, líneas que se ensanchan de a poco se
            //   encadenaban en un único bloque y se perdía la escalera.
            // - El umbral sale del radio y del tamaño real de las líneas (no del global).
            const groups = [];
            let group = [0];
            let gMin = rects[0].width, gMax = rects[0].width, gSize = lines[0].size;
            for (let i = 1; i < rects.length; i++) {
                const w = rects[i].width;
                const size = Math.min(gSize, lines[i].size);
                const threshold = Math.max(3, Math.min(r, size * 0.3));
                if (Math.max(gMax, w) - Math.min(gMin, w) < threshold) {
                    group.push(i);
                    gMin = Math.min(gMin, w);
                    gMax = Math.max(gMax, w);
                    gSize = size;
                } else {
                    groups.push(group);
                    group = [i];
                    gMin = gMax = w;
                    gSize = lines[i].size;
                }
            }
            groups.push(group);
            groups.forEach(g => {
                if (g.length <= 1) return;
                const maxW = Math.max(...g.map(i => rects[i].width));
                g.forEach(i => {
                    const rect = rects[i];
                    if (state.align === 'right') rect.shiftLeft = rect.shiftRight - maxW;
                    else if (state.align === 'left') rect.shiftRight = rect.shiftLeft + maxW;
                    else {
                        const center = (rect.shiftLeft + rect.shiftRight) / 2;
                        rect.shiftLeft = center - maxW / 2;
                        rect.shiftRight = center + maxW / 2;
                    }
                    rect.width = maxW;
                });
            });

            // Clamp al ancho de la story, al final, con ancho y posición definitivos.
            rects.forEach(rect => {
                if (rect.shiftLeft < 0) { rect.shiftRight -= rect.shiftLeft; rect.shiftLeft = 0; }
                if (rect.shiftRight > STORY_W) { rect.shiftLeft -= rect.shiftRight - STORY_W; rect.shiftRight = STORY_W; }
                rect.shiftLeft = Math.max(0, rect.shiftLeft);
            });

            content.appendChild(svgEl('path', {
                d: buildBackgroundPath(rects, r),
                fill: hexToRgba(state.bgColor, state.bgOpacity / 100)
            }));
        }

        // 5. Texto (mover las líneas ya medidas a su lugar).
        lines.forEach(l => {
            l.el.setAttribute('x', l.textX);
            l.el.setAttribute('y', l.centerY);
            l.el.setAttribute('fill', state.textColor);
            content.appendChild(l.el);
        });

        // 6. Emoji-imagen: con el texto en su lugar, medir cada hueco y superponer la imagen.
        lines.forEach(l => {
            l.images.forEach(img => {
                // Banderas todavía cargándose: el hueco queda reservado y la imagen
                // aparece en el próximo render.
                if (!img.dataURI) return;
                let startX, endX;
                try {
                    startX = img.tspan.getStartPositionOfChar(0).x;
                    endX = img.tspan.getEndPositionOfChar(0).x;
                } catch (e) {
                    return;
                }
                const w = Math.max(endX - startX, img.reserved);
                const h = w / img.aspect;
                const imageEl = svgEl('image', {
                    x: startX,
                    y: l.centerY - h / 2,
                    width: w,
                    height: h,
                    preserveAspectRatio: 'xMidYMid meet',
                    href: img.dataURI
                });
                // xlink:href para compatibilidad con la rasterización del export.
                imageEl.setAttributeNS(XLINK_NS, 'xlink:href', img.dataURI);
                content.appendChild(imageEl);
            });
        });
    }

    function setOffset(x, y) {
        content.setAttribute('transform', `translate(${x} ${y})`);
    }

    return {
        render,
        setOffset,
        clearMeasureCache: () => measureCache.clear(),
        content
    };
}
