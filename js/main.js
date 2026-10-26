import { getFontFamily, resolveWeight, ensureFontLoaded, loadCustomFont, getCustomFont, getEmbeddedFontCSS } from './fonts.js';
import { onFlagLoaded, loadFlagsIn } from './emoji.js';
import { createRenderer, STORY_W, STORY_H } from './renderer.js';
import { DEFAULTS, normalizeState, toPreset, remapPerLine, createHistory, scaleForSize } from './state.js';
import { renderPNG, exportFilename, downloadBlob, copyPNGToClipboard } from './export.js';
import { readJSON, writeJSON, blobToDataURL } from './storage.js';
import { toast } from './ui/toast.js';
import { createPerLineSizes } from './ui/per-line-sizes.js';
import { createFontCombobox } from './ui/font-combobox.js';
import { createPresets } from './ui/presets.js';
import { createEmojiPicker } from './ui/emoji-picker.js';

const AUTOSAVE_KEY = 'textEditorLastState';
const $ = id => document.getElementById(id);

// ---- Estado -------------------------------------------------------------------
const state = normalizeState(readJSON(AUTOSAVE_KEY, DEFAULTS));
const history = createHistory();
// La imagen de fondo vive sólo en memoria: en localStorage rompía la cuota.
let backgroundImage = null;

const svg = $('text-svg');
const renderer = createRenderer(svg);
const textInput = $('text-input');

// ---- Render (coalescido por frame) ---------------------------------------------
let renderQueued = false;
function renderNow() {
    renderQueued = false;
    renderer.render(state, getFontFamily(state.fontId));
}
function scheduleRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(renderNow);
}
// Las mediciones tomadas con la fuente fallback se invalidan cuando la real carga.
function remeasure() {
    renderer.clearMeasureCache();
    scheduleRender();
}
function waitForFont() {
    ensureFontLoaded(state.fontId, resolveWeight(state.fontId, state.weight).real).then(remeasure);
}

// ---- Historial + autoguardado ---------------------------------------------------
let commitTimer = null;
let commitPending = false;
function scheduleCommit() {
    commitPending = true;
    clearTimeout(commitTimer);
    commitTimer = setTimeout(commit, 400);
    syncHistoryButtons();
}
function commit() {
    clearTimeout(commitTimer);
    if (!commitPending) return;
    commitPending = false;
    history.record(state);
    writeJSON(AUTOSAVE_KEY, state);
    syncHistoryButtons();
}

function update(patch) {
    const fontChanged = 'fontId' in patch || 'weight' in patch || 'italic' in patch;
    Object.assign(state, patch);
    syncUI();
    scheduleRender();
    scheduleCommit();
    if (fontChanged) waitForFont();
}

// Reemplaza el estado completo (undo/redo, presets).
function replaceState(next) {
    Object.assign(state, normalizeState(next));
    perLine.invalidate();
    syncUI();
    waitForFont();
    scheduleRender();
}

function undo() {
    commit();
    const snap = history.undo();
    if (snap) { replaceState(snap); writeJSON(AUTOSAVE_KEY, state); syncHistoryButtons(); }
}
function redo() {
    commit();
    const snap = history.redo();
    if (snap) { replaceState(snap); writeJSON(AUTOSAVE_KEY, state); syncHistoryButtons(); }
}

const undoBtn = $('undo-btn');
const redoBtn = $('redo-btn');
function syncHistoryButtons() {
    undoBtn.disabled = !(history.canUndo() || commitPending);
    redoBtn.disabled = commitPending || !history.canRedo();
}
undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

// ---- Controles declarativos (control ↔ clave del estado) -----------------------
const CONTROLS = [
    { id: 'text-color', key: 'textColor' },
    { id: 'bg-color', key: 'bgColor' },
    { id: 'bg-opacity', key: 'bgOpacity', label: 'opacity-value', fmt: v => `${v}%` },
    { id: 'font-size', key: 'fontSize', label: 'font-size-value', fmt: v => `${v}px` },
    { id: 'line-height', key: 'lineHeight', label: 'line-height-value', fmt: v => (v / 100).toFixed(1) },
    { id: 'letter-spacing', key: 'letterSpacing', label: 'letter-spacing-value', fmt: v => `${v}px` },
    { id: 'border-radius', key: 'borderRadius', label: 'border-radius-value', fmt: v => `${v}px` },
    { id: 'padding-x', key: 'paddingX', label: 'padding-x-value', fmt: v => `${v}%` },
    { id: 'padding-y', key: 'paddingY', label: 'padding-y-value', fmt: v => `${v}%` },
    { id: 'italic', key: 'italic' },
    { id: 'transparent-bg', key: 'transparentBg' },
    { id: 'text-align', key: 'align' },
    { id: 'safe-zones-select', key: 'safeZones' },
    { id: 'text-to-filename', key: 'textToFilename' }
];
CONTROLS.forEach(c => {
    c.el = $(c.id);
    c.labelEl = c.label ? $(c.label) : null;
    const isCheckbox = c.el.type === 'checkbox';
    const isRange = c.el.type === 'range';
    c.el.addEventListener(isCheckbox || c.el.tagName === 'SELECT' ? 'change' : 'input', () => {
        const v = isCheckbox ? c.el.checked : isRange ? parseInt(c.el.value, 10) : c.el.value;
        update({ [c.key]: v });
    });
    // Doble click en un slider → valor por defecto.
    if (isRange) c.el.addEventListener('dblclick', () => update({ [c.key]: DEFAULTS[c.key] }));
});

// ---- Texto ----------------------------------------------------------------------
// Si el usuario nunca puso el cursor en el textarea, los emojis van al final.
let caretKnown = false;
['focus', 'pointerup', 'keyup', 'select'].forEach(t => textInput.addEventListener(t, () => { caretKnown = true; }));

textInput.addEventListener('input', () => {
    const text = textInput.value;
    update({ text, perLineScales: remapPerLine(state.text, text, state.perLineScales) });
});

function insertAtCursor(str) {
    const len = textInput.value.length;
    const start = caretKnown ? textInput.selectionStart : len;
    const end = caretKnown ? textInput.selectionEnd : len;
    textInput.setRangeText(str, start, end, 'end');
    caretKnown = true;
    textInput.dispatchEvent(new Event('input', { bubbles: true }));
}

// ---- Tamaño por línea -------------------------------------------------------------
const perLine = createPerLineSizes({
    group: $('per-line-size-group'),
    list: $('per-line-size-list'),
    onChange(index, size) {
        const scales = state.perLineScales.slice();
        scales[index] = size == null ? null : scaleForSize(state, size);
        update({ perLineScales: scales });
    }
});

// ---- Peso de la fuente ------------------------------------------------------------
// El rango arranca en el peso real más fino de la fuente. Por encima del más grueso
// real, el peso se simula (contorno): el label lo indica.
const weightSlider = $('font-weight');
const weightValue = $('font-weight-value');
weightSlider.addEventListener('input', () => update({ weight: parseInt(weightSlider.value, 10) }));
weightSlider.addEventListener('dblclick', () => update({ weight: null }));

function syncWeight() {
    const w = resolveWeight(state.fontId, state.weight);
    weightSlider.min = String(w.min);
    if (String(weightSlider.value) !== String(w.weight)) weightSlider.value = String(w.weight);
    const kind = w.simulated > 0 ? `simulated (real ${w.real})` : 'real';
    weightValue.textContent = `${w.weight} · ${kind}${w.isDefault ? ' · default' : ''}`;
    weightValue.classList.toggle('simulated', w.simulated > 0);
}

// ---- Fuentes ----------------------------------------------------------------------
const customFontGroup = $('custom-font-group');
const fontCombo = createFontCombobox({
    root: $('font-combobox'),
    input: $('font-search'),
    list: $('font-list'),
    hint: $('font-hint'),
    getValue: () => state.fontId,
    // Al cambiar de fuente, el peso vuelve al propio de esa fuente.
    onSelect: value => update({ fontId: value, weight: null })
});

$('custom-font-file').addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    loadCustomFont(file)
        .then(font => {
            renderer.clearMeasureCache();
            update({ fontId: 'custom', weight: null });
            toast(`Font "${font.name}" loaded`);
        })
        .catch(err => {
            console.error('Error loading custom font:', err);
            toast('That file is not a valid font (TTF, OTF, WOFF or WOFF2).', 'error');
        });
});

document.fonts.addEventListener('loadingdone', remeasure);
document.fonts.ready.then(remeasure);
onFlagLoaded(remeasure);

// ---- Imagen de fondo ----------------------------------------------------------------
const bgImageFile = $('bg-image-file');
const bgImagePreview = $('bg-image-preview');
const removeBgImageBtn = $('remove-bg-image');

// Recorta (cover, centrado) y escala a 1080×1920: igual a lo que muestra el
// preview con object-fit: cover, y liviano para el export de la story.
async function prepareBackground(file) {
    const bitmap = await createImageBitmap(file);
    const W = 1080, H = 1920;
    const scale = Math.max(W / bitmap.width, H / bitmap.height);
    const sw = W / scale, sh = H / scale;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.getContext('2d').drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, W, H);
    bitmap.close();
    const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
    const blob = await new Promise(resolve => canvas.toBlob(resolve, type, 0.92));
    return blobToDataURL(blob);
}

function setBackground(url) {
    backgroundImage = url;
    bgImagePreview.hidden = !url;
    removeBgImageBtn.hidden = !url;
    if (url) bgImagePreview.src = url;
    else bgImagePreview.removeAttribute('src');
}

bgImageFile.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    prepareBackground(file)
        .then(setBackground)
        .catch(err => {
            console.error('Error loading background image:', err);
            toast('Could not read that image.', 'error');
        });
});
removeBgImageBtn.addEventListener('click', () => {
    setBackground(null);
    bgImageFile.value = '';
});

// ---- Presets ------------------------------------------------------------------------
createPresets({
    select: $('preset-select'),
    saveBtn: $('save-preset-btn'),
    renameBtn: $('rename-preset-btn'),
    deleteBtn: $('delete-preset-btn'),
    toast,
    getSnapshot() {
        const preset = toPreset(state);
        const cf = getCustomFont();
        if (state.fontId === 'custom' && cf) preset.customFontName = cf.name;
        return preset;
    },
    apply(preset) {
        commit();
        // Presets de la versión anterior podían traer la imagen de fondo embebida.
        if (preset.backgroundImageUrl) setBackground(preset.backgroundImageUrl);
        replaceState({ ...preset, textToFilename: state.textToFilename });
        scheduleCommit();
        const cf = getCustomFont();
        if (state.fontId === 'custom' && (!cf || (preset.customFontName && cf.name !== preset.customFontName))) {
            toast(`This preset uses a custom font${preset.customFontName ? ` ("${preset.customFontName}")` : ''}: upload it again.`, 'warn', 4500);
        }
    }
});

// ---- Emojis -------------------------------------------------------------------------
createEmojiPicker({
    button: $('emoji-btn'),
    panel: $('emoji-panel'),
    search: $('emoji-search'),
    nav: $('emoji-nav'),
    sectionsEl: $('emoji-sections'),
    statusEl: $('emoji-status'),
    onPick: insertAtCursor,
    toast
});

// ---- Sincronización estado → UI -------------------------------------------------------
const safeZoneImgs = { organic: $('safe-zone-organic'), paid: $('safe-zone-paid') };
const centerBtn = $('center-btn');

function syncUI() {
    CONTROLS.forEach(c => {
        const v = state[c.key];
        if (c.el.type === 'checkbox') c.el.checked = v;
        else if (String(c.el.value) !== String(v)) c.el.value = v;
        if (c.labelEl) c.labelEl.textContent = c.fmt(v);
    });
    if (textInput.value !== state.text) {
        textInput.value = state.text;
        caretKnown = false;
    }
    fontCombo.sync();
    syncWeight();
    customFontGroup.hidden = state.fontId !== 'custom';
    perLine.update(state);
    Object.entries(safeZoneImgs).forEach(([k, img]) => { img.hidden = state.safeZones !== k; });
    centerBtn.disabled = !state.offsetX && !state.offsetY;
}

// ---- Arrastrar el texto (pointer events: mouse + touch + lápiz) ------------------------
// touch-action: none en el SVG evita que la página scrollee mientras se arrastra.
let drag = null;
svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    svg.setPointerCapture(e.pointerId);
    const rect = svg.getBoundingClientRect();
    // Unidades lógicas por px de pantalla (viewBox escalado con 'meet').
    const k = Math.max(STORY_W / rect.width, STORY_H / rect.height);
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: state.offsetX, oy: state.offsetY, k, moved: false };
});
svg.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const clamp = (v, max) => Math.max(-max, Math.min(max, Math.round(v)));
    drag.x = clamp(drag.ox + (e.clientX - drag.x0) * drag.k, STORY_W);
    drag.y = clamp(drag.oy + (e.clientY - drag.y0) * drag.k, STORY_H);
    drag.moved = true;
    renderer.setOffset(drag.x, drag.y); // sin re-render completo
});
function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) update({ offsetX: drag.x, offsetY: drag.y });
    drag = null;
}
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);
svg.addEventListener('dblclick', () => update({ offsetX: 0, offsetY: 0 }));
centerBtn.addEventListener('click', () => update({ offsetX: 0, offsetY: 0 }));

// ---- Export -------------------------------------------------------------------------
const exportButtons = ['download-btn', 'copy-btn', 'download-story-btn'].map($);

async function buildPNG(mode) {
    if (!state.text.trim()) throw new Error('Write some text first.');
    // Banderas descargadas (y dibujadas) antes de rasterizar; si no, saldría un hueco.
    await loadFlagsIn(state.text);
    renderNow();
    const fontCSS = await getEmbeddedFontCSS(state.fontId);
    return renderPNG({ svg, content: renderer.content, mode, fontCSS, backgroundImage });
}

async function runExport(task) {
    exportButtons.forEach(b => { b.disabled = true; });
    try {
        await task();
    } catch (err) {
        console.error('Export error:', err);
        toast(err.message || 'Could not export the image.', 'error');
    } finally {
        exportButtons.forEach(b => { b.disabled = false; });
    }
}

function downloadSticker() {
    return runExport(async () => downloadBlob(await buildPNG('sticker'), exportFilename(state)));
}

$('download-btn').addEventListener('click', downloadSticker);
$('download-story-btn').addEventListener('click', () =>
    runExport(async () => downloadBlob(await buildPNG('story'), exportFilename(state, '-story'))));
$('copy-btn').addEventListener('click', () =>
    runExport(async () => {
        await copyPNGToClipboard(buildPNG('sticker'));
        toast('PNG copied to clipboard');
    }));

// ---- Atajos de teclado ----------------------------------------------------------------
document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 's') {
        e.preventDefault();
        downloadSticker();
        return;
    }
    // En campos de texto, dejar el undo nativo del navegador.
    if (e.target.closest('textarea, input[type="text"], input[type="search"]')) return;
    if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redo(); }
});

// Guardar lo pendiente antes de cerrar la pestaña.
window.addEventListener('pagehide', commit);

// ---- Inicio ---------------------------------------------------------------------------
history.record(state);
syncUI();
syncHistoryButtons();
renderNow();
waitForFont();
if (state.fontId === 'custom' && !getCustomFont()) {
    toast('Your last session used a custom font: upload it again.', 'warn', 4500);
}
