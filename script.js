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
            const hasEmoji = containsEmoji(line);

            let textWidth;
            if (hasEmoji) {
                const strippedLine = stripInvisibleModifiers(line);
                textWidth = measureTextWidth(strippedLine, fontFamily, lineSize, fontWeight, fontStyle, letterSpacingPx);
                const emojiMatches = line.match(emojiRegex);
                if (emojiMatches && emojiMatches.length > 0) {
                    // Compensar el espacio extra que ocupan los emojis SVG (~28% asimétrico)
                    textWidth -= emojiMatches.length * (lineSize * 0.28);
                }
            } else {
                textWidth = measureTextWidth(line, fontFamily, lineSize, fontWeight, fontStyle, letterSpacingPx);
            }

            // Sólo forzar un mínimo cuando la línea está vacía (placeholder).
            if (!line || line.trim() === '') {
                textWidth = Math.max(textWidth, lineSize * 0.5);
            }

            lineMetrics.push({
                text: line,
                width: textWidth,
                height: lineBoxHeight,
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

                // Detectar emojis en los bordes para la corrección posterior
                const lineTextForBoundary = stripInvisibleModifiers(lineMetric.text).trim();
                emojiRegex.lastIndex = 0;
                const firstBMatch = emojiRegex.exec(lineTextForBoundary);
                const firstCharIsEmoji = firstBMatch !== null && firstBMatch.index === 0;
                emojiRegex.lastIndex = 0;
                let lastBMatch = null, scanBMatch;
                while ((scanBMatch = emojiRegex.exec(lineTextForBoundary)) !== null) {
                    lastBMatch = scanBMatch;
                }
                const lastCharIsEmoji = lastBMatch !== null &&
                    (lastBMatch.index + lastBMatch[0].length) === lineTextForBoundary.length;

                return { width, shiftLeft, shiftRight, top, bottom, firstCharIsEmoji, lastCharIsEmoji };
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
                if (rect.firstCharIsEmoji) rect.shiftLeft += offset;
                if (rect.lastCharIsEmoji) rect.shiftRight -= offset;
                if (rect.firstCharIsEmoji || rect.lastCharIsEmoji) {
                    rect.width = rect.shiftRight - rect.shiftLeft;
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
            
            // Solo dividir si la línea contiene emojis
            if (lineMetric.hasEmoji) {
                // Dividir el texto usando el regex de emojis
                const parts = [];
                let lastIndex = 0;
                let match;
                
                // Resetear el regex
                emojiRegex.lastIndex = 0;
                
                while ((match = emojiRegex.exec(text)) !== null) {
                    // Agregar texto antes del emoji
                    if (match.index > lastIndex) {
                        parts.push({
                            text: text.substring(lastIndex, match.index),
                            isEmoji: false
                        });
                    }
                    // Agregar el emoji
                    parts.push({
                        text: match[0],
                        isEmoji: true
                    });
                    lastIndex = match.index + match[0].length;
                }
                
                // Agregar texto restante después del último emoji
                if (lastIndex < text.length) {
                    parts.push({
                        text: text.substring(lastIndex),
                        isEmoji: false
                    });
                }
                
                // Renderizar cada parte con su tamaño correspondiente
                parts.forEach((part, index) => {
                    const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                    tspan.setAttribute('style', `font-family: ${fontFamily}; font-size: ${part.isEmoji ? emojiSize : lineSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
                    if (part.isEmoji) {
                        const dyValue = lineSize * 0.02;
                        tspan.setAttribute('dy', dyValue.toString());
                    }
                    tspan.textContent = part.text;
                    textElement.appendChild(tspan);
                });
            } else {
                // Si no hay emojis, renderizar normalmente
                textElement.textContent = text;
            }
            
            svg.appendChild(textElement);
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
            
            if (paths.length > 0 || textElements.length > 0) {
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
                    const noEmoji = rawText.replace(/\p{Emoji}/gu, '');
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
                button.textContent = emoji;
                button.addEventListener('click', function() {
                    const emojiText = this.textContent;
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

        // Agregar emoji al final del texto
        const emojiItems = emojiPanel.querySelectorAll('.emoji-item');
        emojiItems.forEach(item => {
            item.addEventListener('click', function() {
                const emoji = this.textContent;
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
