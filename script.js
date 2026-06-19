// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Elementos del DOM
    const textInput = document.getElementById('text-input');
    const svg = document.getElementById('text-svg');
    const textStyle = document.getElementById('text-style');
    const customFontGroup = document.getElementById('custom-font-group');
    const customFontFile = document.getElementById('custom-font-file');
    const textColor = document.getElementById('text-color');
    const bgColor = document.getElementById('bg-color');
    const bgOpacity = document.getElementById('bg-opacity');
    const opacityValue = document.getElementById('opacity-value');
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const bold = document.getElementById('bold');
    const italic = document.getElementById('italic');
    const transparentBg = document.getElementById('transparent-bg');
    const safeZonesSelect = document.getElementById('safe-zones-select');
    const safeZoneOrganic = document.getElementById('safe-zone-organic');
    const safeZonePaid = document.getElementById('safe-zone-paid');
    const textAlign = document.getElementById('text-align');
    const lineHeight = document.getElementById('line-height');
    const lineHeightValue = document.getElementById('line-height-value');
    const letterSpacing = document.getElementById('letter-spacing');
    const letterSpacingValue = document.getElementById('letter-spacing-value');
    const borderRadiusSlider = document.getElementById('border-radius');
    const borderRadiusValue = document.getElementById('border-radius-value');
    const textVerticalPosition = document.getElementById('text-vertical-position');
    const textVerticalPositionValue = document.getElementById('text-vertical-position-value');
    const bgImageFile = document.getElementById('bg-image-file');
    const removeBgImage = document.getElementById('remove-bg-image');
    const bgImagePreview = document.getElementById('bg-image-preview');
    const downloadBtn = document.getElementById('download-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPanel = document.getElementById('emoji-panel');
    const presetSelect = document.getElementById('preset-select');
    const savePresetBtn = document.getElementById('save-preset-btn');
    const perLineSizeGroup = document.getElementById('per-line-size-group');
    const perLineSizeList = document.getElementById('per-line-size-list');
    // Anillos olímpicos: no existe un emoji Unicode (símbolo registrado por el COI),
    // así que se trata como un "emoji-imagen". Al insertarlo se agrega al texto un
    // carácter centinela del Área de Uso Privado (no imprime glifo en ninguna fuente);
    // renderText() lo detecta y dibuja un <image> inline en su lugar, midiendo la
    // posición real del hueco reservado con getStart/getEndPositionOfChar.
    // SVG con interlocking real, recortado a los límites visibles de los anillos
    // (viewBox "2 16 56 28" → relación 2:1) y embebido como data URI para que también
    // funcione en el PNG exportado.
    const OLYMPIC_RINGS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 16 56 28">' +
        '<path style="fill:#F3D55B;" d="M19.369,26.473c0.152-0.009,0.302-0.023,0.456-0.023c0.171,0,0.338,0.015,0.506,0.026c-0.013-0.208-0.032-0.414-0.032-0.625c0-0.466,0.044-0.922,0.108-1.371c-0.194-0.012-0.386-0.03-0.583-0.03c-0.18,0-0.356,0.017-0.534,0.027c0.064,0.45,0.109,0.906,0.109,1.373C19.4,26.06,19.382,26.266,19.369,26.473z"/>' +
        '<path style="fill:#F3D55B;" d="M17.324,26.875c0.045-0.336,0.076-0.677,0.076-1.025c0-0.361-0.034-0.713-0.082-1.06c-3.942,1.057-6.893,4.533-7.162,8.737c0.712-0.042,1.397-0.179,2.045-0.402C12.592,30.209,14.616,27.809,17.324,26.875z"/>' +
        '<path style="fill:#F3D55B;" d="M19.825,41.85c-3.886,0-7.099-2.895-7.618-6.64c-0.635,0.17-1.294,0.276-1.973,0.313c0.671,4.699,4.71,8.327,9.591,8.327c4.882,0,8.922-3.629,9.592-8.329c-0.678-0.041-1.337-0.149-1.971-0.323C26.932,38.949,23.715,41.85,19.825,41.85z"/>' +
        '<path style="fill:#F3D55B;" d="M22.38,24.802c-0.047,0.344-0.08,0.692-0.08,1.048c0,0.355,0.033,0.702,0.079,1.044c2.675,0.945,4.673,3.323,5.067,6.212c0.648,0.229,1.334,0.372,2.048,0.419C29.225,29.339,26.297,25.874,22.38,24.802z"/>' +
        '<path style="fill:#24AE5F;" d="M37.63,26.831c0.041-0.322,0.07-0.648,0.07-0.981c0-0.37-0.035-0.732-0.086-1.088c-3.997,1.022-7.001,4.526-7.27,8.771c0.708-0.031,1.392-0.153,2.038-0.364C32.764,30.19,34.849,27.739,37.63,26.831z"/>' +
        '<path style="fill:#24AE5F;" d="M42.686,26.938c2.602,0.968,4.539,3.299,4.941,6.124c0.649,0.241,1.337,0.399,2.054,0.457c-0.269-4.145-3.144-7.584-7.006-8.689c-0.045,0.335-0.076,0.673-0.076,1.02C42.6,26.22,42.635,26.581,42.686,26.938z"/>' +
        '<path style="fill:#24AE5F;" d="M40.013,41.85c-3.876,0-7.083-2.881-7.614-6.612c-0.637,0.163-1.297,0.262-1.976,0.291c0.673,4.696,4.711,8.321,9.591,8.321c4.884,0,8.926-3.632,9.593-8.335c-0.678-0.048-1.336-0.164-1.968-0.345C47.136,38.934,43.912,41.85,40.013,41.85z"/>' +
        '<path style="fill:#24AE5F;" d="M39.669,26.467c0.115-0.005,0.228-0.017,0.344-0.017c0.209,0,0.414,0.015,0.619,0.031c-0.014-0.21-0.032-0.418-0.032-0.631c0-0.465,0.044-0.918,0.108-1.365c-0.23-0.016-0.46-0.035-0.694-0.035c-0.143,0-0.281,0.015-0.422,0.021c0.065,0.452,0.11,0.91,0.11,1.379C39.7,26.058,39.682,26.262,39.669,26.467z"/>' +
        '<path style="fill:#0096E6;" d="M19.369,26.473c-0.712,0.042-1.397,0.179-2.045,0.402c-0.39,2.916-2.415,5.316-5.123,6.25c-0.045,0.336-0.076,0.677-0.076,1.025c0,0.361,0.034,0.713,0.082,1.06C16.148,34.153,19.1,30.677,19.369,26.473z"/>' +
        '<path style="fill:#0096E6;" d="M10.157,33.527C10.005,33.536,9.854,33.55,9.7,33.55c-4.246,0-7.7-3.454-7.7-7.7s3.454-7.7,7.7-7.7c3.886,0,7.099,2.895,7.618,6.64c0.635-0.17,1.294-0.276,1.973-0.313c-0.671-4.699-4.71-8.327-9.591-8.327c-5.349,0-9.7,4.352-9.7,9.7s4.352,9.7,9.7,9.7c0.18,0,0.356-0.017,0.534-0.027c-0.064-0.45-0.109-0.906-0.109-1.373C10.125,33.94,10.143,33.734,10.157,33.527z"/>' +
        '<path style="fill:#F3D55B;" d="M12.125,34.15c0-0.348,0.031-0.689,0.076-1.025c-0.647,0.223-1.333,0.36-2.045,0.402c-0.013,0.207-0.032,0.413-0.032,0.623c0,0.467,0.045,0.923,0.109,1.373c0.679-0.037,1.338-0.143,1.973-0.313C12.159,34.862,12.125,34.51,12.125,34.15z"/>' +
        '<path style="fill:#0096E6;" d="M17.4,25.85c0,0.348-0.031,0.689-0.076,1.025c0.647-0.223,1.333-0.36,2.045-0.402c0.013-0.207,0.032-0.413,0.032-0.623c0-0.467-0.045-0.923-0.109-1.373c-0.679,0.037-1.338,0.143-1.973,0.313C17.367,25.138,17.4,25.49,17.4,25.85z"/>' +
        '<path style="fill:#38454F;" d="M30,18.15c3.876,0,7.083,2.881,7.614,6.612c0.637-0.163,1.297-0.262,1.976-0.291C38.917,19.775,34.879,16.15,30,16.15c-4.882,0-8.922,3.629-9.592,8.329c0.678,0.041,1.337,0.149,1.971,0.323C22.894,21.051,26.11,18.15,30,18.15z"/>' +
        '<path style="fill:#38454F;" d="M39.669,26.467c-0.708,0.031-1.392,0.153-2.038,0.364c-0.381,2.979-2.466,5.43-5.248,6.338c-0.041,0.322-0.07,0.648-0.07,0.981c0,0.37,0.035,0.732,0.086,1.088C36.396,34.215,39.4,30.712,39.669,26.467z"/>' +
        '<path style="fill:#38454F;" d="M30.344,33.533C30.229,33.538,30.116,33.55,30,33.55c-0.171,0-0.338-0.015-0.506-0.026c0.013,0.208,0.032,0.414,0.032,0.625c0,0.466-0.044,0.922-0.108,1.371c0.194,0.012,0.386,0.03,0.583,0.03c0.143,0,0.281-0.015,0.422-0.021c-0.065-0.452-0.11-0.91-0.11-1.379C30.312,33.942,30.331,33.738,30.344,33.533z"/>' +
        '<path style="fill:#38454F;" d="M22.379,26.894c-0.648-0.229-1.334-0.372-2.048-0.419c0.269,4.186,3.197,7.65,7.114,8.722c0.047-0.344,0.08-0.692,0.08-1.048c0-0.355-0.033-0.702-0.079-1.044C24.771,32.161,22.773,29.783,22.379,26.894z"/>' +
        '<path style="fill:#38454F;" d="M29.494,33.525c-0.714-0.047-1.4-0.19-2.048-0.419c0.047,0.342,0.079,0.689,0.079,1.044c0,0.356-0.033,0.704-0.08,1.048c0.634,0.174,1.293,0.282,1.971,0.323c0.064-0.449,0.108-0.904,0.108-1.371C29.525,33.939,29.507,33.732,29.494,33.525z"/>' +
        '<path style="fill:#F3D55B;" d="M20.331,26.475c0.714,0.047,1.4,0.19,2.048,0.419c-0.047-0.342-0.079-0.689-0.079-1.044c0-0.356,0.033-0.704,0.08-1.048c-0.634-0.174-1.293-0.282-1.971-0.323c-0.064,0.449-0.108,0.904-0.108,1.371C20.3,26.061,20.318,26.268,20.331,26.475z"/>' +
        '<path style="fill:#24AE5F;" d="M32.312,34.15c0-0.333,0.028-0.659,0.07-0.981c-0.646,0.211-1.33,0.333-2.038,0.364c-0.013,0.205-0.031,0.409-0.031,0.617c0,0.469,0.045,0.927,0.11,1.379c0.68-0.029,1.34-0.128,1.976-0.291C32.348,34.881,32.312,34.52,32.312,34.15z"/>' +
        '<path style="fill:#38454F;" d="M37.7,25.85c0,0.333-0.028,0.659-0.07,0.981c0.646-0.211,1.33-0.333,2.038-0.364c0.013-0.205,0.031-0.409,0.031-0.617c0-0.469-0.045-0.927-0.11-1.379c-0.68,0.029-1.34,0.128-1.976,0.291C37.665,25.119,37.7,25.48,37.7,25.85z"/>' +
        '<path style="fill:#E64C3C;" d="M50.3,16.15c-4.884,0-8.926,3.632-9.593,8.335c0.678,0.048,1.336,0.164,1.968,0.345c0.502-3.764,3.725-6.68,7.625-6.68c4.246,0,7.7,3.454,7.7,7.7s-3.454,7.7-7.7,7.7c-0.209,0-0.414-0.015-0.619-0.031c0.014,0.21,0.032,0.418,0.032,0.631c0,0.465-0.044,0.918-0.108,1.365c0.23,0.016,0.46,0.035,0.694,0.035c5.349,0,9.7-4.352,9.7-9.7S55.648,16.15,50.3,16.15z"/>' +
        '<path style="fill:#E64C3C;" d="M42.686,26.938c-0.649-0.241-1.337-0.399-2.054-0.457c0.269,4.145,3.144,7.584,7.006,8.689c0.045-0.335,0.076-0.673,0.076-1.02c0-0.37-0.035-0.731-0.086-1.088C45.025,32.094,43.088,29.763,42.686,26.938z"/>' +
        '<path style="fill:#E64C3C;" d="M49.681,33.519c-0.717-0.057-1.405-0.215-2.054-0.457c0.051,0.356,0.086,0.718,0.086,1.088c0,0.347-0.031,0.685-0.076,1.02c0.632,0.181,1.29,0.297,1.968,0.345c0.063-0.447,0.108-0.901,0.108-1.365C49.713,33.937,49.695,33.729,49.681,33.519z"/>' +
        '<path style="fill:#24AE5F;" d="M40.632,26.481c0.717,0.057,1.405,0.215,2.054,0.457C42.635,26.581,42.6,26.22,42.6,25.85c0-0.347,0.031-0.685,0.076-1.02c-0.632-0.181-1.29-0.297-1.968-0.345c-0.063,0.447-0.108,0.901-0.108,1.365C40.6,26.063,40.618,26.271,40.632,26.481z"/>' +
        '</svg>';
    const OLYMPIC_RINGS_DATAURI = 'data:image/svg+xml;base64,' + btoa(OLYMPIC_RINGS_SVG);
    const OLYMPIC_RINGS_ASPECT = 56 / 28; // ancho / alto del viewBox recortado

    // Registro de "emoji-imagen": cada uno usa un carácter centinela del Área de Uso
    // Privado (sin glifo en ninguna fuente). renderText() los detecta y dibuja un
    // <image> inline; el picker muestra la imagen y al click inserta el centinela.
    // (Las banderas de países NO van acá: se resuelven solas vía Twemoji, ver abajo.)
    const IMAGE_EMOJIS = [
        { char: String.fromCharCode(0xE000), dataURI: OLYMPIC_RINGS_DATAURI, aspect: OLYMPIC_RINGS_ASPECT, label: 'Anillos olímpicos' }
    ];
    const IMAGE_EMOJI_BY_CHAR = {};
    IMAGE_EMOJIS.forEach(e => { IMAGE_EMOJI_BY_CHAR[e.char] = e; });
    const IMAGE_EMOJI_CHARCLASS = '[' + IMAGE_EMOJIS.map(e => e.char).join('') + ']';
    // Alto objetivo del emoji-imagen ≈ 0.85x el tamaño de fuente; el ancho sale del aspecto.
    function imageEmojiReservedWidth(lineSize, aspect) { return lineSize * 0.85 * aspect; }

    // ---- Banderas como imágenes (Twemoji) -------------------------------------
    // En Windows, Chrome/Edge NO renderizan los emojis de bandera (pares de
    // indicadores regionales): la fuente del sistema muestra las dos letras del país
    // (US, AR, …). Solución estándar: renderizar la bandera como imagen del set
    // Twemoji, calculando el archivo desde los codepoints del emoji. Sirve para
    // cualquier bandera de país (par de indicadores regionales), sin código por bandera.
    const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/';
    // Par de indicadores regionales = una bandera de país. (u + g: detección global.)
    const FLAG_RE = /[\u{1F1E6}-\u{1F1FF}]{2}/gu;
    function isCountryFlag(str) { FLAG_RE.lastIndex = 0; return FLAG_RE.test(str); }
    // Codepoints en hex minúscula unidos por '-' (regla de Twemoji: para banderas no
    // hay ZWJ ni VS16, así que es directo).
    function flagToTwemojiCode(flag) {
        const cps = [];
        for (const ch of flag) cps.push(ch.codePointAt(0).toString(16));
        return cps.join('-');
    }
    function flagTwemojiUrl(flag) { return TWEMOJI_BASE + flagToTwemojiCode(flag) + '.svg'; }

    // Cache de banderas: emoji -> 'data:...' (listo) | 'failed'. Para el preview/export
    // necesitamos data URI embebido (un <image> con href externo no se rasteriza al
    // exportar el SVG como imagen).
    const flagDataURICache = new Map();
    const flagPromiseCache = new Map(); // emoji -> Promise<string|null> (descarga en vuelo)
    let onFlagLoadedRerender = null;    // se asigna a renderText más abajo

    // Re-render coalescido: muchas banderas resolviéndose juntas colapsan en un render.
    let flagRerenderScheduled = false;
    function scheduleFlagRerender() {
        if (flagRerenderScheduled) return;
        flagRerenderScheduled = true;
        requestAnimationFrame(() => {
            flagRerenderScheduled = false;
            if (typeof onFlagLoadedRerender === 'function') onFlagLoadedRerender();
        });
    }

    // Descarga (una sola vez) el SVG de la bandera y lo cachea como data URI.
    // Devuelve una promesa para poder esperarla antes de exportar.
    function loadFlag(flag) {
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

    // Versión síncrona para el render: data URI si ya está, o null (y dispara la
    // descarga + un re-render coalescido cuando llegue).
    function getFlagDataURI(flag) {
        const cached = flagDataURICache.get(flag);
        if (typeof cached === 'string' && cached.startsWith('data:')) return cached;
        if (cached === 'failed') return null;
        loadFlag(flag).then(scheduleFlagRerender);
        return null;
    }

    // Per-line font size overrides: index N = size override for manual line N (null = follow global slider).
    let perLineSizes = [];

    function getLineSize(idx) {
        const v = perLineSizes[idx];
        if (v == null) return null;
        const n = parseInt(v, 10);
        return Number.isFinite(n) ? Math.max(n, 15) : null;
    }

    let perLineUISignature = '';

    function previewForLine(line) {
        const trimmed = line.trim();
        if (trimmed === '') return '(empty)';
        return trimmed.length > 28 ? trimmed.slice(0, 28) + '…' : trimmed;
    }

    function rebuildPerLineSizeUI() {
        if (!perLineSizeGroup || !perLineSizeList) return;
        const manualLines = (textInput.value || '').split('\n');

        // Sync overrides array length to manual lines count
        while (perLineSizes.length < manualLines.length) perLineSizes.push(null);
        perLineSizes.length = manualLines.length;

        const visible = manualLines.length > 1;
        perLineSizeGroup.style.display = visible ? '' : 'none';
        if (!visible) {
            perLineSizeList.innerHTML = '';
            perLineUISignature = '';
            return;
        }

        const globalSize = parseInt(fontSize.value, 10) || 33;
        const signature = manualLines.join('\n');

        // Fast path: misma cantidad y mismo texto → solo actualizar valores
        // (evita destruir el slider que el usuario está arrastrando).
        if (signature === perLineUISignature && perLineSizeList.children.length === manualLines.length) {
            for (let i = 0; i < manualLines.length; i++) {
                const row = perLineSizeList.children[i];
                const override = getLineSize(i);
                const effective = override != null ? override : globalSize;
                const slider = row.querySelector('input[type="range"]');
                const valueLabel = row.querySelector('.per-line-value');
                const resetBtn = row.querySelector('.per-line-reset');
                if (slider && document.activeElement !== slider) {
                    slider.value = String(effective);
                }
                if (valueLabel) valueLabel.textContent = `${effective}px`;
                if (resetBtn) resetBtn.disabled = override == null;
            }
            return;
        }

        // Slow path: el texto cambió, reconstruir filas
        perLineSizeList.innerHTML = '';
        perLineUISignature = signature;

        manualLines.forEach((line, i) => {
            const row = document.createElement('div');
            row.className = 'per-line-size-row';

            const override = getLineSize(i);
            const effective = override != null ? override : globalSize;
            const isCustom = override != null;

            const label = document.createElement('span');
            label.className = 'per-line-label';
            label.title = line;
            label.textContent = `L${i + 1}: ${previewForLine(line)}`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '15';
            slider.max = '90';
            slider.value = String(effective);

            const valueLabel = document.createElement('span');
            valueLabel.className = 'per-line-value';
            valueLabel.textContent = `${effective}px`;

            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'per-line-reset';
            resetBtn.textContent = '↺';
            resetBtn.title = 'Reset to global size';
            resetBtn.disabled = !isCustom;

            slider.addEventListener('input', () => {
                const val = parseInt(slider.value, 10) || globalSize;
                perLineSizes[i] = val;
                valueLabel.textContent = `${val}px`;
                resetBtn.disabled = false;
                renderText();
            });

            resetBtn.addEventListener('click', () => {
                perLineSizes[i] = null;
                renderText();
            });

            row.appendChild(label);
            row.appendChild(slider);
            row.appendChild(valueLabel);
            row.appendChild(resetBtn);
            perLineSizeList.appendChild(row);
        });
    }

    // Verificar que todos los elementos esenciales existan
    if (!textInput || !svg || !textStyle || !customFontGroup || !customFontFile || !textColor || !bgColor || 
        !bgOpacity || !opacityValue || !fontSize || !fontSizeValue || 
        !bold || !italic || !transparentBg || !textAlign || !downloadBtn ||
        !lineHeight || !lineHeightValue || !letterSpacing || !letterSpacingValue ||
        !borderRadiusSlider || !borderRadiusValue) {
        console.error('Error: Not all essential DOM elements were found');
        return;
    }
    
    // Verificar elementos opcionales (safe zones)
    if (!safeZonesSelect) {
        console.warn('Safe zones select not found');
    }
    if (!safeZoneOrganic) {
        console.warn('Safe zone organic image not found');
    }
    if (!safeZonePaid) {
        console.warn('Safe zone paid image not found');
    }
    
    // Verificar elementos opcionales (text vertical position)
    if (!textVerticalPosition || !textVerticalPositionValue) {
        console.warn('Text vertical position controls not found');
    }

    // Función para obtener el borderRadius desde el slider
    function getBorderRadius() {
        return parseInt(borderRadiusSlider.value) || 10;
    }

    // ─── Cache LRU de mediciones de texto ──────────────────────────────────
    // Cada keystroke disparaba 30-60 getBBox sobre elementos SVG temporales.
    // Con cache, sólo se mide cuando aparece un (texto+estilo) nuevo.
    const measureCache = new Map();
    const MEASURE_CACHE_MAX = 256;

    function measureTextWidth(text, fontFamily, size, weight, style, letterSpacing) {
        if (!text) return 0;
        const key = `${size}|${weight}|${style}|${letterSpacing}|${fontFamily}|${text}`;
        const cached = measureCache.get(key);
        if (cached !== undefined) {
            measureCache.delete(key);
            measureCache.set(key, cached);
            return cached;
        }
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', '0');
        el.setAttribute('y', '0');
        el.textContent = text;
        el.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${weight}; font-style: ${style}; letter-spacing: ${letterSpacing}px;`);
        svg.appendChild(el);
        const width = el.getBBox().width;
        svg.removeChild(el);
        measureCache.set(key, width);
        if (measureCache.size > MEASURE_CACHE_MAX) {
            const firstKey = measureCache.keys().next().value;
            measureCache.delete(firstKey);
        }
        return width;
    }

    // ─── Helpers de path para el fondo ─────────────────────────────────────
    // Clamp del radio: evita que arcos consecutivos se solapen (loops) cuando
    // las líneas son angostas, los radios grandes, o las diferencias de ancho chicas.
    function clampRadius(r, ...constraints) {
        let v = r;
        for (const c of constraints) {
            if (c < v) v = c;
        }
        return Math.max(0, v);
    }

    function singleLinePath(rect, r) {
        const w = rect.shiftRight - rect.shiftLeft;
        const h = rect.bottom - rect.top;
        const re = clampRadius(r, w / 2, h / 2);
        if (re < 0.5) {
            return `M ${rect.shiftLeft},${rect.top} L ${rect.shiftRight},${rect.top} L ${rect.shiftRight},${rect.bottom} L ${rect.shiftLeft},${rect.bottom} Z`;
        }
        return `M ${rect.shiftLeft + re},${rect.top} L ${rect.shiftRight - re},${rect.top} A ${re},${re} 0 0 1 ${rect.shiftRight},${rect.top + re} L ${rect.shiftRight},${rect.bottom - re} A ${re},${re} 0 0 1 ${rect.shiftRight - re},${rect.bottom} L ${rect.shiftLeft + re},${rect.bottom} A ${re},${re} 0 0 1 ${rect.shiftLeft},${rect.bottom - re} L ${rect.shiftLeft},${rect.top + re} A ${re},${re} 0 0 1 ${rect.shiftLeft + re},${rect.top} Z`;
    }

    // Transición en el borde DERECHO bajando de `curr` (línea superior) a `next` (inferior).
    function rightTransition(curr, next, r) {
        const diff = next.shiftRight - curr.shiftRight;
        const midY = (curr.bottom + next.top) / 2;
        if (Math.abs(diff) < 0.5) {
            return [`L ${curr.shiftRight},${midY}`];
        }
        const re = clampRadius(r,
            Math.abs(diff) / 2,
            (curr.bottom - curr.top) / 2,
            (next.bottom - next.top) / 2);
        const segs = [];
        if (diff > 0) {
            // next es más ancha → arco hacia afuera (CCW) y después hacia adentro (CW)
            segs.push(`L ${curr.shiftRight},${midY - re}`);
            segs.push(`A ${re},${re} 0 0 0 ${curr.shiftRight + re},${midY}`);
            segs.push(`L ${next.shiftRight - re},${midY}`);
            segs.push(`A ${re},${re} 0 0 1 ${next.shiftRight},${midY + re}`);
        } else {
            // next es más angosta → adentro (CW) y después afuera (CCW)
            segs.push(`L ${curr.shiftRight},${midY - re}`);
            segs.push(`A ${re},${re} 0 0 1 ${curr.shiftRight - re},${midY}`);
            segs.push(`L ${next.shiftRight + re},${midY}`);
            segs.push(`A ${re},${re} 0 0 0 ${next.shiftRight},${midY + re}`);
        }
        return segs;
    }

    // Transición en el borde IZQUIERDO subiendo de `curr` (línea inferior) a `prev` (superior).
    function leftTransition(curr, prev, r) {
        const diff = prev.shiftLeft - curr.shiftLeft;
        const midY = (prev.bottom + curr.top) / 2;
        if (Math.abs(diff) < 0.5) {
            return [`L ${curr.shiftLeft},${midY}`];
        }
        const re = clampRadius(r,
            Math.abs(diff) / 2,
            (curr.bottom - curr.top) / 2,
            (prev.bottom - prev.top) / 2);
        const segs = [];
        if (diff > 0) {
            // prev está desplazada a la derecha (curr más ancha por la izquierda)
            segs.push(`L ${curr.shiftLeft},${midY + re}`);
            segs.push(`A ${re},${re} 0 0 1 ${curr.shiftLeft + re},${midY}`);
            segs.push(`L ${prev.shiftLeft - re},${midY}`);
            segs.push(`A ${re},${re} 0 0 0 ${prev.shiftLeft},${midY - re}`);
        } else {
            // prev es más ancha por la izquierda
            segs.push(`L ${curr.shiftLeft},${midY + re}`);
            segs.push(`A ${re},${re} 0 0 0 ${curr.shiftLeft - re},${midY}`);
            segs.push(`L ${prev.shiftLeft + re},${midY}`);
            segs.push(`A ${re},${re} 0 0 1 ${prev.shiftLeft},${midY - re}`);
        }
        return segs;
    }

    function buildBackgroundPath(lineRects, r) {
        if (lineRects.length === 1) {
            return singleLinePath(lineRects[0], r);
        }
        const first = lineRects[0];
        const last = lineRects[lineRects.length - 1];
        const firstR = clampRadius(r, (first.shiftRight - first.shiftLeft) / 2, (first.bottom - first.top) / 2);
        const lastR = clampRadius(r, (last.shiftRight - last.shiftLeft) / 2, (last.bottom - last.top) / 2);

        const segs = [];
        // Borde superior de la primera línea
        segs.push(`M ${first.shiftLeft + firstR},${first.top}`);
        segs.push(`L ${first.shiftRight - firstR},${first.top}`);
        segs.push(`A ${firstR},${firstR} 0 0 1 ${first.shiftRight},${first.top + firstR}`);
        // Lado DERECHO bajando
        for (let i = 0; i < lineRects.length - 1; i++) {
            segs.push(...rightTransition(lineRects[i], lineRects[i + 1], r));
        }
        // Esquina inferior derecha + borde inferior + esquina inferior izquierda
        segs.push(`L ${last.shiftRight},${last.bottom - lastR}`);
        segs.push(`A ${lastR},${lastR} 0 0 1 ${last.shiftRight - lastR},${last.bottom}`);
        segs.push(`L ${last.shiftLeft + lastR},${last.bottom}`);
        segs.push(`A ${lastR},${lastR} 0 0 1 ${last.shiftLeft},${last.bottom - lastR}`);
        // Lado IZQUIERDO subiendo
        for (let i = lineRects.length - 1; i > 0; i--) {
            segs.push(...leftTransition(lineRects[i], lineRects[i - 1], r));
        }
        // Cierre: esquina superior izquierda
        segs.push(`L ${first.shiftLeft},${first.top + firstR}`);
        segs.push(`A ${firstR},${firstR} 0 0 1 ${first.shiftLeft + firstR},${first.top}`);
        segs.push('Z');
        return segs.join(' ');
    }
    
    // Variable para la imagen de fondo
    let backgroundImageUrl = null;

    // Variable para almacenar el nombre de la fuente personalizada
    let customFontName = null;
    // URL del blob de la fuente personalizada (para la página)
    let customFontBlobUrl = null;
    // Base64 de la fuente personalizada (para incluirla en el export PNG como data URI)
    let customFontBase64 = null;
    let customFontFormat = 'truetype';

    // Convertir ArrayBuffer a base64 para embeber fuentes en el SVG exportado
    function arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    // Función para cargar una fuente personalizada
    function loadCustomFont(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const fontData = e.target.result;
                const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remover extensión
                const fontName = `CustomFont-${fileName}`;
                
                // Determinar el formato
                let format = 'truetype';
                if (file.name.endsWith('.otf')) format = 'opentype';
                else if (file.name.endsWith('.woff')) format = 'woff';
                else if (file.name.endsWith('.woff2')) format = 'woff2';
                
                customFontBase64 = arrayBufferToBase64(fontData);
                customFontFormat = format;
                
                // Crear URL del blob para la página
                const blob = new Blob([fontData], { type: `font/${format}` });
                const url = URL.createObjectURL(blob);
                
                if (customFontBlobUrl) {
                    URL.revokeObjectURL(customFontBlobUrl);
                }
                customFontBlobUrl = url;
                
                const existingStyle = document.getElementById('custom-font-style');
                if (existingStyle) existingStyle.remove();
                
                const style = document.createElement('style');
                style.id = 'custom-font-style';
                style.textContent = `
                    @font-face {
                        font-family: '${fontName}';
                        src: url('${url}') format('${format}');
                        font-weight: normal;
                        font-style: normal;
                    }
                `;
                document.head.appendChild(style);
                
                customFontName = fontName;
                resolve(fontName);
            };
            
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // Función para obtener la fuente según el estilo
    function getFontFamily(style) {
        // Fuentes del sistema cargadas dinámicamente (Local Font Access API).
        // El valor del option es "sys:<Family Name>".
        if (style && style.startsWith('sys:')) {
            const family = style.slice(4);
            return `"${family}", sans-serif`;
        }
        const fonts = {
            classic: 'Proxima-Nova-Semibold, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            modern: 'Aveny-T, sans-serif',
            neon: 'CosmopolitanScript, sans-serif',
            typewriter: '"Courier New", monospace',
            strong: '"Bebas Neue", Impact, "Arial Black", sans-serif',
            'google-sans': '"Google Sans", "Product Sans", Roboto, sans-serif',
            montserrat: '"Montserrat", sans-serif',
            playfair: '"Playfair Display", Georgia, serif',
            'comic-sans': '"Comic Sans MS", "Comic Sans", cursive',
            'google-sans-code': '"Google Sans Code", "Roboto Mono", "Courier New", monospace',
            'meow-script': '"Meow Script", cursive',
            'sf-pro-display-black-italic': 'SF-Pro-Display-BlackItalic, -apple-system, BlinkMacSystemFont, sans-serif',
            custom: customFontName ? `${customFontName}, sans-serif` : 'Arial, sans-serif'
        };
        return fonts[style] || fonts.classic;
    }


    // Función para dividir texto en líneas que quepan en el ancho disponible.
    // Usa measureTextWidth (cache LRU), evitando crear/destruir elementos SVG por palabra.
    function wrapText(text, maxWidth, fontFamily, fontSize, fontWeight, fontStyle, letterSpacingPx) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testWidth = measureTextWidth(testLine, fontFamily, fontSize, fontWeight, fontStyle, letterSpacingPx);
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
    }

    // Función para renderizar el texto con efecto escalera
    function renderText() {
        const text = textInput.value || 'Your text will appear here';
        const style = textStyle.value;
        const txtColor = textColor.value;
        const backgroundColor = bgColor.value;
        const opacity = bgOpacity.value / 100;
        // Leer el valor del slider correctamente
        const sliderValue = fontSize.value;
        const globalSize = Math.max(parseInt(sliderValue, 10) || 33, 15);

        // Mantener sincronizada la UI de tamaños por línea con el textarea / slider global.
        rebuildPerLineSizeUI();

        // Per-line size resolver: cada manualLine puede tener un override (perLineSizes[i])
        function sizeForManualLine(idx) {
            const v = getLineSize(idx);
            return v != null ? v : globalSize;
        }
        // Padding proporcional al tamaño (~42% del tamaño de fuente da un padding visual equilibrado).
        function paddingForSize(s) {
            return Math.round(s * 0.42);
        }

        const isBold = bold.checked;
        const isItalic = italic.checked;
        const isTransparent = transparentBg.checked;
        const alignment = textAlign.value;
        const lineHeightMultiplier = lineHeight.value / 100; // Convert 80-200 to 0.8-2.0
        const letterSpacingPx = parseInt(letterSpacing.value, 10) || 0;
        const textVerticalOffset = (textVerticalPosition ? parseInt(textVerticalPosition.value, 10) : 0) || 0; // Offset vertical solo para el texto

        // Limpiar SVG
        svg.innerHTML = '';

        // Configurar fuente
        const fontWeight = isBold ? 'bold' : '600';
        const fontStyle = isItalic ? 'italic' : 'normal';
        const fontFamily = getFontFamily(style);

        // Obtener el ancho disponible del contenedor y configurar viewBox temporal
        const storyContainer = svg.closest('.story-container');
        let referenceWidth = 400; // Ancho de referencia fijo (mismo que max-width del contenedor)
        let referenceHeight = (referenceWidth * 16) / 9; // Altura de referencia basada en aspect-ratio 9:16 (vertical)
        
        if (storyContainer) {
            const rect = storyContainer.getBoundingClientRect();
            if (rect.width > 0) {
                referenceWidth = rect.width - 40; // Restar padding
                // Mantener la proporción 9:16 exacta
                referenceHeight = (referenceWidth * 16) / 9;
            }
        }

        // Configurar viewBox temporal para que las mediciones funcionen correctamente
        svg.setAttribute('viewBox', `0 0 ${referenceWidth} ${referenceHeight}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

        // Regex global para los centinelas de emoji-imagen (anillos, bandera USA, …).
        const IMAGE_EMOJI_RE_G = new RegExp(IMAGE_EMOJI_CHARCLASS, 'g');
        // Suma del ancho reservado por todos los emoji-imagen de una línea.
        function imageEmojiReservedSum(str, lineSize) {
            let sum = 0;
            for (const ch of str) {
                const spec = IMAGE_EMOJI_BY_CHAR[ch];
                if (spec) sum += imageEmojiReservedWidth(lineSize, spec.aspect);
            }
            return sum;
        }

        // Dividir el texto en líneas manuales primero
        const manualLines = text.split('\n');
        // wrappedLines ahora contiene objetos {text, size, padding, lineHeight}
        // para soportar tamaño de fuente por línea.
        const wrappedLines = [];

        manualLines.forEach((line, i) => {
            const lineSize = sizeForManualLine(i);
            const linePad = paddingForSize(lineSize);
            const lineH = lineSize * lineHeightMultiplier;
            // Misma fórmula de ancho disponible que la versión global: referenceWidth - 4 * padding.
            const innerWidth = referenceWidth - 4 * linePad;
            if (line.trim() === '' && manualLines.length === 1) {
                wrappedLines.push({ text: ' ', size: lineSize, padding: linePad, lineHeight: lineH });
            } else if (line.trim() !== '') {
                const wrapped = wrapText(line.trim(), innerWidth, fontFamily, lineSize, fontWeight, fontStyle, letterSpacingPx);
                wrapped.forEach(w => {
                    wrappedLines.push({ text: w, size: lineSize, padding: linePad, lineHeight: lineH });
                });
            }
        });

        if (wrappedLines.length === 0) return;

        const lineMetrics = [];

        // Regex para detectar emojis reales (no variation selectors)
        const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/gu;
        
        // Regex para variation selectors y otros modificadores invisibles
        // Incluye: Variation Selectors, Zero Width Joiner, etc.
        const invisibleModifiersRegex = /[\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu;
        
        // Función para detectar si una cadena contiene emojis
        function containsEmoji(str) {
            return emojiRegex.test(str);
        }
        
        // Función para remover modificadores invisibles para medición precisa
        function stripInvisibleModifiers(str) {
            return str.replace(invisibleModifiersRegex, '');
        }

        // Funciones para detectar astas ascendentes y descendentes
        // Ascendentes: b, d, f, h, k, l, t (y mayúsculas)
        // Descendentes: g, j, p, q, y
        function hasAscenders(str) {
            return /[bdfhkltBDFHKLTÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÄËÏÖÜA-Z0-9]/.test(str);
        }

        function hasDescenders(str) {
            return /[gjpqyQ]/.test(str);
        }


        // Medir cada línea usando el cache de mediciones.
        // Para líneas con emoji removemos variation selectors antes de medir.
        let currentY = 0;
        wrappedLines.forEach((wl) => {
            const line = wl.text;
            const lineSize = wl.size;
            const lineBoxHeight = wl.lineHeight;
            // Los emoji-imagen (centinelas PUA) y las banderas de país (que se dibujan
            // como imagen Twemoji) no son glifos de fuente: se miden aparte con su ancho
            // reservado y se quitan antes de medir el texto. Las banderas son cuadradas.
            // Una bandera que falló (offline) se deja como texto para coincidir con el
            // render (que cae al glifo en ese caso).
            let imageReservedSum = imageEmojiReservedSum(line, lineSize);
            const lineForMeasure = line.replace(IMAGE_EMOJI_RE_G, '').replace(FLAG_RE, (m) => {
                if (flagDataURICache.get(m) === 'failed') return m; // se mide como texto
                imageReservedSum += imageEmojiReservedWidth(lineSize, 1);
                return '';
            });
            const hasEmoji = containsEmoji(lineForMeasure);

            let textWidth;
            if (hasEmoji) {
                const strippedLine = stripInvisibleModifiers(lineForMeasure);
                textWidth = measureTextWidth(strippedLine, fontFamily, lineSize, fontWeight, fontStyle, letterSpacingPx);
                const emojiMatches = lineForMeasure.match(emojiRegex);
                if (emojiMatches && emojiMatches.length > 0) {
                    // Compensar el espacio extra que ocupan los emojis SVG (~28% asimétrico)
                    textWidth -= emojiMatches.length * (lineSize * 0.28);
                }
            } else {
                textWidth = measureTextWidth(lineForMeasure, fontFamily, lineSize, fontWeight, fontStyle, letterSpacingPx);
            }

            textWidth += imageReservedSum;

            // Sólo forzar un mínimo cuando la línea está vacía (placeholder).
            if (!line || line.trim() === '') {
                textWidth = Math.max(textWidth, lineSize * 0.5);
            }

            lineMetrics.push({
                text: line,
                width: textWidth,
                height: lineBoxHeight,
                hasImageEmoji: imageReservedSum > 0,
                x: 0,
                y: currentY + lineBoxHeight / 2,
                hasEmoji: hasEmoji,
                size: lineSize,
                padding: wl.padding
            });

            currentY += lineBoxHeight;
        });

        // Padding superior/inferior del bloque: depende del tamaño de la primera y última línea.
        const topPadding = lineMetrics[0] ? lineMetrics[0].padding : 0;
        const bottomPadding = lineMetrics[lineMetrics.length - 1] ? lineMetrics[lineMetrics.length - 1].padding : 0;

        // Calcular dimensiones totales: cada línea aporta su propio padding horizontal a su ancho
        let tempMaxWidth = 0;
        lineMetrics.forEach(m => {
            tempMaxWidth = Math.max(tempMaxWidth, m.width + 2 * m.padding);
        });
        const maxWidth = Math.min(tempMaxWidth, referenceWidth);
        const totalHeight = lineMetrics.reduce((sum, m) => sum + m.height, 0) + topPadding + bottomPadding;
        
        // Recalcular posiciones X según la alineación
        // NOTA: Las posiciones del texto ahora son relativas al área de contenido (sin padding)
        // El padding se aplicará uniformemente cuando se dibuje el fondo y se posicione el texto
        lineMetrics.forEach((metric) => {
            if (alignment === 'center') {
                metric.x = referenceWidth / 2;
            } else if (alignment === 'right') {
                metric.x = referenceWidth - metric.padding;
            } else {
                metric.x = metric.padding;
            }
        });

        // Convertir color de fondo a rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // Construcción del fondo continuo basada en https://stackoverflow.com/a/49288455
        if (!isTransparent) {
            const bgRgba = hexToRgba(backgroundColor, opacity);
            const r = getBorderRadius();

            // PASO 1: shifts iniciales (sin clamp al canvas todavía — eso va al final
            // para que la agrupación trabaje sobre centros consistentes).
            const lineRects = lineMetrics.map((lineMetric, lnum) => {
                const textWidth = lineMetric.width;
                const lp = lineMetric.padding;
                const ls = lineMetric.size;
                const width = textWidth + 2 * lp;

                let shiftLeft, shiftRight;
                if (alignment === 'right') {
                    shiftRight = lineMetric.x + lp;
                    shiftLeft = shiftRight - width;
                } else if (alignment === 'left') {
                    shiftLeft = lineMetric.x - lp;
                    shiftRight = shiftLeft + width;
                } else {
                    shiftLeft = lineMetric.x - width / 2;
                    shiftRight = lineMetric.x + width / 2;
                }

                // Verticales: usar el tamaño DE ESTA línea para ascenders/descenders.
                const textCenterY = lineMetric.y + topPadding;
                const halfLineHeight = lineMetric.height / 2;
                const isFirstLine = (lnum === 0);
                const isLastLine = (lnum === lineMetrics.length - 1);
                const lineHasAscenders = hasAscenders(lineMetric.text);
                const lineHasDescenders = hasDescenders(lineMetric.text);
                const baseHalfHeight = ls * 0.22;
                const ascenderExtra = lineHasAscenders ? ls * 0.12 : 0;
                const descenderExtra = lineHasDescenders ? ls * 0.08 : 0;

                let top = textCenterY - halfLineHeight;
                let bottom = textCenterY + halfLineHeight;
                if (isFirstLine) top = textCenterY - baseHalfHeight - ascenderExtra - lp;
                if (isLastLine) bottom = textCenterY + baseHalfHeight + descenderExtra + lp;

                // Detectar emojis en los bordes para la corrección posterior.
                // OJO: los emoji-imagen (banderas Twemoji y centinelas) llenan su caja
                // reservada y NO deben encogerse como un glifo de fuente — si no, el lado
                // de la imagen queda con menos padding que el texto del otro lado.
                const lineTextForBoundary = stripInvisibleModifiers(lineMetric.text).trim();
                // Detección por code points (sin regex anclado: el motor del navegador
                // falla con [..]{2}$ + flag u sobre pares de indicadores regionales).
                const cpsB = [...lineTextForBoundary];
                const isRegInd = ch => { const c = ch ? ch.codePointAt(0) : 0; return c >= 0x1F1E6 && c <= 0x1F1FF; };
                const startsWithImage = !!IMAGE_EMOJI_BY_CHAR[cpsB[0]] ||
                    (cpsB.length >= 2 && isRegInd(cpsB[0]) && isRegInd(cpsB[1]));
                const endsWithImage = !!IMAGE_EMOJI_BY_CHAR[cpsB[cpsB.length - 1]] ||
                    (cpsB.length >= 2 && isRegInd(cpsB[cpsB.length - 1]) && isRegInd(cpsB[cpsB.length - 2]));
                emojiRegex.lastIndex = 0;
                const firstBMatch = emojiRegex.exec(lineTextForBoundary);
                const firstCharIsEmoji = !startsWithImage && firstBMatch !== null && firstBMatch.index === 0;
                emojiRegex.lastIndex = 0;
                let lastBMatch = null, scanBMatch;
                while ((scanBMatch = emojiRegex.exec(lineTextForBoundary)) !== null) {
                    lastBMatch = scanBMatch;
                }
                const lastCharIsEmoji = !endsWithImage && lastBMatch !== null &&
                    (lastBMatch.index + lastBMatch[0].length) === lineTextForBoundary.length;

                return { width, shiftLeft, shiftRight, top, bottom, firstCharIsEmoji, lastCharIsEmoji, startsWithImage, endsWithImage };
            });

            // PASO 2: agrupación "same width". Threshold desacoplado del border-radius
            // (antes era `r*3`: con r=1 casi nada se agrupaba; con r=25 agrupaba demás).
            const sameWidthThreshold = Math.max(r * 3, globalSize * 0.4);
            const groups = [];
            let currentGroup = [0];
            for (let i = 1; i < lineRects.length; i++) {
                if (Math.abs(lineRects[i].width - lineRects[i - 1].width) < sameWidthThreshold) {
                    currentGroup.push(i);
                } else {
                    if (currentGroup.length > 0) groups.push(currentGroup);
                    currentGroup = [i];
                }
            }
            if (currentGroup.length > 0) groups.push(currentGroup);

            // Unificar al ancho máximo del grupo (sobre shifts no clampeados → centros consistentes)
            groups.forEach(group => {
                if (group.length <= 1) return;
                let groupMaxWidth = 0;
                group.forEach(idx => { groupMaxWidth = Math.max(groupMaxWidth, lineRects[idx].width); });
                group.forEach(idx => {
                    const rect = lineRects[idx];
                    if (rect.width === groupMaxWidth) return;
                    const center = (rect.shiftLeft + rect.shiftRight) / 2;
                    if (alignment === 'right') {
                        rect.shiftLeft = rect.shiftRight - groupMaxWidth;
                    } else if (alignment === 'left') {
                        rect.shiftRight = rect.shiftLeft + groupMaxWidth;
                    } else {
                        rect.shiftLeft = center - groupMaxWidth / 2;
                        rect.shiftRight = center + groupMaxWidth / 2;
                    }
                    rect.width = groupMaxWidth;
                });
            });

            // PASO 3: corrección de emojis en bordes — sólo para líneas no agrupadas
            // (en un grupo todas comparten shifts; aplicar offset crearía un escalón).
            const groupedLineIndices = new Set();
            groups.forEach(group => {
                if (group.length > 1) group.forEach(idx => groupedLineIndices.add(idx));
            });
            lineRects.forEach((rect, idx) => {
                if (groupedLineIndices.has(idx)) return;
                const offset = lineMetrics[idx].size * 0.14;
                // Emoji-imagen (banderas/centinelas): llenan su caja sin side-bearing, así que
                // se EXPANDE el fondo para darles un respiro similar al del texto del otro lado.
                const imgEdge = lineMetrics[idx].size * 0.08;
                // Emojis de fuente: tienen padding interno → se encoge el fondo para abrazarlos.
                if (rect.firstCharIsEmoji) rect.shiftLeft += offset;
                if (rect.lastCharIsEmoji) rect.shiftRight -= offset;
                if (rect.startsWithImage) rect.shiftLeft -= imgEdge;
                if (rect.endsWithImage) rect.shiftRight += imgEdge;
                if (rect.firstCharIsEmoji || rect.lastCharIsEmoji || rect.startsWithImage || rect.endsWithImage) {
                    rect.width = Math.max(rect.shiftRight - rect.shiftLeft, 0);
                }
            });

            // PASO 4: clamp al canvas al FINAL, una vez que ancho y posición son definitivos.
            lineRects.forEach(rect => {
                if (rect.shiftLeft < 0) {
                    rect.shiftRight -= rect.shiftLeft;
                    rect.shiftLeft = 0;
                }
                if (rect.shiftRight > referenceWidth) {
                    rect.shiftLeft -= (rect.shiftRight - referenceWidth);
                    rect.shiftRight = referenceWidth;
                }
                rect.width = rect.shiftRight - rect.shiftLeft;
            });

            // PASO 5: dibujar el path con clamp de radios (evita loops y arcos cruzados
            // cuando |diff_ancho| < 2r, líneas angostas, o gaps verticales chicos).
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', buildBackgroundPath(lineRects, r));
            pathElement.setAttribute('fill', bgRgba);
            svg.appendChild(pathElement);
        }

        // Emoji-imagen inline: tspans-placeholder a posicionar como <image> una vez
        // que el texto está en el DOM y conocemos la posición real de cada hueco.
        const imageEmojisToPlace = [];

        // Renderizar texto con posicionamiento preciso
        lineMetrics.forEach((lineMetric) => {
            const lineSize = lineMetric.size;
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', lineMetric.x);

            // 'central' centra verticalmente; lineMetric.y no incluye el topPadding del bloque.
            textElement.setAttribute('y', lineMetric.y + topPadding + textVerticalOffset);
            textElement.setAttribute('dominant-baseline', 'central');

            if (alignment === 'center') {
                textElement.setAttribute('text-anchor', 'middle');
            } else if (alignment === 'right') {
                textElement.setAttribute('text-anchor', 'end');
            } else {
                textElement.setAttribute('text-anchor', 'start');
            }

            textElement.setAttribute('fill', txtColor);
            textElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${lineSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);

            // Dividir el texto en segmentos (texto normal y emojis) para aplicar diferentes tamaños
            const text = lineMetric.text;
            const emojiSize = lineSize * 0.80; // Emojis 20% más pequeños
            const centerY = lineMetric.y + topPadding + textVerticalOffset;

            // Solo dividir si la línea contiene emojis o emoji-imagen
            if (lineMetric.hasEmoji || lineMetric.hasImageEmoji) {
                // Tokenizar un fragmento de texto en partes {text, isEmoji}.
                function tokenizeEmojis(str) {
                    const out = [];
                    let lastIndex = 0;
                    let match;
                    emojiRegex.lastIndex = 0;
                    while ((match = emojiRegex.exec(str)) !== null) {
                        if (match.index > lastIndex) {
                            out.push({ text: str.substring(lastIndex, match.index), isEmoji: false });
                        }
                        out.push({ text: match[0], isEmoji: true });
                        lastIndex = match.index + match[0].length;
                    }
                    if (lastIndex < str.length) {
                        out.push({ text: str.substring(lastIndex), isEmoji: false });
                    }
                    return out;
                }

                // Separar por los centinelas de emoji-imagen y por las banderas de país
                // (capturándolos) e intercalar las partes de imagen con texto/emoji normal.
                const parts = [];
                const splitRe = new RegExp('(' + IMAGE_EMOJI_CHARCLASS + '|[\\u{1F1E6}-\\u{1F1FF}]{2})', 'gu');
                const segments = text.split(splitRe);
                segments.forEach((seg) => {
                    if (!seg) return;
                    const spec = IMAGE_EMOJI_BY_CHAR[seg];
                    if (spec) {
                        parts.push({ isImage: true, spec: spec });
                    } else if (isCountryFlag(seg) && flagDataURICache.get(seg) !== 'failed') {
                        // Bandera: como imagen, salvo que su descarga haya fallado
                        // (offline) → cae al glifo de texto para no dejar un hueco vacío.
                        parts.push({ isFlag: true, flag: seg });
                    } else {
                        tokenizeEmojis(seg).forEach(p => parts.push(p));
                    }
                });

                // Renderizar cada parte con su tamaño correspondiente
                parts.forEach((part) => {
                    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    if (part.isImage || part.isFlag) {
                        // Placeholder: un espacio estirado al ancho reservado (textLength).
                        // El <image> se coloca encima después, midiendo su posición real.
                        // Banderas: cuadradas (aspect 1) y origen Twemoji (puede estar
                        // cargándose → dataURI null, aparece al re-render tras el fetch).
                        const aspect = part.isImage ? part.spec.aspect : 1;
                        const dataURI = part.isImage ? part.spec.dataURI : getFlagDataURI(part.flag);
                        const reserved = imageEmojiReservedWidth(lineSize, aspect);
                        tspan.setAttribute('style', `font-family: ${fontFamily}; font-size: ${lineSize}px; letter-spacing: 0px;`);
                        tspan.setAttribute('textLength', reserved);
                        // 'spacingAndGlyphs' (no 'spacing'): con un solo carácter, 'spacing'
                        // no tiene espacios entre glifos que ajustar y el textLength se
                        // ignora → el hueco quedaba más chico que la imagen y sobresalía.
                        tspan.setAttribute('lengthAdjust', 'spacingAndGlyphs');
                        tspan.textContent = ' ';
                        textElement.appendChild(tspan);
                        imageEmojisToPlace.push({ tspan: tspan, reserved: reserved, centerY: centerY, dataURI: dataURI, aspect: aspect });
                    } else {
                        tspan.setAttribute('style', `font-family: ${fontFamily}; font-size: ${part.isEmoji ? emojiSize : lineSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
                        if (part.isEmoji) {
                            const dyValue = lineSize * 0.02;
                            tspan.setAttribute('dy', dyValue.toString());
                        }
                        tspan.textContent = part.text;
                        textElement.appendChild(tspan);
                    }
                });
            } else {
                // Si no hay emojis, renderizar normalmente
                textElement.textContent = text;
            }

            svg.appendChild(textElement);
        });

        // Colocar los emoji-imagen inline: ahora que el texto está en el DOM, medimos
        // la posición real de cada hueco reservado y superponemos el <image>.
        imageEmojisToPlace.forEach((r) => {
            let startX, endX;
            try {
                startX = r.tspan.getStartPositionOfChar(0).x;
                endX = r.tspan.getEndPositionOfChar(0).x;
            } catch (e) {
                return; // si el navegador no puede medir, omitir este emoji-imagen
            }
            // Banderas todavía cargándose: el hueco queda reservado y la imagen
            // aparece en el próximo render (disparado por getFlagDataURI al resolver).
            if (!r.dataURI) return;
            const w = Math.max(endX - startX, r.reserved);
            const h = w / r.aspect;
            const imageEl = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            imageEl.setAttribute('x', startX);
            imageEl.setAttribute('y', r.centerY - h / 2);
            imageEl.setAttribute('width', w);
            imageEl.setAttribute('height', h);
            imageEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            // href y xlink:href para compatibilidad con la rasterización del export.
            imageEl.setAttribute('href', r.dataURI);
            imageEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', r.dataURI);
            svg.appendChild(imageEl);
        });

        // Actualizar valores de UI
        fontSizeValue.textContent = `${globalSize}px`;
        opacityValue.textContent = `${Math.round(opacity * 100)}%`;
        lineHeightValue.textContent = lineHeightMultiplier.toFixed(1);
        letterSpacingValue.textContent = `${letterSpacingPx}px`;
        if (textVerticalPositionValue) {
            textVerticalPositionValue.textContent = `${textVerticalOffset > 0 ? '+' : ''}${textVerticalOffset}px`;
        }

        // Mostrar/ocultar safe zones overlay
        updateSafeZones();
    }

    // Función para mostrar/ocultar las safe zones overlay
    function updateSafeZones() {
        if (!safeZonesSelect) {
            console.error('safeZonesSelect not found');
            return;
        }
        
        const selectedValue = safeZonesSelect.value;
        
        // Ocultar todas primero
        if (safeZoneOrganic) {
            safeZoneOrganic.style.display = 'none';
        }
        if (safeZonePaid) {
            safeZonePaid.style.display = 'none';
        }
        
        // Mostrar la seleccionada
        if (selectedValue === 'organic' && safeZoneOrganic) {
            safeZoneOrganic.style.display = 'block';
        } else if (selectedValue === 'paid' && safeZonePaid) {
            safeZonePaid.style.display = 'block';
        }
        // Si es 'none', no mostrar ninguna (ya están ocultas)
    }

    // Event listeners
    textInput.addEventListener('input', renderText);
    textStyle.addEventListener('change', function() {
        if (textStyle.value === 'custom') {
            customFontGroup.style.display = 'block';
        } else {
            customFontGroup.style.display = 'none';
        }
        // Usar document.fonts.load() para garantizar que la fuente esté disponible
        // antes de medir el texto con getBBox(), independientemente del estilo elegido.
        const fontFamily = getFontFamily(textStyle.value);
        const primaryFont = fontFamily.split(',')[0].trim().replace(/['"]/g, '');
        const fontSize = document.getElementById('font-size').value;
        // Invalidar mediciones cacheadas: pueden haberse tomado con fuente fallback.
        measureCache.clear();
        Promise.race([
            document.fonts.load(`${fontSize}px "${primaryFont}"`),
            new Promise(resolve => setTimeout(resolve, 600))
        ]).then(() => {
            measureCache.clear();
            renderText();
        });
    });
    
    customFontFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadCustomFont(file)
                .then(() => {
                    console.log('Custom font loaded:', customFontName);
                    measureCache.clear();
                    renderText();
                })
                .catch(error => {
                    console.error('Error loading custom font:', error);
                    alert('Error loading font file. Please make sure it\'s a valid font file (TTF, OTF, WOFF, or WOFF2).');
                });
        }
    });
    // ---- Combobox de fuentes con buscador + auto-carga de fuentes del sistema ----
    const fontSearch = document.getElementById('font-search');
    const fontList = document.getElementById('font-list');
    const fontHint = document.getElementById('font-hint');

    // Etiqueta legible de un value del <select> oculto.
    function labelForValue(value) {
        const opt = [...textStyle.options].find(o => o.value === value);
        return opt ? opt.textContent : value;
    }

    // Items del combobox a partir del <select> (estilos + fuentes del sistema).
    function getFontItems() {
        const items = [];
        [...textStyle.children].forEach(child => {
            if (child.tagName === 'OPTGROUP') {
                [...child.children].forEach(o => items.push({ value: o.value, label: o.textContent, group: child.label }));
            } else if (child.tagName === 'OPTION') {
                items.push({ value: child.value, label: child.textContent, group: 'Estilos' });
            }
        });
        return items;
    }

    let fontListActiveIndex = -1;

    function renderFontList(filter) {
        if (!fontList) return;
        const q = (filter || '').trim().toLowerCase();
        const items = getFontItems().filter(it => !q || it.label.toLowerCase().includes(q));
        fontListActiveIndex = -1;
        fontList.innerHTML = '';
        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'font-list-empty';
            empty.textContent = 'Sin coincidencias';
            fontList.appendChild(empty);
            return;
        }
        let lastGroup = null;
        items.forEach(it => {
            if (it.group !== lastGroup) {
                const g = document.createElement('div');
                g.className = 'font-list-group';
                g.textContent = it.group;
                fontList.appendChild(g);
                lastGroup = it.group;
            }
            const el = document.createElement('div');
            el.className = 'font-list-item' + (it.value === textStyle.value ? ' selected' : '');
            el.textContent = it.label;
            el.dataset.value = it.value;
            // mousedown (no click) para seleccionar antes de que el blur cierre la lista.
            el.addEventListener('mousedown', e => { e.preventDefault(); selectFont(it.value); });
            fontList.appendChild(el);
        });
    }

    function openFontList() {
        if (!fontList) return;
        renderFontList(fontSearch.value === labelForValue(textStyle.value) ? '' : fontSearch.value);
        fontList.style.display = 'block';
        fontSearch.setAttribute('aria-expanded', 'true');
    }

    function closeFontList() {
        if (!fontList) return;
        fontList.style.display = 'none';
        fontSearch.setAttribute('aria-expanded', 'false');
        fontSearch.value = labelForValue(textStyle.value);
    }

    function selectFont(value) {
        textStyle.value = value;
        fontSearch.value = labelForValue(value);
        if (fontList) { fontList.style.display = 'none'; fontSearch.setAttribute('aria-expanded', 'false'); }
        textStyle.dispatchEvent(new Event('change')); // dispara el handler existente
    }

    // Carga (una sola vez) las fuentes del sistema vía Local Font Access API.
    let systemFontsLoaded = false;
    let systemFontsLoading = false;
    async function loadSystemFonts() {
        if (systemFontsLoaded || systemFontsLoading) return;
        if (typeof window.queryLocalFonts !== 'function') {
            if (fontHint) { fontHint.style.display = 'block'; fontHint.textContent = 'Las fuentes del sistema requieren Chrome/Edge de escritorio (vía http://localhost o https).'; }
            return;
        }
        systemFontsLoading = true;
        try {
            const fontData = await window.queryLocalFonts();
            const families = [...new Set(fontData.map(f => f.family))].sort((a, b) => a.localeCompare(b));
            const prev = document.getElementById('system-fonts-group');
            if (prev) prev.remove();
            const group = document.createElement('optgroup');
            group.id = 'system-fonts-group';
            group.label = 'Fuentes del sistema';
            families.forEach(fam => {
                const opt = document.createElement('option');
                opt.value = 'sys:' + fam;
                opt.textContent = fam;
                group.appendChild(opt);
            });
            textStyle.appendChild(group);
            systemFontsLoaded = true;
            if (fontHint) fontHint.style.display = 'none';
            if (fontList && fontList.style.display === 'block') renderFontList(fontSearch.value === labelForValue(textStyle.value) ? '' : fontSearch.value);
        } catch (err) {
            console.warn('No se pudieron cargar las fuentes del sistema:', err);
            if (fontHint) { fontHint.style.display = 'block'; fontHint.textContent = 'No se pudo acceder a las fuentes del sistema (permiso denegado).'; }
        } finally {
            systemFontsLoading = false;
        }
    }

    if (fontSearch && fontList) {
        fontSearch.value = labelForValue(textStyle.value);

        // Auto-cargar las fuentes del sistema en la primera interacción con el buscador
        // (queryLocalFonts exige gesto del usuario; el click que da el foco lo provee).
        fontSearch.addEventListener('focus', function() {
            loadSystemFonts();
            fontSearch.select();
            openFontList();
        });
        fontSearch.addEventListener('input', function() {
            fontList.style.display = 'block';
            fontSearch.setAttribute('aria-expanded', 'true');
            renderFontList(fontSearch.value);
        });
        fontSearch.addEventListener('keydown', function(e) {
            const items = fontList.querySelectorAll('.font-list-item');
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                if (!items.length) return;
                fontListActiveIndex += (e.key === 'ArrowDown' ? 1 : -1);
                if (fontListActiveIndex < 0) fontListActiveIndex = items.length - 1;
                if (fontListActiveIndex >= items.length) fontListActiveIndex = 0;
                items.forEach((el, i) => el.classList.toggle('active', i === fontListActiveIndex));
                items[fontListActiveIndex].scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const target = fontListActiveIndex >= 0 ? items[fontListActiveIndex] : items[0];
                if (target) selectFont(target.dataset.value);
            } else if (e.key === 'Escape') {
                closeFontList();
                fontSearch.blur();
            }
        });
        // Cerrar al hacer click fuera del combobox.
        document.addEventListener('click', function(e) {
            const combo = document.getElementById('font-combobox');
            if (combo && !combo.contains(e.target)) closeFontList();
        });
    }

    // Mantener sincronizado el input del combobox con el value del <select>.
    function syncFontComboboxDisplay() {
        if (fontSearch) fontSearch.value = labelForValue(textStyle.value);
    }

    // Cuando una bandera Twemoji termina de descargarse, re-renderizar para mostrarla.
    onFlagLoadedRerender = renderText;

    textColor.addEventListener('input', renderText);
    bgColor.addEventListener('input', renderText);
    bgOpacity.addEventListener('input', renderText);
    fontSize.addEventListener('input', renderText);
    bold.addEventListener('change', renderText);
    italic.addEventListener('change', renderText);
    transparentBg.addEventListener('change', renderText);
    safeZonesSelect.addEventListener('change', updateSafeZones);
    textAlign.addEventListener('change', renderText);
    lineHeight.addEventListener('input', renderText);
    letterSpacing.addEventListener('input', renderText);
    borderRadiusSlider.addEventListener('input', function() {
        borderRadiusValue.textContent = borderRadiusSlider.value + 'px';
        renderText();
    });

    if (textVerticalPosition && textVerticalPositionValue) {
        textVerticalPosition.addEventListener('input', function() {
            const offset = parseInt(textVerticalPosition.value, 10) || 0;
            textVerticalPositionValue.textContent = `${offset > 0 ? '+' : ''}${offset}px`;
            renderText();
        });
    }

    // Doble click en el thumb del slider → resetear al valor por defecto.
    // Disparar 'input' sintético reutiliza la lógica existente (update de span + renderText).
    function addSliderReset(slider, defaultValue) {
        slider.addEventListener('dblclick', function() {
            slider.value = defaultValue;
            slider.dispatchEvent(new Event('input'));
        });
    }
    addSliderReset(bgOpacity, 100);
    addSliderReset(fontSize, 33);
    addSliderReset(lineHeight, 120);
    addSliderReset(letterSpacing, 0);
    addSliderReset(borderRadiusSlider, 10);
    if (textVerticalPosition) addSliderReset(textVerticalPosition, 0);
    
    // Event listeners para imagen de fondo
    if (bgImageFile && removeBgImage && bgImagePreview) {
        bgImageFile.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    backgroundImageUrl = event.target.result;
                    bgImagePreview.src = backgroundImageUrl;
                    bgImagePreview.style.display = 'block';
                    removeBgImage.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        
        removeBgImage.addEventListener('click', function() {
            backgroundImageUrl = null;
            bgImagePreview.src = '';
            bgImagePreview.style.display = 'none';
            removeBgImage.style.display = 'none';
            bgImageFile.value = '';
        });
    }

    // Descarga una Google Font y la embebe como base64 para el export.
    // Los navegadores bloquean @import URLs dentro de SVGs cargados como <img>,
    // por eso hay que embeber la fuente exactamente igual que las fuentes locales.
    async function embedGoogleFont(family, requestedWeight) {
        const singleWeightFonts = ['Meow Script', 'Bebas Neue'];
        const weight = singleWeightFonts.includes(family)
            ? '400'
            : (requestedWeight === 'bold' ? '700' : requestedWeight);
        try {
            const cssText = await fetch(
                `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`
            ).then(r => r.text());

            const declarations = [];
            for (const [, block] of cssText.matchAll(/@font-face\s*\{([^}]+)\}/g)) {
                const urlMatch  = block.match(/url\(['"]?([^'")]+)['"]?\)/);
                const fmtMatch  = block.match(/format\(['"]([^'"]+)['"]\)/);
                if (!urlMatch) continue;
                const fontUrl = urlMatch[1];
                const format  = fmtMatch ? fmtMatch[1] : 'woff2';
                const mime    = `font/${format}`;
                const b64     = arrayBufferToBase64(await fetch(fontUrl).then(r => r.arrayBuffer()));
                declarations.push(
                    `@font-face{font-family:'${family}';src:url(data:${mime};base64,${b64}) format('${format}');font-weight:${weight};font-style:normal;}`
                );
            }
            return declarations.join(' ');
        } catch (e) {
            console.warn(`No se pudo embeber la fuente "${family}":`, e);
            return '';
        }
    }

    // Función para descargar el SVG como PNG (con fuentes embebidas en base64 para que el export use la misma fuente)
    async function downloadAsPNG() {
        console.log('downloadAsPNG llamado');
        
        if (!svg || svg.children.length === 0) {
            alert('No text to download. Please write something first.');
            return;
        }
        
        try {
            // Asegurar que las banderas presentes en el texto estén descargadas (y
            // dibujadas) antes de rasterizar: si no, saldrían como un hueco vacío en el
            // PNG porque su <image> aún no existe.
            const flagsInText = textInput.value.match(FLAG_RE) || [];
            if (flagsInText.length > 0) {
                await Promise.all(flagsInText.map(loadFlag));
                renderText();
            }

            const viewBox = svg.getAttribute('viewBox');
            if (!viewBox) {
                alert('Error: The SVG does not have a viewBox defined.');
                return;
            }

            const viewBoxValues = viewBox.split(' ');
            const vbWidth = parseFloat(viewBoxValues[2]);
            const vbHeight = parseFloat(viewBoxValues[3]);
            
            let pathBBox = null;
            const paths = svg.querySelectorAll('path');
            const textElements = svg.querySelectorAll('text');
            // Las imágenes (ej. anillos olímpicos) también cuentan para el recorte,
            // si no quedarían fuera del PNG exportado.
            const imageElements = svg.querySelectorAll('image');

            if (paths.length > 0 || textElements.length > 0 || imageElements.length > 0) {
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                paths.forEach(path => {
                    try {
                        const bbox = path.getBBox();
                        minX = Math.min(minX, bbox.x);
                        minY = Math.min(minY, bbox.y);
                        maxX = Math.max(maxX, bbox.x + bbox.width);
                        maxY = Math.max(maxY, bbox.y + bbox.height);
                    } catch (e) {}
                });
                textElements.forEach(text => {
                    try {
                        const bbox = text.getBBox();
                        minX = Math.min(minX, bbox.x);
                        minY = Math.min(minY, bbox.y);
                        maxX = Math.max(maxX, bbox.x + bbox.width);
                        maxY = Math.max(maxY, bbox.y + bbox.height);
                    } catch (e) {}
                });
                imageElements.forEach(imgEl => {
                    try {
                        const bbox = imgEl.getBBox();
                        minX = Math.min(minX, bbox.x);
                        minY = Math.min(minY, bbox.y);
                        maxX = Math.max(maxX, bbox.x + bbox.width);
                        maxY = Math.max(maxY, bbox.y + bbox.height);
                    } catch (e) {}
                });
                if (minX !== Infinity) {
                    pathBBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
                }
            }
            
            const svgElement = svg.cloneNode(true);
            svgElement.setAttribute('width', vbWidth);
            svgElement.setAttribute('height', vbHeight);
            svgElement.setAttribute('viewBox', viewBox);
            svgElement.style.transform = '';
            svgElement.style.visibility = 'visible';
            
            // Embeber fuentes como data URI (base64) para que el PNG exportado use la misma fuente
            const baseUrl = window.location.href.replace(/[^/]*$/, '');
            const fontStyles = [];
            
            const mimeMap = { truetype: 'font/ttf', opentype: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };
            const formatMap = { truetype: 'truetype', opentype: 'opentype', woff: 'woff', woff2: 'woff2' };
            
            try {
                const [aveny, cosmo, proxima, sfpro] = await Promise.all([
                    fetch(baseUrl + 'Fonts/Aveny-T.ttf').then(r => r.arrayBuffer()),
                    fetch(baseUrl + 'Fonts/CosmopolitanScriptRegular.otf').then(r => r.arrayBuffer()),
                    fetch(baseUrl + 'Fonts/Proxima-Nova-Semibold.ttf').then(r => r.arrayBuffer()),
                    fetch(baseUrl + 'Fonts/SF-Pro-Display-BlackItalic.otf').then(r => r.arrayBuffer())
                ]);
                fontStyles.push(`@font-face{font-family:'Aveny-T';src:url(data:${mimeMap.truetype};base64,${arrayBufferToBase64(aveny)}) format('${formatMap.truetype}');font-weight:normal;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'CosmopolitanScript';src:url(data:${mimeMap.opentype};base64,${arrayBufferToBase64(cosmo)}) format('${formatMap.opentype}');font-weight:normal;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'Proxima-Nova-Semibold';src:url(data:${mimeMap.truetype};base64,${arrayBufferToBase64(proxima)}) format('${formatMap.truetype}');font-weight:600;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'SF-Pro-Display-BlackItalic';src:url(data:${mimeMap.opentype};base64,${arrayBufferToBase64(sfpro)}) format('${formatMap.opentype}');font-weight:900;font-style:italic;}`);
            } catch (e) {
                console.warn('No se pudieron cargar fuentes locales para export, usando URLs:', e);
                fontStyles.push(`@font-face{font-family:'Aveny-T';src:url('${baseUrl}Fonts/Aveny-T.ttf') format('truetype');font-weight:normal;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'CosmopolitanScript';src:url('${baseUrl}Fonts/CosmopolitanScriptRegular.otf') format('opentype');font-weight:normal;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'Proxima-Nova-Semibold';src:url('${baseUrl}Fonts/Proxima-Nova-Semibold.ttf') format('truetype');font-weight:600;font-style:normal;}`);
                fontStyles.push(`@font-face{font-family:'SF-Pro-Display-BlackItalic';src:url('${baseUrl}Fonts/SF-Pro-Display-BlackItalic.otf') format('opentype');font-weight:900;font-style:italic;}`);
            }
            
            if (customFontBase64 && customFontName) {
                const mime = mimeMap[customFontFormat] || 'font/ttf';
                const format = formatMap[customFontFormat] || 'truetype';
                fontStyles.push(`@font-face{font-family:'${customFontName}';src:url(data:${mime};base64,${customFontBase64}) format('${format}');font-weight:normal;font-style:normal;}`);
            }
            
            // Embeber la Google Font activa como base64 (los @import no funcionan
            // en SVGs cargados como <img> por restricciones de seguridad del browser).
            const googleFontMap = {
                'strong':       'Bebas Neue',
                'montserrat':   'Montserrat',
                'playfair':     'Playfair Display',
                'meow-script':  'Meow Script'
            };
            const activeGoogleFont = googleFontMap[textStyle.value];
            if (activeGoogleFont) {
                const currentWeight = bold.checked ? 'bold' : '600';
                const embedded = await embedGoogleFont(activeGoogleFont, currentWeight);
                if (embedded) fontStyles.push(embedded);
            }

            // @import de respaldo para browsers que sí soportan recursos externos en SVG
            fontStyles.push('@import url("https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Bebas+Neue&family=Montserrat:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Meow+Script&display=swap");');
            
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
            styleEl.setAttribute('type', 'text/css');
            styleEl.textContent = fontStyles.join(' ');
            defs.appendChild(styleEl);
            svgElement.insertBefore(defs, svgElement.firstChild);
            
            const clonedTextElements = svgElement.querySelectorAll('text');
            clonedTextElements.forEach(textEl => {
                const currentY = parseFloat(textEl.getAttribute('y')) || 0;
                const style = textEl.getAttribute('style') || '';
                const fontSizeMatch = style.match(/font-size:\s*(\d+)px/);
                const fontSize = fontSizeMatch ? parseFloat(fontSizeMatch[1]) : 33;
                const adjustment = fontSize * 0.08;
                textEl.setAttribute('y', currentY - adjustment);
            });
            
            const svgData = new XMLSerializer().serializeToString(svgElement);
            let finalSvgData = svgData;
            if (!svgData.includes('xmlns')) {
                finalSvgData = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
            }
            
            const svgBlob = new Blob([finalSvgData], { type: 'image/svg+xml;charset=utf-8' });
            const svgUrl = URL.createObjectURL(svgBlob);
            
            processSVGToPNG(svgUrl, vbWidth, vbHeight, pathBBox);
        } catch (error) {
            console.error('Error al descargar PNG:', error);
            alert('Error downloading image: ' + error.message);
        }
    }
    
    function processSVGToPNG(svgUrl, vbWidth, vbHeight, pathBBox) {
        const img = new Image();
        
        img.onload = function() {
            // Escala para alta resolución
            const scale = 1080 / vbWidth;
            const canvasWidth = Math.round(vbWidth * scale);
            const canvasHeight = Math.round(vbHeight * scale);
            
            // Crear canvas con el tamaño del viewBox escalado
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            
            // Dibujar el SVG completo en el canvas
            tempCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
            
            // Si tenemos el bounding box del path, usarlo para recortar
            // Esto garantiza que el recorte coincida exactamente con el fondo visible
            let cropX, cropY, cropWidth, cropHeight;
            
            if (pathBBox) {
                // Convertir coordenadas del viewBox a coordenadas del canvas
                cropX = Math.floor(pathBBox.x * scale);
                cropY = Math.floor(pathBBox.y * scale);
                cropWidth = Math.ceil(pathBBox.width * scale);
                cropHeight = Math.ceil(pathBBox.height * scale);
            } else {
                // Fallback: usar todo el canvas
                cropX = 0;
                cropY = 0;
                cropWidth = canvasWidth;
                cropHeight = canvasHeight;
            }
            
            // Asegurar que no nos salgamos del canvas
            cropX = Math.max(0, cropX);
            cropY = Math.max(0, cropY);
            cropWidth = Math.min(cropWidth, canvasWidth - cropX);
            cropHeight = Math.min(cropHeight, canvasHeight - cropY);
            
            console.log('Recorte:', cropX, cropY, cropWidth, 'x', cropHeight);
            
            // Crear canvas final con las dimensiones del recorte
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            finalCanvas.width = cropWidth;
            finalCanvas.height = cropHeight;
            
            // Copiar la región del path al canvas final
            finalCtx.drawImage(
                tempCanvas,
                cropX, cropY, cropWidth, cropHeight,
                0, 0, cropWidth, cropHeight
            );
            
            // Convertir el canvas final a PNG y descargar
            finalCanvas.toBlob(function(blob) {
                if (!blob) {
                    alert('Error generating image blob.');
                    URL.revokeObjectURL(svgUrl);
                    return;
                }
                
                console.log('Blob generado, tamaño:', blob.size);
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const textToFilename = document.getElementById('text-to-filename');
                let filename = 'instagram-text.png';
                if (textToFilename && textToFilename.checked) {
                    const rawText = document.getElementById('text-input').value.trim();
                    const noEmoji = rawText.replace(/\p{Emoji}/gu, '').replace(new RegExp(IMAGE_EMOJI_CHARCLASS, 'g'), '');
                    const sanitized = noEmoji.replace(/[\\/:*?"<>|\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
                    if (sanitized) filename = sanitized + '.png';
                }
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                URL.revokeObjectURL(svgUrl);
                console.log('Descarga iniciada');
            }, 'image/png');
        };
        
        img.onerror = function(e) {
            console.error('Error al cargar el SVG:', e);
            alert('Error generating image. Please try again.');
            URL.revokeObjectURL(svgUrl);
        };
        
        img.src = svgUrl;
    }
    
    // Event listener para el botón de descarga
    downloadBtn.addEventListener('click', downloadAsPNG);

    // Funcionalidad del selector de emojis
    if (emojiBtn && emojiPanel && textInput) {
        // Funciones para manejar emojis recientes
        function getRecentEmojis() {
            const recentJson = localStorage.getItem('recentEmojis');
            return recentJson ? JSON.parse(recentJson) : [];
        }

        function saveRecentEmoji(emoji) {
            let recent = getRecentEmojis();
            // Remover el emoji si ya existe
            recent = recent.filter(e => e !== emoji);
            // Agregar al principio
            recent.unshift(emoji);
            // Mantener solo los últimos 12
            recent = recent.slice(0, 12);
            localStorage.setItem('recentEmojis', JSON.stringify(recent));
        }

        // Contenido visual de un botón de emoji. Los emoji-imagen (anillos, bandera USA)
        // no tienen codepoint Unicode: el botón muestra la imagen y guarda el centinela
        // en dataset.emoji (lo que realmente se inserta en el texto).
        function applyEmojiButtonContent(btn, value) {
            const spec = IMAGE_EMOJI_BY_CHAR[value];
            if (spec || isCountryFlag(value)) {
                // Emoji-imagen (anillos) o bandera de país: el botón muestra la imagen
                // (data URI para los centinelas; Twemoji por URL para las banderas) y
                // guarda en dataset.emoji lo que se inserta realmente en el texto.
                btn.dataset.emoji = value;
                btn.title = spec ? spec.label : 'Bandera';
                const im = document.createElement('img');
                im.src = spec ? spec.dataURI : flagTwemojiUrl(value);
                im.alt = btn.title;
                im.loading = 'lazy';
                im.style.width = '1.6em';
                im.style.height = 'auto';
                im.style.verticalAlign = 'middle';
                im.style.pointerEvents = 'none';
                btn.appendChild(im);
            } else {
                btn.textContent = value;
            }
        }

        function renderRecentEmojis() {
            const recentEmojisGrid = document.getElementById('recent-emojis-grid');
            const recentEmojisSection = document.getElementById('recent-emojis-section');
            if (!recentEmojisGrid || !recentEmojisSection) return;

            const recent = getRecentEmojis();
            
            if (recent.length === 0) {
                recentEmojisSection.style.display = 'none';
                return;
            }

            recentEmojisSection.style.display = 'block';
            recentEmojisGrid.innerHTML = '';

            recent.forEach(emoji => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'emoji-item';
                applyEmojiButtonContent(button, emoji);
                button.addEventListener('click', function() {
                    const emojiText = this.dataset.emoji || this.textContent;
                    textInput.value += emojiText;
                    textInput.dispatchEvent(new Event('input'));
                    renderText();
                    saveRecentEmoji(emojiText);
                    renderRecentEmojis();
                });
                recentEmojisGrid.appendChild(button);
            });
        }

        // Toggle del panel de emojis
        emojiBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = emojiPanel.style.display === 'block';
            emojiPanel.style.display = isVisible ? 'none' : 'block';
            if (!isVisible) {
                renderRecentEmojis();
            }
        });

        // Cerrar el panel al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!emojiPanel.contains(e.target) && e.target !== emojiBtn) {
                emojiPanel.style.display = 'none';
            }
        });

        // Catálogo completo de emojis, organizado según los grupos del estándar
        // Unicode (emoji-test). Cada categoría es un string separado por espacios:
        // ningún emoji contiene espacios, y las secuencias ZWJ / variation-selector
        // quedan intactas dentro de cada token. Se omiten los modificadores de tono
        // de piel (multiplicarían x6 la lista sin aportar a un editor de texto).
        const EMOJI_CATEGORIES = [
            { title: 'Smileys & Emotion', set: '😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 🫠 😉 😊 😇 🥰 😍 🤩 😘 😗 ☺️ 😚 😙 🥲 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🫢 🫣 🤫 🤔 🫡 🤐 🤨 😐 😑 😶 🫥 😶‍🌫️ 😏 😒 🙄 😬 😮‍💨 🤥 🫨 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 😵‍💫 🤯 🤠 🥳 🥸 😎 🤓 🧐 😕 🫤 😟 🙁 ☹️ 😮 😯 😲 😳 🥺 🥹 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 ☠️ 💩 🤡 👹 👺 👻 👽 👾 🤖 😺 😸 😹 😻 😼 😽 🙀 😿 😾 🙈 🙉 🙊 💌 💘 💝 💖 💗 💓 💞 💕 💟 ❣️ 💔 ❤️‍🔥 ❤️‍🩹 ❤️ 🩷 🧡 💛 💚 💙 🩵 💜 🤎 🖤 🩶 🤍 💋 💯 💢 💥 💫 💦 💨 🕳️ 💬 👁️‍🗨️ 🗨️ 🗯️ 💭 💤' },
            { title: 'People & Body', set: '👋 🤚 🖐️ ✋ 🖖 🫱 🫲 🫳 🫴 🫷 🫸 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 🫵 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 🫶 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 🦿 🦵 🦶 👂 🦻 👃 🧠 🫀 🫁 🦷 🦴 👀 👁️ 👅 👄 🫦 👶 🧒 👦 👧 🧑 👱 👨 🧔 🧔‍♂️ 🧔‍♀️ 👨‍🦰 👨‍🦱 👨‍🦳 👨‍🦲 👩 👩‍🦰 🧑‍🦰 👩‍🦱 🧑‍🦱 👩‍🦳 🧑‍🦳 👩‍🦲 🧑‍🦲 👱‍♀️ 👱‍♂️ 🧓 👴 👵 🙍 🙍‍♂️ 🙍‍♀️ 🙎 🙎‍♂️ 🙎‍♀️ 🙅 🙅‍♂️ 🙅‍♀️ 🙆 🙆‍♂️ 🙆‍♀️ 💁 💁‍♂️ 💁‍♀️ 🙋 🙋‍♂️ 🙋‍♀️ 🧏 🧏‍♂️ 🧏‍♀️ 🙇 🙇‍♂️ 🙇‍♀️ 🤦 🤦‍♂️ 🤦‍♀️ 🤷 🤷‍♂️ 🤷‍♀️ 🧑‍⚕️ 👨‍⚕️ 👩‍⚕️ 🧑‍🎓 👨‍🎓 👩‍🎓 🧑‍🏫 👨‍🏫 👩‍🏫 🧑‍⚖️ 👨‍⚖️ 👩‍⚖️ 🧑‍🌾 👨‍🌾 👩‍🌾 🧑‍🍳 👨‍🍳 👩‍🍳 🧑‍🔧 👨‍🔧 👩‍🔧 🧑‍🏭 👨‍🏭 👩‍🏭 🧑‍💼 👨‍💼 👩‍💼 🧑‍🔬 👨‍🔬 👩‍🔬 🧑‍💻 👨‍💻 👩‍💻 🧑‍🎤 👨‍🎤 👩‍🎤 🧑‍🎨 👨‍🎨 👩‍🎨 🧑‍✈️ 👨‍✈️ 👩‍✈️ 🧑‍🚀 👨‍🚀 👩‍🚀 🧑‍🚒 👨‍🚒 👩‍🚒 👮 👮‍♂️ 👮‍♀️ 🕵️ 🕵️‍♂️ 🕵️‍♀️ 💂 💂‍♂️ 💂‍♀️ 🥷 👷 👷‍♂️ 👷‍♀️ 🫅 🤴 👸 👳 👳‍♂️ 👳‍♀️ 👲 🧕 🤵 🤵‍♂️ 🤵‍♀️ 👰 👰‍♂️ 👰‍♀️ 🤰 🫃 🫄 🤱 👼 🎅 🤶 🧑‍🎄 🦸 🦸‍♂️ 🦸‍♀️ 🦹 🦹‍♂️ 🦹‍♀️ 🧙 🧙‍♂️ 🧙‍♀️ 🧚 🧚‍♂️ 🧚‍♀️ 🧛 🧛‍♂️ 🧛‍♀️ 🧜 🧜‍♂️ 🧜‍♀️ 🧝 🧝‍♂️ 🧝‍♀️ 🧞 🧞‍♂️ 🧞‍♀️ 🧟 🧟‍♂️ 🧟‍♀️ 🧌 💆 💆‍♂️ 💆‍♀️ 💇 💇‍♂️ 💇‍♀️ 🚶 🚶‍♂️ 🚶‍♀️ 🧍 🧍‍♂️ 🧍‍♀️ 🧎 🧎‍♂️ 🧎‍♀️ 🏃 🏃‍♂️ 🏃‍♀️ 💃 🕺 🕴️ 👯 👯‍♂️ 👯‍♀️ 🧖 🧗 🤺 🏇 ⛷️ 🏂 🏌️ 🏄 🚣 🏊 ⛹️ 🏋️ 🚴 🚵 🤸 🤼 🤽 🤾 🤹 🧘 🛀 🛌 🧑‍🤝‍🧑 👭 👫 👬 💏 💑 👪 🗣️ 👤 👥 🫂 👣' },
            { title: 'Animals & Nature', set: '🐵 🐒 🦍 🦧 🐶 🐕 🦮 🐕‍🦺 🐩 🐺 🦊 🦝 🐱 🐈 🐈‍⬛ 🦁 🐯 🐅 🐆 🐴 🫎 🫏 🐎 🦄 🦓 🦌 🦬 🐮 🐂 🐃 🐄 🐷 🐖 🐗 🐽 🐏 🐑 🐐 🐪 🐫 🦙 🦒 🐘 🦣 🦏 🦛 🐭 🐁 🐀 🐹 🐰 🐇 🐿️ 🦫 🦔 🦇 🐻 🐻‍❄️ 🐨 🐼 🦥 🦦 🦨 🦘 🦡 🐾 🦃 🐔 🐓 🐣 🐤 🐥 🐦 🐧 🕊️ 🦅 🦆 🦢 🦉 🦤 🪶 🦩 🦚 🦜 🪽 🐦‍⬛ 🪿 🐸 🐊 🐢 🦎 🐍 🐲 🐉 🦕 🦖 🐳 🐋 🐬 🦭 🐟 🐠 🐡 🦈 🐙 🐚 🪸 🪼 🐌 🦋 🐛 🐜 🐝 🪲 🐞 🦗 🪳 🕷️ 🕸️ 🦂 🦟 🪰 🪱 🦠 💐 🌸 💮 🪷 🏵️ 🌹 🥀 🌺 🌻 🌼 🌷 🪻 🌱 🪴 🌲 🌳 🌴 🌵 🌾 🌿 ☘️ 🍀 🍁 🍂 🍃 🪹 🪺 🍄 🪵 🌰' },
            { title: 'Food & Drink', set: '🍇 🍈 🍉 🍊 🍋 🍋‍🟩 🍌 🍍 🥭 🍎 🍏 🍐 🍑 🍒 🍓 🫐 🥝 🍅 🫒 🥥 🥑 🍆 🥔 🥕 🌽 🌶️ 🫑 🥒 🥬 🥦 🧄 🧅 🥜 🫘 🫚 🫛 🍞 🥐 🥖 🫓 🥨 🥯 🥞 🧇 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🫔 🥙 🧆 🥚 🍳 🥘 🍲 🫕 🥣 🥗 🍿 🧈 🧂 🥫 🍱 🍘 🍙 🍚 🍛 🍜 🍝 🍠 🍢 🍣 🍤 🍥 🥮 🍡 🥟 🥠 🥡 🦀 🦞 🦐 🦑 🦪 🍦 🍧 🍨 🍩 🍪 🎂 🍰 🧁 🥧 🍫 🍬 🍭 🍮 🍯 🍼 🥛 ☕ 🫖 🍵 🍶 🍾 🍷 🍸 🍹 🍺 🍻 🥂 🥃 🫗 🥤 🧋 🧃 🧉 🧊 🥢 🍽️ 🍴 🥄 🔪 🫙 🏺' },
            { title: 'Travel & Places', set: '🌍 🌎 🌏 🌐 🗺️ 🗾 🧭 🏔️ ⛰️ 🌋 🗻 🏕️ 🏖️ 🏜️ 🏝️ 🏞️ 🏟️ 🏛️ 🏗️ 🧱 🪨 🛖 🏘️ 🏚️ 🏠 🏡 🏢 🏣 🏤 🏥 🏦 🏨 🏩 🏪 🏫 🏬 🏭 🏯 🏰 💒 🗼 🗽 ⛪ 🕌 🛕 🕍 ⛩️ 🕋 ⛲ ⛺ 🌁 🌃 🏙️ 🌄 🌅 🌆 🌇 🌉 ♨️ 🎠 🛝 🎡 🎢 💈 🎪 🚂 🚃 🚄 🚅 🚆 🚇 🚈 🚉 🚊 🚝 🚞 🚋 🚌 🚍 🚎 🚐 🚑 🚒 🚓 🚔 🚕 🚖 🚗 🚘 🚙 🛻 🚚 🚛 🚜 🏎️ 🏍️ 🛵 🦽 🦼 🛺 🚲 🛴 🛹 🛼 🚏 🛣️ 🛤️ 🛢️ ⛽ 🛞 🚨 🚥 🚦 🛑 🚧 ⚓ 🛟 ⛵ 🛶 🚤 🛳️ ⛴️ 🛥️ 🚢 ✈️ 🛩️ 🛫 🛬 🪂 💺 🚁 🚟 🚠 🚡 🛰️ 🚀 🛸 🛎️ 🧳 ⌛ ⏳ ⌚ ⏰ ⏱️ ⏲️ 🕰️ 🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌙 🌚 🌛 🌜 🌡️ ☀️ 🌝 🌞 🪐 ⭐ 🌟 🌠 🌌 ☁️ ⛅ ⛈️ 🌤️ 🌥️ 🌦️ 🌧️ 🌨️ 🌩️ 🌪️ 🌫️ 🌬️ 🌀 🌈 🌂 ☂️ ☔ ⛱️ ⚡ ❄️ ☃️ ⛄ ☄️ 🔥 💧 🌊' },
            { title: 'Activities', set: '🎃 🎄 🎆 🎇 🧨 ✨ 🎈 🎉 🎊 🎋 🎍 🎎 🎏 🎐 🎑 🧧 🎀 🎁 🎗️ 🎟️ 🎫 🎖️ 🏆 🏅 🥇 🥈 🥉 ⚽ ⚾ 🥎 🏀 🏐 🏈 🏉 🎾 🥏 🎳 🏏 🏑 🏒 🥍 🏓 🏸 🥊 🥋 🥅 ⛳ ⛸️ 🎣 🤿 🎽 🎿 🛷 🥌 🎯 🪀 🪁 🔫 🎱 🔮 🪄 🎮 🕹️ 🎰 🎲 🧩 🧸 🪅 🪩 🪆 ♠️ ♥️ ♦️ ♣️ ♟️ 🃏 🀄 🎴 🎭 🖼️ 🎨 🧵 🪡 🧶 🪢' },
            { title: 'Objects', set: '👓 🕶️ 🥽 🥼 🦺 👔 👕 👖 🧣 🧤 🧥 🧦 👗 👘 🥻 🩱 🩲 🩳 👙 👚 🪭 👛 👜 👝 🛍️ 🎒 🩴 👞 👟 🥾 🥿 👠 👡 🩰 👢 🪮 👑 👒 🎩 🎓 🧢 🪖 ⛑️ 📿 💄 💍 💎 🔇 🔈 🔉 🔊 📢 📣 📯 🔔 🔕 🎼 🎵 🎶 🎙️ 🎚️ 🎛️ 🎤 🎧 📻 🎷 🪗 🎸 🎹 🎺 🎻 🪕 🥁 🪘 🪇 🪈 📱 📲 ☎️ 📞 📟 📠 🔋 🪫 🔌 💻 🖥️ 🖨️ ⌨️ 🖱️ 🖲️ 💽 💾 💿 📀 🧮 🎥 🎞️ 📽️ 🎬 📺 📷 📸 📹 📼 🔍 🔎 🕯️ 💡 🔦 🏮 🪔 📔 📕 📖 📗 📘 📙 📚 📓 📒 📃 📜 📄 📰 🗞️ 📑 🔖 🏷️ 💰 🪙 💴 💵 💶 💷 💸 💳 🧾 💹 ✉️ 📧 📨 📩 📤 📥 📦 📫 📪 📬 📭 📮 🗳️ ✏️ ✒️ 🖋️ 🖊️ 🖌️ 🖍️ 📝 💼 📁 📂 🗂️ 📅 📆 🗒️ 🗓️ 📇 📈 📉 📊 📋 📌 📍 📎 🖇️ 📏 📐 ✂️ 🗃️ 🗄️ 🗑️ 🔒 🔓 🔏 🔐 🔑 🗝️ 🔨 🪓 ⛏️ ⚒️ 🛠️ 🗡️ ⚔️ 💣 🪃 🏹 🛡️ 🪚 🔧 🪛 🔩 ⚙️ 🗜️ ⚖️ 🦯 🔗 ⛓️‍💥 ⛓️ 🪝 🧰 🧲 🪜 ⚗️ 🧪 🧫 🧬 🔬 🔭 📡 💉 🩸 💊 🩹 🩼 🩺 🩻 🚪 🛗 🪞 🪟 🛏️ 🛋️ 🪑 🚽 🪠 🚿 🛁 🪤 🪒 🧴 🧷 🧹 🧺 🧻 🪣 🧼 🫧 🪥 🧽 🧯 🛒 🚬 ⚰️ 🪦 ⚱️ 🧿 🪬 🗿 🪧 🪪' },
            { title: 'Symbols', set: '🏧 🚮 🚰 ♿ 🚹 🚺 🚻 🚼 🚾 🛂 🛃 🛄 🛅 ⚠️ 🚸 ⛔ 🚫 🚳 🚭 🚯 🚱 🚷 📵 🔞 ☢️ ☣️ ⬆️ ↗️ ➡️ ↘️ ⬇️ ↙️ ⬅️ ↖️ ↕️ ↔️ ↩️ ↪️ ⤴️ ⤵️ 🔃 🔄 🔙 🔚 🔛 🔜 🔝 🛐 ⚛️ 🕉️ ✡️ ☸️ ☯️ ✝️ ☦️ ☪️ ☮️ 🕎 🔯 🪯 ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ ⛎ 🔀 🔁 🔂 ▶️ ⏩ ⏭️ ⏯️ ◀️ ⏪ ⏮️ 🔼 ⏫ 🔽 ⏬ ⏸️ ⏹️ ⏺️ ⏏️ 🎦 🔅 🔆 📶 🛜 📳 📴 ♀️ ♂️ ⚧️ ✖️ ➕ ➖ ➗ 🟰 ♾️ ‼️ ⁉️ ❓ ❔ ❕ ❗ 〰️ 💱 💲 ⚕️ ♻️ ⚜️ 🔱 📛 🔰 ⭕ ✅ ☑️ ✔️ ❌ ❎ ➰ ➿ 〽️ ✳️ ✴️ ❇️ ©️ ®️ ™️ #️⃣ *️⃣ 0️⃣ 1️⃣ 2️⃣ 3️⃣ 4️⃣ 5️⃣ 6️⃣ 7️⃣ 8️⃣ 9️⃣ 🔟 🔠 🔡 🔢 🔣 🔤 🅰️ 🆎 🅱️ 🆑 🆒 🆓 ℹ️ 🆔 Ⓜ️ 🆕 🆖 🅾️ 🆗 🅿️ 🆘 🆙 🆚 🈁 🈂️ 🈷️ 🈶 🈯 🉐 🈹 🈚 🈲 🉑 🈸 🈴 🈳 ㊗️ ㊙️ 🈺 🈵 🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫ ⚪ 🟥 🟧 🟨 🟩 🟦 🟪 🟫 ⬛ ⬜ ◼️ ◻️ ◾ ◽ ▪️ ▫️ 🔶 🔷 🔸 🔹 🔺 🔻 💠 🔘 🔳 🔲' },
            { title: 'Flags', set: '🏁 🚩 🎌 🏴 🏳️ 🏳️‍🌈 🏳️‍⚧️ 🏴‍☠️ 🇦🇷 🇧🇷 🇨🇱 🇺🇾 🇵🇾 🇧🇴 🇵🇪 🇨🇴 🇻🇪 🇪🇨 🇲🇽 🇺🇸 🇨🇦 🇪🇸 🇵🇹 🇫🇷 🇮🇹 🇩🇪 🇬🇧 🇮🇪 🇳🇱 🇧🇪 🇨🇭 🇦🇹 🇸🇪 🇳🇴 🇩🇰 🇫🇮 🇵🇱 🇷🇺 🇺🇦 🇬🇷 🇹🇷 🇯🇵 🇨🇳 🇰🇷 🇮🇳 🇮🇩 🇹🇭 🇻🇳 🇵🇭 🇦🇺 🇳🇿 🇿🇦 🇪🇬 🇲🇦 🇳🇬 🇮🇱 🇸🇦 🇦🇪 🇪🇺' },
        ];

        function buildEmojiPicker() {
            // Sección especial: anillos olímpicos (emoji-imagen, sin codepoint Unicode).
            // Se agrega primero para que quede arriba de todo, justo bajo "Recently Used".
            const specialSection = document.createElement('div');
            specialSection.className = 'emoji-section';
            const specialTitle = document.createElement('div');
            specialTitle.className = 'emoji-section-title';
            specialTitle.textContent = 'Especiales';
            specialSection.appendChild(specialTitle);
            const specialGrid = document.createElement('div');
            specialGrid.className = 'emoji-grid';
            IMAGE_EMOJIS.forEach(spec => {
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'emoji-item';
                applyEmojiButtonContent(b, spec.char);
                specialGrid.appendChild(b);
            });
            specialSection.appendChild(specialGrid);
            emojiPanel.appendChild(specialSection);

            const seen = new Set();
            EMOJI_CATEGORIES.forEach(cat => {
                const emojis = cat.set.split(/\s+/).filter(e => e && !seen.has(e));
                emojis.forEach(e => seen.add(e));
                if (emojis.length === 0) return;

                const section = document.createElement('div');
                section.className = 'emoji-section';

                const title = document.createElement('div');
                title.className = 'emoji-section-title';
                title.textContent = cat.title;
                section.appendChild(title);

                const grid = document.createElement('div');
                grid.className = 'emoji-grid';
                emojis.forEach(e => {
                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'emoji-item';
                    applyEmojiButtonContent(btn, e);
                    grid.appendChild(btn);
                });
                section.appendChild(grid);

                // Se agrega al final del panel, quedando después de "Recently Used".
                emojiPanel.appendChild(section);
            });
        }

        buildEmojiPicker();

        // Agregar emoji al final del texto
        const emojiItems = emojiPanel.querySelectorAll('.emoji-item');
        emojiItems.forEach(item => {
            item.addEventListener('click', function() {
                const emoji = this.dataset.emoji || this.textContent;
                textInput.value += emoji;
                textInput.dispatchEvent(new Event('input'));
                renderText();
                saveRecentEmoji(emoji);
                renderRecentEmojis();
            });
        });

        // Inicializar emojis recientes al cargar
        renderRecentEmojis();
    }

    // Funcionalidad de Presets
    function getPresets() {
        const presetsJson = localStorage.getItem('textEditorPresets');
        return presetsJson ? JSON.parse(presetsJson) : {};
    }

    function savePresets(presets) {
        localStorage.setItem('textEditorPresets', JSON.stringify(presets));
    }

    function updatePresetSelect() {
        if (!presetSelect) return;
        const presets = getPresets();
        presetSelect.innerHTML = '<option value="">-- Select a preset --</option>';
        
        Object.keys(presets).forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            presetSelect.appendChild(option);
        });
    }

    function saveCurrentPreset() {
        const presetName = prompt('Enter a name for this preset:');
        if (!presetName || presetName.trim() === '') return;

        const preset = {
            text: textInput.value,
            textStyle: textStyle.value,
            textColor: textColor.value,
            bgColor: bgColor.value,
            bgOpacity: bgOpacity.value,
            fontSize: fontSize.value,
            lineHeight: lineHeight.value,
            letterSpacing: letterSpacing.value,
            borderRadius: borderRadiusSlider.value,
            textVerticalPosition: textVerticalPosition.value,
            bold: bold.checked,
            italic: italic.checked,
            transparentBg: transparentBg.checked,
            textAlign: textAlign.value,
            safeZones: safeZonesSelect ? safeZonesSelect.value : 'none',
            backgroundImageUrl: backgroundImageUrl,
            perLineSizes: perLineSizes.slice()
        };

        const presets = getPresets();
        presets[presetName] = preset;
        savePresets(presets);
        updatePresetSelect();
        alert(`Preset "${presetName}" saved successfully!`);
    }

    function loadPreset(presetName) {
        const presets = getPresets();
        const preset = presets[presetName];
        if (!preset) return;

        // Aplicar valores del preset
        textInput.value = preset.text || '';
        textStyle.value = preset.textStyle || 'classic';
        syncFontComboboxDisplay();
        textColor.value = preset.textColor || '#000000';
        bgColor.value = preset.bgColor || '#ffffff';
        bgOpacity.value = preset.bgOpacity || 100;
        fontSize.value = preset.fontSize || 33;
        lineHeight.value = preset.lineHeight || 120;
        letterSpacing.value = preset.letterSpacing || 0;
        borderRadiusSlider.value = preset.borderRadius || 10;
        if (textVerticalPosition) {
            textVerticalPosition.value = preset.textVerticalPosition || 0;
        }
        bold.checked = preset.bold || false;
        italic.checked = preset.italic || false;
        transparentBg.checked = preset.transparentBg || false;
        textAlign.value = preset.textAlign || 'center';
        
        if (safeZonesSelect) {
            safeZonesSelect.value = preset.safeZones || 'none';
        }

        perLineSizes = Array.isArray(preset.perLineSizes) ? preset.perLineSizes.slice() : [];
        perLineUISignature = '';

        // Actualizar valores mostrados
        opacityValue.textContent = `${Math.round(bgOpacity.value)}%`;
        fontSizeValue.textContent = `${fontSize.value}px`;
        lineHeightValue.textContent = (lineHeight.value / 100).toFixed(1);
        letterSpacingValue.textContent = `${letterSpacing.value}px`;
        borderRadiusValue.textContent = `${borderRadiusSlider.value}px`;
        if (textVerticalPosition && textVerticalPositionValue) {
            const verticalOffset = parseInt(textVerticalPosition.value, 10) || 0;
            textVerticalPositionValue.textContent = `${verticalOffset > 0 ? '+' : ''}${verticalOffset}px`;
        }

        // Manejar imagen de fondo si existe
        if (preset.backgroundImageUrl && bgImagePreview) {
            backgroundImageUrl = preset.backgroundImageUrl;
            bgImagePreview.src = backgroundImageUrl;
            bgImagePreview.style.display = 'block';
            if (removeBgImage) removeBgImage.style.display = 'block';
        } else {
            backgroundImageUrl = null;
            if (bgImagePreview) bgImagePreview.style.display = 'none';
            if (removeBgImage) removeBgImage.style.display = 'none';
        }

        // Renderizar con los nuevos valores
        renderText();
    }

    // Event listeners para presets
    if (savePresetBtn) {
        savePresetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            try {
                saveCurrentPreset();
            } catch (error) {
                console.error('Error saving preset:', error);
                alert('Error saving preset: ' + error.message);
            }
        });
    }

    if (presetSelect) {
        presetSelect.addEventListener('change', function() {
            if (this.value) {
                try {
                    loadPreset(this.value);
                    // Resetear el selector después de cargar
                    setTimeout(() => {
                        this.value = '';
                    }, 100);
                } catch (error) {
                    console.error('Error loading preset:', error);
                    alert('Error loading preset: ' + error.message);
                }
            }
        });
    }

    // Inicializar valores mostrados
    borderRadiusValue.textContent = borderRadiusSlider.value + 'px';
    if (textVerticalPositionValue) {
        textVerticalPositionValue.textContent = '0px';
    }
    
    // Inicializar lista de presets
    if (presetSelect) {
        try {
            updatePresetSelect();
        } catch (error) {
            console.error('Error updating preset select:', error);
        }
    }
    
    // Inicializar
    renderText();

    // Las @font-face locales pueden no estar listas en el primer render.
    // Cuando lo estén, invalidar el cache de mediciones (que pudo cachear con fallback) y re-renderizar.
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
            measureCache.clear();
            renderText();
        });
    }

    // Funcionalidad de arrastrar el SVG
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    svg.addEventListener('mousedown', dragStart);
    svg.addEventListener('touchstart', dragStart);

    function dragStart(e) {
        if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX - xOffset;
            initialY = e.touches[0].clientY - yOffset;
        } else {
            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;
        }

        if (e.target === svg || svg.contains(e.target)) {
            isDragging = true;
        }
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    function drag(e) {
        if (isDragging) {
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            xOffset = currentX;
            yOffset = currentY;

            setTranslate(currentX, currentY, svg);
        }
    }

    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    function dragEnd() {
        initialX = currentX;
        initialY = currentY;
        isDragging = false;
    }

    function setTranslate(xPos, yPos, el) {
        el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    }
}
