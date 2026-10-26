import { blobToDataURL } from './storage.js';

// Registro ÚNICO de fuentes. De acá salen: las @font-face locales, el <link> de
// Google Fonts, la lista del selector, el font-family del render y el embebido
// de la fuente en el PNG exportado.
//   file        → fuente local del repo (Fonts/…), con el peso/estilo REAL del archivo
//   google      → se carga de Google Fonts (variable cuando weights es un rango)
//   (ninguno)   → fuente del sistema (Courier New, Comic Sans…)
//   weights     → [min, max] de pesos REALES que tiene la fuente
//   textWeight  → peso por defecto (el que usa Instagram para ese estilo)
// Por encima del peso real máximo, el peso se simula con un contorno (ver resolveWeight).
export const FONTS = [
    { id: 'classic', label: 'Classic', family: 'Proxima-Nova-Semibold', fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      file: 'Fonts/Proxima-Nova-Semibold.ttf', format: 'truetype', style: 'normal', weights: [600, 600], textWeight: 600 },
    { id: 'modern', label: 'Modern', family: 'Aveny-T', fallback: 'sans-serif',
      file: 'Fonts/Aveny-T.ttf', format: 'truetype', style: 'normal', weights: [400, 400], textWeight: 400 },
    { id: 'neon', label: 'Neon', family: 'CosmopolitanScript', fallback: 'sans-serif',
      file: 'Fonts/CosmopolitanScriptRegular.otf', format: 'opentype', style: 'normal', weights: [400, 400], textWeight: 400 },
    { id: 'typewriter', label: 'Typewriter', family: 'Courier New', fallback: 'monospace', weights: [400, 400], textWeight: 400 },
    { id: 'strong', label: 'Strong', family: 'Bebas Neue', fallback: 'Impact, "Arial Black", sans-serif', google: true, weights: [400, 400], textWeight: 400 },
    { id: 'google-sans', label: 'Google Sans', family: 'Google Sans', fallback: 'Roboto, sans-serif', google: true, weights: [400, 700], textWeight: 600 },
    { id: 'montserrat', label: 'Montserrat', family: 'Montserrat', fallback: 'sans-serif', google: true, weights: [100, 900], textWeight: 600 },
    { id: 'playfair', label: 'Playfair Display', family: 'Playfair Display', fallback: 'Georgia, serif', google: true, weights: [400, 900], textWeight: 600 },
    { id: 'comic-sans', label: 'Comic Sans', family: 'Comic Sans MS', fallback: '"Comic Sans", cursive', weights: [400, 400], textWeight: 400 },
    { id: 'google-sans-code', label: 'Google Sans Code', family: 'Google Sans Code', fallback: '"Courier New", monospace', google: true, weights: [300, 800], textWeight: 600 },
    { id: 'meow-script', label: 'Meow Script', family: 'Meow Script', fallback: 'cursive', google: true, weights: [400, 400], textWeight: 400 },
    { id: 'sf-pro-display-black-italic', label: 'SF Pro Display Black Italic', family: 'SF-Pro-Display-BlackItalic', fallback: '-apple-system, BlinkMacSystemFont, sans-serif',
      file: 'Fonts/SF-Pro-Display-BlackItalic.otf', format: 'opentype', style: 'italic', weights: [900, 900], textWeight: 900 },
];
const FONT_BY_ID = new Map(FONTS.map(f => [f.id, f]));

export const WEIGHT_MAX = 900;

const MIME_BY_FORMAT = { truetype: 'font/ttf', opentype: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };

function googleFamilyParam(f) {
    const name = encodeURIComponent(f.family).replace(/%20/g, '+');
    const [min, max] = f.weights;
    return min < max ? `${name}:wght@${min}..${max}` : name;
}

// Registrar las fuentes locales y Google Fonts en la página (una sola vez, al importar).
(function installFonts() {
    const css = FONTS.filter(f => f.file).map(f =>
        `@font-face{font-family:'${f.family}';src:url('${f.file}') format('${f.format}');font-weight:${f.weights[0]};font-style:${f.style};}`
    ).join('\n');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Rango wght@min..max → Chrome recibe la fuente VARIABLE (todos los pesos en un archivo).
    const families = FONTS.filter(f => f.google).map(f => 'family=' + googleFamilyParam(f));
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
    document.head.appendChild(link);
})();

// ---- Fuente personalizada (subida por el usuario) -----------------------------
let customFont = null; // { name, family, dataURL, format, face }

export function getCustomFont() { return customFont; }

export async function loadCustomFont(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const format = { otf: 'opentype', woff: 'woff', woff2: 'woff2' }[ext] || 'truetype';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    // El nombre termina dentro de CSS: sólo caracteres seguros.
    const family = 'CustomFont-' + (baseName.replace(/[^\w\- ]+/g, '').trim() || 'font');
    const buffer = await file.arrayBuffer();
    const face = new FontFace(family, buffer);
    await face.load(); // rechaza si el archivo no es una fuente válida
    if (customFont && customFont.face) document.fonts.delete(customFont.face);
    document.fonts.add(face);
    const dataURL = await blobToDataURL(new Blob([buffer], { type: MIME_BY_FORMAT[format] }));
    customFont = { name: baseName, family, dataURL, format, face };
    return customFont;
}

// ---- Fuentes del sistema (Local Font Access API) -------------------------------
let systemFamilies = null;
let systemFontsPromise = null;
const systemWeights = new Map(); // family -> pesos reales instalados (ordenados)

export function getSystemFamilies() { return systemFamilies || []; }

// Peso a partir del nombre de estilo ("Bold Italic", "SemiBold", "Black"…).
// El orden importa: "extrabold" antes que "bold", "semibold" antes que "bold".
const STYLE_WEIGHTS = [
    [/thin|hairline/, 100], [/extra ?light|ultra ?light/, 200], [/light/, 300],
    [/medium/, 500], [/semi ?bold|demi ?bold/, 600], [/extra ?bold|ultra ?bold/, 800],
    [/black|heavy/, 900], [/bold/, 700]
];
function weightFromStyle(style) {
    const s = (style || '').toLowerCase();
    for (const [re, w] of STYLE_WEIGHTS) if (re.test(s)) return w;
    return 400;
}

// Requiere gesto del usuario la primera vez (Chrome/Edge de escritorio, https o localhost).
export function loadSystemFonts() {
    if (systemFontsPromise) return systemFontsPromise;
    if (typeof window.queryLocalFonts !== 'function') {
        return Promise.reject(new Error('unsupported'));
    }
    systemFontsPromise = window.queryLocalFonts()
        .then(fonts => {
            fonts.forEach(f => {
                const set = systemWeights.get(f.family) || new Set();
                set.add(weightFromStyle(f.style));
                systemWeights.set(f.family, set);
            });
            systemFamilies = [...systemWeights.keys()].sort((a, b) => a.localeCompare(b));
            return systemFamilies;
        })
        .catch(err => {
            systemFontsPromise = null; // permitir reintentar
            throw err;
        });
    return systemFontsPromise;
}

// ---- Resolución de fontId -------------------------------------------------------
// fontId: id del registro | 'sys:<Family>' | 'custom'

export function getFontFamily(fontId) {
    if (fontId && fontId.startsWith('sys:')) return `"${fontId.slice(4)}", sans-serif`;
    if (fontId === 'custom') return customFont ? `"${customFont.family}", sans-serif` : 'Arial, sans-serif';
    const f = FONT_BY_ID.get(fontId) || FONTS[0];
    return `"${f.family}", ${f.fallback}`;
}

export function getFontLabel(fontId) {
    if (fontId && fontId.startsWith('sys:')) return fontId.slice(4);
    if (fontId === 'custom') return customFont ? `Custom: ${customFont.name}` : 'Custom font';
    const f = FONT_BY_ID.get(fontId);
    return f ? f.label : fontId;
}

export function isKnownFontId(fontId) {
    return FONT_BY_ID.has(fontId) || fontId === 'custom' || (typeof fontId === 'string' && fontId.startsWith('sys:'));
}

// Pesos reales de una fuente: { variable: [min, max] } o { faces: [w1, w2, …] }.
function realWeightsOf(fontId) {
    const f = FONT_BY_ID.get(fontId);
    if (f) {
        const [min, max] = f.weights;
        return min < max ? { variable: f.weights, def: f.textWeight } : { faces: [min], def: f.textWeight };
    }
    if (fontId && fontId.startsWith('sys:')) {
        const set = systemWeights.get(fontId.slice(4));
        const faces = set ? [...set].sort((a, b) => a - b) : [400];
        const def = faces.includes(400) ? 400 : faces.reduce((b, w) => (Math.abs(w - 400) < Math.abs(b - 400) ? w : b));
        return { faces, def };
    }
    return { faces: [400], def: 400 }; // custom: una sola cara, declarada como normal
}

// Traduce el peso pedido (null = default de la fuente) a:
//   real      → peso CSS a pedir (siempre uno que la fuente tiene: nunca faux bold)
//   simulated → unidades de peso que faltan, que se dibujan con un contorno
//   min       → el slider no puede bajar del peso real más fino
export function resolveWeight(fontId, requested) {
    const info = realWeightsOf(fontId);
    const min = info.variable ? info.variable[0] : info.faces[0];
    const weight = Math.min(WEIGHT_MAX, Math.max(min, requested == null ? info.def : requested));
    let real;
    if (info.variable) {
        real = Math.min(weight, info.variable[1]);
    } else {
        // Cara instalada más gruesa que no supere el peso pedido.
        real = info.faces.filter(w => w <= weight).pop();
    }
    return { weight, real, simulated: weight - real, min, def: info.def, isDefault: requested == null };
}

// Espera (con tope) a que la fuente esté lista antes de medir, para no cachear
// mediciones tomadas con la fuente fallback.
export function ensureFontLoaded(fontId, weight, timeoutMs = 800) {
    const primary = getFontFamily(fontId).split(',')[0].trim();
    return Promise.race([
        document.fonts.load(`${weight} 40px ${primary}`).catch(() => {}),
        new Promise(resolve => setTimeout(resolve, timeoutMs))
    ]);
}

// ---- Embebido para el export ----------------------------------------------------
// Un SVG cargado como <img> no puede pedir recursos externos: la fuente activa
// tiene que ir como data URI. Se cachea por fuente: las de Google se embeben como
// fuente variable, así un solo archivo sirve para cualquier peso.
const embedCache = new Map();

async function fetchDataURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
    return blobToDataURL(await res.blob());
}

async function buildLocalFontCSS(f) {
    const dataURL = await fetchDataURL(f.file);
    return `@font-face{font-family:'${f.family}';src:url(${dataURL}) format('${f.format}');font-weight:${f.weights[0]};font-style:${f.style};}`;
}

async function buildGoogleFontCSS(f) {
    const res = await fetch(`https://fonts.googleapis.com/css2?family=${googleFamilyParam(f)}&display=swap`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cssText = await res.text();
    const blocks = [...cssText.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]);
    // Reemplazar cada url(...) por su data URI, conservando unicode-range y pesos.
    const embedded = await Promise.all(blocks.map(async block => {
        const urlMatch = block.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (!urlMatch) return '';
        const dataURL = await fetchDataURL(urlMatch[1]);
        return block.replace(urlMatch[0], `url(${dataURL})`);
    }));
    return embedded.join('\n');
}

export function getEmbeddedFontCSS(fontId) {
    if (fontId === 'custom') {
        return Promise.resolve(customFont
            ? `@font-face{font-family:'${customFont.family}';src:url(${customFont.dataURL}) format('${customFont.format}');}`
            : '');
    }
    const f = FONT_BY_ID.get(fontId);
    // Fuentes del sistema: el SVG rasterizado las resuelve por nombre.
    if (!f || (!f.file && !f.google)) return Promise.resolve('');
    if (!embedCache.has(fontId)) {
        const p = (f.file ? buildLocalFontCSS(f) : buildGoogleFontCSS(f))
            .catch(err => {
                console.warn(`No se pudo embeber la fuente "${f.family}":`, err);
                embedCache.delete(fontId); // reintentar en la próxima descarga
                return '';
            });
        embedCache.set(fontId, p);
    }
    return embedCache.get(fontId);
}
