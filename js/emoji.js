import { IMAGE_EMOJIS } from './emoji-data.js';

export const IMAGE_EMOJI_BY_CHAR = {};
IMAGE_EMOJIS.forEach(e => { IMAGE_EMOJI_BY_CHAR[e.char] = e; });
const SENTINEL_CLASS = '[' + IMAGE_EMOJIS.map(e => e.char).join('') + ']';

// Emojis: \p{RGI_Emoji} (flag v) reconoce secuencias completas (ZWJ, tonos de piel,
// keycaps, banderas) y todos los rangos nuevos (🫠 🩷 ⭐ ⌛ …), que el regex por
// rangos anterior se salteaba. Fallback para navegadores sin flag v.
let EMOJI_SRC, EMOJI_FLAGS;
try {
    new RegExp('\\p{RGI_Emoji}', 'v');
    EMOJI_SRC = '\\p{RGI_Emoji}';
    EMOJI_FLAGS = 'gv';
} catch (e) {
    EMOJI_SRC = '(?:\\p{Regional_Indicator}{2}|[#*0-9]\\uFE0F?\\u20E3|\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?(?:\\u200D\\p{Extended_Pictographic}(?:\\uFE0F|\\p{Emoji_Modifier})?)*)';
    EMOJI_FLAGS = 'gu';
}
// Centinelas de emoji-imagen o emojis (en ese orden de prioridad).
const TOKEN_RE = new RegExp(`${SENTINEL_CLASS}|${EMOJI_SRC}`, EMOJI_FLAGS);

const isRegionalIndicator = cp => cp >= 0x1F1E6 && cp <= 0x1F1FF;

// Par de indicadores regionales = bandera de país.
export function isCountryFlag(str) {
    const cps = [...str];
    return cps.length === 2 && isRegionalIndicator(cps[0].codePointAt(0)) && isRegionalIndicator(cps[1].codePointAt(0));
}

// ---- Banderas como imágenes (Twemoji) -------------------------------------
// En Windows, Chrome/Edge NO renderizan los emojis de bandera: la fuente del
// sistema muestra las dos letras del país (US, AR, …). Se dibujan como imagen
// del set Twemoji, calculando el archivo desde los codepoints.
const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/';

export function flagTwemojiUrl(flag) {
    return TWEMOJI_BASE + [...flag].map(ch => ch.codePointAt(0).toString(16)).join('-') + '.svg';
}

// emoji -> 'data:...' (listo) | 'failed'. El preview/export necesita data URI
// embebido: un <image> con href externo no se rasteriza al exportar.
const flagDataURICache = new Map();
const flagPromiseCache = new Map();
const flagLoadedListeners = new Set();

export function onFlagLoaded(fn) { flagLoadedListeners.add(fn); }

// Re-render coalescido: muchas banderas resolviéndose juntas colapsan en uno.
let flagNotifyScheduled = false;
function notifyFlagLoaded() {
    if (flagNotifyScheduled) return;
    flagNotifyScheduled = true;
    requestAnimationFrame(() => {
        flagNotifyScheduled = false;
        flagLoadedListeners.forEach(fn => fn());
    });
}

export function loadFlag(flag) {
    if (flagPromiseCache.has(flag)) return flagPromiseCache.get(flag);
    const p = fetch(flagTwemojiUrl(flag))
        .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(svgText => {
            const dataURI = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
            flagDataURICache.set(flag, dataURI);
            return dataURI;
        })
        .catch(err => {
            console.warn('No se pudo cargar la bandera Twemoji', flag, err);
            flagDataURICache.set(flag, 'failed');
            return null;
        });
    flagPromiseCache.set(flag, p);
    return p;
}

// Una bandera que falló (offline) se dibuja como texto, sin dejar hueco.
export function isFlagUsable(flag) { return flagDataURICache.get(flag) !== 'failed'; }

// Síncrono para el render: data URI si ya está; si no, dispara la descarga y
// un re-render cuando llegue.
export function getFlagDataURI(flag) {
    const cached = flagDataURICache.get(flag);
    if (cached && cached !== 'failed') return cached;
    if (!cached) loadFlag(flag).then(notifyFlagLoaded);
    return null;
}

export function loadFlagsIn(text) {
    const flags = tokenize(text).filter(t => t.type === 'flag').map(t => t.flag);
    return Promise.all(flags.map(loadFlag));
}

// Al volver la conexión, reintentar las banderas que fallaron.
window.addEventListener('online', () => {
    let retried = false;
    for (const [flag, v] of flagDataURICache) {
        if (v === 'failed') {
            flagDataURICache.delete(flag);
            flagPromiseCache.delete(flag);
            retried = true;
        }
    }
    if (retried) notifyFlagLoaded();
});

// ---- Tokenizado -----------------------------------------------------------
// Divide un string en partes: texto, emoji de fuente, emoji-imagen o bandera.
export function tokenize(str) {
    const out = [];
    let last = 0;
    TOKEN_RE.lastIndex = 0;
    let m;
    while ((m = TOKEN_RE.exec(str)) !== null) {
        if (m[0] === '') { TOKEN_RE.lastIndex++; continue; }
        if (m.index > last) out.push({ type: 'text', text: str.slice(last, m.index) });
        const tok = m[0];
        const spec = IMAGE_EMOJI_BY_CHAR[tok];
        if (spec) out.push({ type: 'image', text: tok, spec });
        else if (isCountryFlag(tok) && isFlagUsable(tok)) out.push({ type: 'flag', text: tok, flag: tok });
        else out.push({ type: 'emoji', text: tok });
        last = m.index + tok.length;
    }
    if (last < str.length) out.push({ type: 'text', text: str.slice(last) });
    return out;
}

export function stripEmoji(str) {
    TOKEN_RE.lastIndex = 0;
    return str.replace(TOKEN_RE, '');
}

// Clave estable de un emoji para cruzarlo con los datos de búsqueda
// (codepoints en hex mayúscula, sin variation selector FE0F).
export function emojiKey(emoji) {
    return [...emoji].map(ch => ch.codePointAt(0)).filter(cp => cp !== 0xFE0F)
        .map(cp => cp.toString(16).toUpperCase()).join('-');
}
