import { isKnownFontId } from './fonts.js';

// Estado completo del editor. Es la única fuente de verdad: la UI se sincroniza
// desde acá, el render lo lee, y presets/autosave/undo son snapshots de este objeto.
export const DEFAULTS = Object.freeze({
    text: 'First line\nSecond line ✌️',
    fontId: 'classic',
    textColor: '#000000',
    bgColor: '#ffffff',
    bgOpacity: 100,
    fontSize: 33,
    lineHeight: 120,
    letterSpacing: 0,
    borderRadius: 10,
    paddingX: 100,
    paddingY: 100,
    bold: false,
    italic: false,
    transparentBg: false,
    align: 'center',
    safeZones: 'none',
    perLineScales: [],
    offsetX: 0,
    offsetY: 0,
    textToFilename: false
});

// Claves que no forman parte de un preset (preferencias de la sesión).
const NON_PRESET_KEYS = ['textToFilename'];

// Nombres de claves de presets guardados por la versión anterior.
const LEGACY_KEYS = {
    textStyle: 'fontId',
    textAlign: 'align'
};

// Tamaño por línea: se guarda como ESCALA relativa al tamaño global (null = 1×),
// así el slider global escala todas las líneas proporcionalmente.
export const LINE_SIZE_MIN = 8;
export const LINE_SIZE_MAX = 135;

export function lineSize(state, i) {
    const scale = state.perLineScales[i];
    if (scale == null) return state.fontSize;
    return Math.min(LINE_SIZE_MAX, Math.max(LINE_SIZE_MIN, Math.round(state.fontSize * scale)));
}

export function scaleForSize(state, size) {
    return Math.round((size / state.fontSize) * 10000) / 10000;
}

const NUMBER_RANGES = {
    bgOpacity: [0, 100],
    fontSize: [15, 90],
    lineHeight: [80, 200],
    letterSpacing: [-5, 20],
    borderRadius: [1, 25],
    paddingX: [0, 300],
    paddingY: [0, 300],
    offsetX: [-1000, 1000],
    offsetY: [-1000, 1000]
};
const HEX_RE = /^#[0-9a-f]{6}$/i;

// Valida y completa un objeto de estado (o un preset viejo): números como
// números, rangos acotados, valores desconocidos → default.
export function normalizeState(input) {
    const src = {};
    if (input && typeof input === 'object') {
        for (const [k, v] of Object.entries(input)) src[LEGACY_KEYS[k] || k] = v;
    }
    // Versión anterior: tamaños por línea absolutos (px) → escalas.
    if (src.perLineScales === undefined && Array.isArray(src.perLineSizes)) {
        const base = Number(src.fontSize) || DEFAULTS.fontSize;
        src.perLineScales = src.perLineSizes.map(x => (x == null || !(Number(x) > 0) ? null : Number(x) / base));
    }
    const out = {};
    for (const [key, def] of Object.entries(DEFAULTS)) {
        let v = src[key];
        if (v === undefined || v === null || v === '') { out[key] = Array.isArray(def) ? [] : def; continue; }
        if (key in NUMBER_RANGES) {
            const n = Number(v);
            const [min, max] = NUMBER_RANGES[key];
            out[key] = Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : def;
        } else if (typeof def === 'boolean') {
            out[key] = v === true || v === 'true';
        } else if (key === 'perLineScales') {
            out[key] = Array.isArray(v) ? v.map(x => (x == null || !(Number(x) > 0) ? null : Math.min(9, Number(x)))) : [];
        } else if (key === 'textColor' || key === 'bgColor') {
            out[key] = HEX_RE.test(v) ? v.toLowerCase() : def;
        } else if (key === 'align') {
            out[key] = ['left', 'center', 'right'].includes(v) ? v : def;
        } else if (key === 'safeZones') {
            out[key] = ['none', 'organic', 'paid'].includes(v) ? v : def;
        } else if (key === 'fontId') {
            out[key] = isKnownFontId(v) ? v : def;
        } else {
            out[key] = String(v);
        }
    }
    return out;
}

export function toPreset(state) {
    const preset = JSON.parse(JSON.stringify(state));
    NON_PRESET_KEYS.forEach(k => delete preset[k]);
    return preset;
}

// Reasigna los valores por línea cuando cambia el texto, para que cada override
// siga a SU línea (antes iban por índice: insertar una línea arriba los corría).
// Prefijo y sufijo de líneas idénticas conservan su valor; las del medio
// (editadas, partidas o unidas) heredan en orden.
export function remapPerLine(oldText, newText, sizes) {
    const a = oldText.split('\n');
    const b = newText.split('\n');
    const get = i => (sizes[i] == null ? null : sizes[i]);
    if (a.length === b.length) return b.map((_, i) => get(i));
    let pre = 0;
    while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
    let suf = 0;
    while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
    const out = new Array(b.length).fill(null);
    for (let i = 0; i < pre; i++) out[i] = get(i);
    for (let j = 0; j < suf; j++) out[b.length - 1 - j] = get(a.length - 1 - j);
    const mid = Math.min(a.length - pre - suf, b.length - pre - suf);
    for (let k = 0; k < mid; k++) out[pre + k] = get(pre + k);
    return out;
}

// Historial de undo/redo basado en snapshots JSON del estado.
export function createHistory(limit = 100) {
    const stack = [];
    let index = -1;
    return {
        // Registra el snapshot si difiere del actual (descarta el "futuro" de redo).
        record(state) {
            const snap = JSON.stringify(state);
            if (stack[index] === snap) return false;
            stack.splice(index + 1);
            stack.push(snap);
            if (stack.length > limit) stack.shift();
            index = stack.length - 1;
            return true;
        },
        undo() { return index > 0 ? JSON.parse(stack[--index]) : null; },
        redo() { return index < stack.length - 1 ? JSON.parse(stack[++index]) : null; },
        canUndo() { return index > 0; },
        canRedo() { return index < stack.length - 1; }
    };
}
