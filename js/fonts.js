import { blobToDataURL } from './storage.js';

// Registro ÚNICO de fuentes. De acá salen: las @font-face locales, el <link> de
// Google Fonts, la lista del selector, el font-family del render y el embebido
// de la fuente en el PNG exportado.
//   file       → fuente local del repo (Fonts/…), con el peso/estilo REAL del archivo
//   google     → pesos disponibles en Google Fonts
//   (ninguno)  → fuente del sistema (Courier New, Comic Sans…)
//   textWeight → peso con el que se dibuja el texto sin "Bold". Tiene que existir
//                en la fuente: si se pide 600 a una fuente que sólo tiene Regular,
//                el navegador la engrosa artificialmente (faux bold) y deja de
//                verse como en Instagram.
export const FONTS = [
    { id: 'classic', label: 'Classic', family: 'Proxima-Nova-Semibold', fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      file: 'Fonts/Proxima-Nova-Semibold.ttf', format: 'truetype', weight: 600, style: 'normal', textWeight: 600 },
    { id: 'modern', label: 'Modern', family: 'Aveny-T', fallback: 'sans-serif',
      file: 'Fonts/Aveny-T.ttf', format: 'truetype', weight: 400, style: 'normal', textWeight: 400 },
    { id: 'neon', label: 'Neon', family: 'CosmopolitanScript', fallback: 'sans-serif',
      file: 'Fonts/CosmopolitanScriptRegular.otf', format: 'opentype', weight: 400, style: 'normal', textWeight: 400 },
    { id: 'typewriter', label: 'Typewriter', family: 'Courier New', fallback: 'monospace', textWeight: 400 },
    { id: 'strong', label: 'Strong', family: 'Bebas Neue', fallback: 'Impact, "Arial Black", sans-serif', google: [400], textWeight: 400 },
    { id: 'google-sans', label: 'Google Sans', family: 'Google Sans', fallback: 'Roboto, sans-serif', google: [400, 600, 700], textWeight: 600 },
    { id: 'montserrat', label: 'Montserrat', family: 'Montserrat', fallback: 'sans-serif', google: [400, 600, 700], textWeight: 600 },
    { id: 'playfair', label: 'Playfair Display', family: 'Playfair Display', fallback: 'Georgia, serif', google: [400, 600, 700], textWeight: 600 },
    { id: 'comic-sans', label: 'Comic Sans', family: 'Comic Sans MS', fallback: '"Comic Sans", cursive', textWeight: 400 },
    { id: 'google-sans-code', label: 'Google Sans Code', family: 'Google Sans Code', fallback: '"Courier New", monospace', google: [400, 600, 700], textWeight: 600 },
    { id: 'meow-script', label: 'Meow Script', family: 'Meow Script', fallback: 'cursive', google: [400], textWeight: 400 },
    { id: 'sf-pro-display-black-italic', label: 'SF Pro Display Black Italic', family: 'SF-Pro-Display-BlackItalic', fallback: '-apple-system, BlinkMacSystemFont, sans-serif',
      file: 'Fonts/SF-Pro-Display-BlackItalic.otf', format: 'opentype', weight: 900, style: 'italic', textWeight: 900 },
];
const FONT_BY_ID = new Map(FONTS.map(f => [f.id, f]));

// Peso de dibujo: el propio de la fuente, o 700 con "Bold". Fuentes del sistema
// y custom: Regular.
export function getTextWeight(fontId, bold) {
    if (bold) return 700;
    const f = FONT_BY_ID.get(fontId);
    return f ? f.textWeight : 400;
}

const MIME_BY_FORMAT = { truetype: 'font/ttf', opentype: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };

function googleCssUrl(family, weights) {
    return `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${weights.join(';')}&display=swap`;
}

// Registrar las fuentes locales y Google Fonts en la página (una sola vez, al importar).
(function installFonts() {
    const css = FONTS.filter(f => f.file).map(f =>
        `@font-face{font-family:'${f.family}';src:url('${f.file}') format('${f.format}');font-weight:${f.weight};font-style:${f.style};}`
    ).join('\n');
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const families = FONTS.filter(f => f.google)
        .map(f => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}${f.google.length > 1 ? ':wght@' + f.google.join(';') : ''}`);
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

export function getSystemFamilies() { return systemFamilies || []; }

// Requiere gesto del usuario la primera vez (Chrome/Edge de escritorio, https o localhost).
export function loadSystemFonts() {
    if (systemFontsPromise) return systemFontsPromise;
    if (typeof window.queryLocalFonts !== 'function') {
        return Promise.reject(new Error('unsupported'));
    }
    systemFontsPromise = window.queryLocalFonts()
        .then(fonts => {
            systemFamilies = [...new Set(fonts.map(f => f.family))].sort((a, b) => a.localeCompare(b));
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
// tiene que ir como data URI. Se cachea por fuente+peso (antes se descargaban y
// convertían las 4 fuentes locales en cada descarga).
const embedCache = new Map();

function nearestWeight(available, requested) {
    return available.reduce((best, w) => Math.abs(w - requested) < Math.abs(best - requested) ? w : best, available[0]);
}

async function fetchDataURL(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} (${url})`);
    return blobToDataURL(await res.blob());
}

async function buildLocalFontCSS(f) {
    const dataURL = await fetchDataURL(f.file);
    return `@font-face{font-family:'${f.family}';src:url(${dataURL}) format('${f.format}');font-weight:${f.weight};font-style:${f.style};}`;
}

async function buildGoogleFontCSS(f, weight) {
    const res = await fetch(googleCssUrl(f.family, [weight]));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const cssText = await res.text();
    const blocks = [...cssText.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]);
    // Reemplazar cada url(...) por su data URI, conservando unicode-range y peso.
    const embedded = await Promise.all(blocks.map(async block => {
        const urlMatch = block.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (!urlMatch) return '';
        const dataURL = await fetchDataURL(urlMatch[1]);
        return block.replace(urlMatch[0], `url(${dataURL})`);
    }));
    return embedded.join('\n');
}

export function getEmbeddedFontCSS(fontId, bold) {
    if (fontId === 'custom') {
        return Promise.resolve(customFont
            ? `@font-face{font-family:'${customFont.family}';src:url(${customFont.dataURL}) format('${customFont.format}');}`
            : '');
    }
    const f = FONT_BY_ID.get(fontId);
    // Fuentes del sistema: el SVG rasterizado las resuelve por nombre.
    if (!f || (!f.file && !f.google)) return Promise.resolve('');
    const weight = f.google ? nearestWeight(f.google, getTextWeight(fontId, bold)) : f.weight;
    const key = `${fontId}|${weight}`;
    if (!embedCache.has(key)) {
        const p = (f.file ? buildLocalFontCSS(f) : buildGoogleFontCSS(f, weight))
            .catch(err => {
                console.warn(`No se pudo embeber la fuente "${f.family}":`, err);
                embedCache.delete(key); // reintentar en la próxima descarga
                return '';
            });
        embedCache.set(key, p);
    }
    return embedCache.get(key);
}
