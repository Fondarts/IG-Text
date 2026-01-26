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
    const bgImageFile = document.getElementById('bg-image-file');
    const removeBgImage = document.getElementById('remove-bg-image');
    const bgImagePreview = document.getElementById('bg-image-preview');
    const downloadBtn = document.getElementById('download-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPanel = document.getElementById('emoji-panel');

    // Verificar que todos los elementos esenciales existan
    if (!textInput || !svg || !textStyle || !customFontGroup || !customFontFile || !textColor || !bgColor || 
        !bgOpacity || !opacityValue || !fontSize || !fontSizeValue || 
        !bold || !italic || !transparentBg || !textAlign || !downloadBtn ||
        !lineHeight || !lineHeightValue || !letterSpacing || !letterSpacingValue) {
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

    // borderRadius fijo para las esquinas
    const borderRadius = 10;
    
    // Variable para la imagen de fondo
    let backgroundImageUrl = null;

    // Variable para almacenar el nombre de la fuente personalizada
    let customFontName = null;

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
                
                // Crear URL del blob
                const blob = new Blob([fontData], { type: `font/${format}` });
                const url = URL.createObjectURL(blob);
                
                // Eliminar fuente anterior si existe
                const existingStyle = document.getElementById('custom-font-style');
                if (existingStyle) {
                    existingStyle.remove();
                }
                
                // Crear nuevo estilo para la fuente
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
            custom: customFontName ? `${customFontName}, sans-serif` : 'Arial, sans-serif'
        };
        return fonts[style] || fonts.classic;
    }


    // Función para dividir texto en líneas que quepan en el ancho disponible
    function wrapText(text, maxWidth, fontFamily, fontSize, fontWeight, fontStyle, letterSpacingPx) {
        const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tempGroup.style.visibility = 'hidden';
        tempGroup.style.opacity = '0';
        tempGroup.style.position = 'absolute';
        svg.appendChild(tempGroup);

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach((word, index) => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const testElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            testElement.setAttribute('x', '0');
            testElement.setAttribute('y', '0');
            testElement.textContent = testLine;
            testElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${fontSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
            tempGroup.appendChild(testElement);
            
            const bbox = testElement.getBBox();
            const testWidth = bbox.width;
            
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
            
            tempGroup.removeChild(testElement);
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        svg.removeChild(tempGroup);
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
        const size = Math.max(parseInt(sliderValue, 10) || 33, 25);
        
        // PADDING PROPORCIONAL AL TAMAÑO DE FUENTE
        // El padding escala con el tamaño de la fuente para mantener proporciones consistentes
        // ~42% del tamaño de fuente da un padding visual equilibrado
        const padding = Math.round(size * 0.42);
        
        const isBold = bold.checked;
        const isItalic = italic.checked;
        const isTransparent = transparentBg.checked;
        const alignment = textAlign.value;
        const lineHeightMultiplier = lineHeight.value / 100; // Convert 80-200 to 0.8-2.0
        const letterSpacingPx = parseInt(letterSpacing.value, 10) || 0;

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

        let availableWidth = referenceWidth - (padding * 2);

        // Dividir el texto en líneas manuales primero
        const manualLines = text.split('\n');
        const wrappedLines = [];

        // Aplicar ajuste de líneas a cada línea manual
        manualLines.forEach((line) => {
            if (line.trim() === '' && manualLines.length === 1) {
                wrappedLines.push(' ');
            } else if (line.trim() !== '') {
                const wrapped = wrapText(line.trim(), availableWidth - (padding * 2), fontFamily, size, fontWeight, fontStyle, letterSpacingPx);
                wrappedLines.push(...wrapped);
            }
        });

        if (wrappedLines.length === 0) return;

        // Crear un grupo temporal para medir el texto
        const tempGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tempGroup.style.visibility = 'hidden';
        tempGroup.style.opacity = '0';
        tempGroup.style.position = 'absolute';
        
        // Crear elementos de texto para medir cada línea
        const lineElements = [];
        const lineMetrics = [];

        wrappedLines.forEach((line) => {
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', '0');
            textElement.setAttribute('y', '0');
            textElement.textContent = line || ' ';
            textElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
            tempGroup.appendChild(textElement);
            lineElements.push(textElement);
        });

        // Agregar temporalmente al SVG para medir
        svg.appendChild(tempGroup);
        
        // Calcular la altura de línea consistente basada en el tamaño de fuente y el multiplicador
        const calculatedLineHeight = size * lineHeightMultiplier;
        
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
        
        // Medir cada línea - crear elementos de medición sin modificadores invisibles
        // para obtener el ancho visual real
        // NOTA: Ahora el posicionamiento del texto NO incluye el padding del fondo
        // El padding se aplicará uniformemente cuando se dibuje el fondo
        let currentY = 0;
        wrappedLines.forEach((line, index) => {
            const textElement = lineElements[index];
            
            // Usar altura consistente para todas las líneas
            const lineBoxHeight = calculatedLineHeight;
            
            // Detectar si la línea contiene emojis
            const hasEmoji = containsEmoji(line);
            
            // Para obtener el ancho visual correcto, medimos el texto sin modificadores invisibles
            // Esto es porque los variation selectors agregan ancho en getBBox pero son invisibles
            let textWidth;
            
            if (hasEmoji) {
                // Crear un elemento temporal con el texto sin modificadores para medir
                const strippedLine = stripInvisibleModifiers(line);
                const measureElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                measureElement.setAttribute('x', '0');
                measureElement.setAttribute('y', '0');
                measureElement.textContent = strippedLine;
                measureElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
                svg.appendChild(measureElement);
                
                const strippedBBox = measureElement.getBBox();
                textWidth = strippedBBox.width;
                
                svg.removeChild(measureElement);
                
                // Ajuste para emojis: los emojis SVG tienden a tener espacio interno
                // asimétrico (más espacio a la derecha). Compensamos ~20% del tamaño
                // por cada emoji para lograr padding visual uniforme
                const emojiMatches = line.match(emojiRegex);
                if (emojiMatches && emojiMatches.length > 0) {
                    textWidth -= emojiMatches.length * (size * 0.20);
                }
            } else {
                // Para texto sin emojis, usar getBBox directamente
                const bbox = textElement.getBBox();
                textWidth = bbox.width;
            }
            
            // Asegurarse de que el ancho no sea menor que un mínimo razonable
            const minTextWidth = size * 0.5;
            if (textWidth < minTextWidth) {
                textWidth = minTextWidth;
            }
            
            // lineMetric.y es el centro de la caja de línea, SIN padding
            // El padding se agrega uniformemente cuando se dibuja el fondo
            lineMetrics.push({
                text: line,
                width: textWidth,
                height: lineBoxHeight,
                x: 0, // Se calculará según alineación
                y: currentY + lineBoxHeight / 2, // Centro de la línea
                hasEmoji: hasEmoji
            });
            
            currentY += lineBoxHeight;
        });

        // Remover el grupo temporal
        svg.removeChild(tempGroup);

        // Calcular dimensiones totales
        let tempMaxWidth = 0;
        lineMetrics.forEach(m => {
            tempMaxWidth = Math.max(tempMaxWidth, m.width);
        });
        // Asegurar que maxWidth no exceda el ancho disponible del contenedor
        const maxWidth = Math.min(tempMaxWidth + (padding * 2), referenceWidth);
        const totalHeight = lineMetrics.reduce((sum, m) => sum + m.height, 0) + (padding * 2);
        
        // Recalcular posiciones X según la alineación
        // NOTA: Las posiciones del texto ahora son relativas al área de contenido (sin padding)
        // El padding se aplicará uniformemente cuando se dibuje el fondo y se posicione el texto
        lineMetrics.forEach((metric) => {
            if (alignment === 'center') {
                // Para centrado, usamos el centro del área de referencia
                metric.x = referenceWidth / 2;
            } else if (alignment === 'right') {
                // Alineación derecha: el texto termina en referenceWidth - padding
                metric.x = referenceWidth - padding;
            } else {
                // Izquierda: el texto empieza en padding
                metric.x = padding;
            }
        });

        // Convertir color de fondo a rgba
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        // IMPLEMENTACIÓN EXACTA basada en el código de Stack Overflow
        // Source: https://stackoverflow.com/a/49288455 (luca992)
        if (!isTransparent) {
            const bgRgba = hexToRgba(backgroundColor, opacity);
            const r = borderRadius;
            
            // Pre-calculate all line dimensions first
            // NOTA: lineMetric.y es el centro de cada línea de texto
            // El padding horizontal ya está incluido en el ancho
            // El padding vertical SOLO se aplica al borde EXTERNO superior e inferior del bloque completo
            const lineRects = lineMetrics.map((lineMetric, lnum) => {
                const textWidth = lineMetric.width;
                // Ancho total del fondo = ancho del texto + padding uniforme en ambos lados
                let width = textWidth + 2 * padding;
                
                let shiftLeft, shiftRight;
                if (alignment === 'right') {
                    // Alineación derecha: el texto termina en lineMetric.x
                    // El fondo debe extenderse padding más a la derecha
                    shiftRight = lineMetric.x + padding;
                    shiftLeft = shiftRight - width;
                } else if (alignment === 'left') {
                    // Alineación izquierda: el texto empieza en lineMetric.x
                    // El fondo debe empezar padding antes
                    shiftLeft = lineMetric.x - padding;
                    shiftRight = shiftLeft + width;
                } else {
                    // Centro: el texto está centrado en lineMetric.x
                    // El fondo debe estar igualmente centrado
                    shiftLeft = lineMetric.x - (width / 2);
                    shiftRight = lineMetric.x + (width / 2);
                }
                
                // Asegurar que no se salga del área visible
                if (shiftLeft < 0) {
                    shiftLeft = 0;
                    shiftRight = width;
                }
                if (shiftRight > referenceWidth) {
                    shiftRight = referenceWidth;
                    shiftLeft = referenceWidth - width;
                }
                
                // Calcular posiciones verticales del fondo
                // lineMetric.y es el centro vertical de la línea de texto (sin incluir padding)
                // El texto se renderiza en y + padding (ver más abajo)
                // Por lo tanto, el centro real del texto en el SVG es: lineMetric.y + padding
                const textCenterY = lineMetric.y + padding;
                
                // PADDING UNIFORME: Usar exactamente el mismo padding en todos los lados
                // El padding horizontal es exactamente 'padding' desde el borde del texto
                // Para el vertical, ajustamos según las astas ascendentes y descendentes
                const halfLineHeight = lineMetric.height / 2;
                const isFirstLine = (lnum === 0);
                const isLastLine = (lnum === lineMetrics.length - 1);
                
                // Detectar astas en la línea actual
                const lineText = lineMetric.text;
                const lineHasAscenders = hasAscenders(lineText);
                const lineHasDescenders = hasDescenders(lineText);
                
                // Factor base para la mitad visual del texto (sin astas)
                // Letras minúsculas sin astas ocupan ~45% del tamaño de fuente
                const baseHalfHeight = size * 0.22;
                
                // Ajuste adicional para astas (las astas agregan ~30% extra)
                const ascenderExtra = lineHasAscenders ? size * 0.12 : 0;
                const descenderExtra = lineHasDescenders ? size * 0.08 : 0;
                
                // Calcular los bordes de la caja de línea
                // Para líneas intermedias, usamos halfLineHeight para que no se solapen
                let top = textCenterY - halfLineHeight;
                let bottom = textCenterY + halfLineHeight;
                
                // Para los bordes externos, usamos padding ajustado por astas
                if (isFirstLine) {
                    // Si hay ascendentes, el texto se extiende más arriba
                    top = textCenterY - baseHalfHeight - ascenderExtra - padding;
                }
                if (isLastLine) {
                    // Si hay descendentes, el texto se extiende más abajo
                    bottom = textCenterY + baseHalfHeight + descenderExtra + padding;
                }
                
                return { width, shiftLeft, shiftRight, top, bottom };
            });
            
            // Apply "same width" rule: if difference is less than threshold, use previous line's width
            const sameWidthThreshold = r * 3;
            for (let i = 1; i < lineRects.length; i++) {
                const curr = lineRects[i];
                const prev = lineRects[i - 1];
                const widthDiff = Math.abs(curr.width - prev.width);
                
                if (widthDiff < sameWidthThreshold && widthDiff > 0 && curr.width < prev.width) {
                    const newWidth = prev.width;
                    if (alignment === 'right') {
                        curr.shiftLeft = curr.shiftRight - newWidth;
                    } else if (alignment === 'left') {
                        curr.shiftRight = curr.shiftLeft + newWidth;
                    } else {
                        const center = (curr.shiftLeft + curr.shiftRight) / 2;
                        curr.shiftLeft = center - newWidth / 2;
                        curr.shiftRight = center + newWidth / 2;
                    }
                    curr.width = newWidth;
                }
            }
            
            // Draw background as a single continuous path with curves at corners
            if (lineRects.length === 1) {
                // Single line: simple rounded rectangle
                const rect = lineRects[0];
                const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                const pathData = `M ${rect.shiftLeft + r},${rect.top} L ${rect.shiftRight - r},${rect.top} A ${r},${r} 0 0 1 ${rect.shiftRight},${rect.top + r} L ${rect.shiftRight},${rect.bottom - r} A ${r},${r} 0 0 1 ${rect.shiftRight - r},${rect.bottom} L ${rect.shiftLeft + r},${rect.bottom} A ${r},${r} 0 0 1 ${rect.shiftLeft},${rect.bottom - r} L ${rect.shiftLeft},${rect.top + r} A ${r},${r} 0 0 1 ${rect.shiftLeft + r},${rect.top} Z`;
                pathElement.setAttribute('d', pathData);
                pathElement.setAttribute('fill', bgRgba);
                svg.appendChild(pathElement);
            } else {
                // Multiple lines: build a single continuous path tracing the outer contour
                const pathSegments = [];
                const first = lineRects[0];
                const last = lineRects[lineRects.length - 1];
                
                // Start at top-left of first line
                pathSegments.push(`M ${first.shiftLeft + r},${first.top}`);
                
                // Top edge of first line
                pathSegments.push(`L ${first.shiftRight - r},${first.top}`);
                pathSegments.push(`A ${r},${r} 0 0 1 ${first.shiftRight},${first.top + r}`);
                
                // Go DOWN the right side
                for (let i = 0; i < lineRects.length; i++) {
                    const curr = lineRects[i];
                    const next = i < lineRects.length - 1 ? lineRects[i + 1] : null;
                    
                    if (next) {
                        const diff = next.shiftRight - curr.shiftRight;
                        // midY is the transition point between lines
                        const midY = (curr.bottom + next.top) / 2;
                        
                        if (Math.abs(diff) < 0.5) {
                            // Same right edge - continue straight down
                        } else if (diff > 0) {
                            // Next line is WIDER on right - convex corner (outward)
                            pathSegments.push(`L ${curr.shiftRight},${midY - r}`);
                            pathSegments.push(`A ${r},${r} 0 0 0 ${curr.shiftRight + r},${midY}`);
                            pathSegments.push(`L ${next.shiftRight - r},${midY}`);
                            pathSegments.push(`A ${r},${r} 0 0 1 ${next.shiftRight},${midY + r}`);
                        } else {
                            // Next line is NARROWER on right - concave corner (inward)
                            pathSegments.push(`L ${curr.shiftRight},${midY - r}`);
                            pathSegments.push(`A ${r},${r} 0 0 1 ${curr.shiftRight - r},${midY}`);
                            pathSegments.push(`L ${next.shiftRight + r},${midY}`);
                            pathSegments.push(`A ${r},${r} 0 0 0 ${next.shiftRight},${midY + r}`);
                        }
                    }
                }
                
                // Bottom-right corner of last line
                pathSegments.push(`L ${last.shiftRight},${last.bottom - r}`);
                pathSegments.push(`A ${r},${r} 0 0 1 ${last.shiftRight - r},${last.bottom}`);
                
                // Bottom edge of last line
                pathSegments.push(`L ${last.shiftLeft + r},${last.bottom}`);
                pathSegments.push(`A ${r},${r} 0 0 1 ${last.shiftLeft},${last.bottom - r}`);
                
                // Go UP the left side
                for (let i = lineRects.length - 1; i >= 0; i--) {
                    const curr = lineRects[i];
                    const prev = i > 0 ? lineRects[i - 1] : null;
                    
                    if (prev) {
                        const diff = prev.shiftLeft - curr.shiftLeft;
                        // midY is the transition point between lines
                        const midY = (prev.bottom + curr.top) / 2;
                        
                        if (Math.abs(diff) < 0.5) {
                            // Same left edge - continue straight up
                        } else if (diff > 0) {
                            // Previous line is NARROWER on left - concave corner (inward)
                            pathSegments.push(`L ${curr.shiftLeft},${midY + r}`);
                            pathSegments.push(`A ${r},${r} 0 0 1 ${curr.shiftLeft + r},${midY}`);
                            pathSegments.push(`L ${prev.shiftLeft - r},${midY}`);
                            pathSegments.push(`A ${r},${r} 0 0 0 ${prev.shiftLeft},${midY - r}`);
                        } else {
                            // Previous line is WIDER on left - convex corner (outward)
                            pathSegments.push(`L ${curr.shiftLeft},${midY + r}`);
                            pathSegments.push(`A ${r},${r} 0 0 0 ${curr.shiftLeft - r},${midY}`);
                            pathSegments.push(`L ${prev.shiftLeft + r},${midY}`);
                            pathSegments.push(`A ${r},${r} 0 0 1 ${prev.shiftLeft},${midY - r}`);
                        }
                    }
                }
                
                // Top-left corner of first line
                pathSegments.push(`L ${first.shiftLeft},${first.top + r}`);
                pathSegments.push(`A ${r},${r} 0 0 1 ${first.shiftLeft + r},${first.top}`);
                pathSegments.push('Z');
                
                const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                pathElement.setAttribute('d', pathSegments.join(' '));
                pathElement.setAttribute('fill', bgRgba);
                svg.appendChild(pathElement);
            }
        }

        // Renderizar texto con posicionamiento preciso
        lineMetrics.forEach((lineMetric) => {
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', lineMetric.x);
            
            // Usar 'central' para el baseline vertical - centra el texto matemáticamente
            // Sumamos padding a la posición Y porque lineMetric.y no incluye el offset del padding
            textElement.setAttribute('y', lineMetric.y + padding);
            textElement.setAttribute('dominant-baseline', 'central');
            
            // Establecer text-anchor según la alineación
            if (alignment === 'center') {
                textElement.setAttribute('text-anchor', 'middle');
            } else if (alignment === 'right') {
                textElement.setAttribute('text-anchor', 'end');
            } else {
                textElement.setAttribute('text-anchor', 'start');
            }
            
            textElement.setAttribute('fill', txtColor);
            textElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
            
            // Dividir el texto en segmentos (texto normal y emojis) para aplicar diferentes tamaños
            const text = lineMetric.text;
            const emojiSize = size * 0.80; // Emojis 20% más pequeños
            
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
                    tspan.setAttribute('style', `font-family: ${fontFamily}; font-size: ${part.isEmoji ? emojiSize : size}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; letter-spacing: ${letterSpacingPx}px;`);
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
        fontSizeValue.textContent = `${size}px`;
        opacityValue.textContent = `${Math.round(opacity * 100)}%`;
        lineHeightValue.textContent = lineHeightMultiplier.toFixed(1);
        letterSpacingValue.textContent = `${letterSpacingPx}px`;

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
        // Mostrar/ocultar el grupo de fuente personalizada
        if (textStyle.value === 'custom') {
            customFontGroup.style.display = 'block';
        } else {
            customFontGroup.style.display = 'none';
        }
        // Forzar actualización del preview
        // Usar requestAnimationFrame para asegurar que el DOM se actualice
        requestAnimationFrame(() => {
            // Verificar si la fuente está cargada antes de renderizar
            const style = textStyle.value;
            const fontFamily = getFontFamily(style);
            
            // Si es una fuente de Google Fonts, verificar que esté cargada
            if (style === 'classic' || style === 'strong') {
                // Verificar si la fuente está cargada
                if (document.fonts && document.fonts.check) {
                    const fontLoaded = document.fonts.check(`16px ${fontFamily}`);
                    if (!fontLoaded) {
                        // Esperar a que la fuente se cargue, con timeout de seguridad
                        Promise.race([
                            document.fonts.ready,
                            new Promise(resolve => setTimeout(resolve, 500))
                        ]).then(() => {
                            renderText();
                        });
                        return;
                    }
                }
            }
            
            // Renderizar inmediatamente
            renderText();
        });
    });
    
    customFontFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            loadCustomFont(file)
                .then(() => {
                    console.log('Custom font loaded:', customFontName);
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

    // Función para descargar el SVG como PNG
    function downloadAsPNG() {
        console.log('downloadAsPNG llamado');
        
        // Verificar que el SVG tenga contenido
        if (!svg || svg.children.length === 0) {
            alert('No text to download. Please write something first.');
            return;
        }
        
        try {
            // Obtener el SVG y sus dimensiones
            const svgElement = svg.cloneNode(true);
            
            // Asegurar que el SVG tenga los atributos necesarios
            const viewBox = svg.getAttribute('viewBox');
            if (!viewBox) {
                alert('Error: The SVG does not have a viewBox defined.');
                return;
            }
            
            const svgData = new XMLSerializer().serializeToString(svgElement);
            console.log('SVG serializado, tamaño:', svgData.length);
            
            // Agregar el namespace si no está presente
            if (!svgData.includes('xmlns')) {
                const svgWithNS = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                const svgBlob = new Blob([svgWithNS], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                processSVGToPNG(svgUrl, viewBox);
            } else {
                const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                const svgUrl = URL.createObjectURL(svgBlob);
                processSVGToPNG(svgUrl, viewBox);
            }
        } catch (error) {
            console.error('Error al descargar PNG:', error);
            alert('Error downloading image: ' + error.message);
        }
    }
    
    function processSVGToPNG(svgUrl, viewBox) {
        // Crear una imagen para cargar el SVG
        const img = new Image();
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        img.onload = function() {
            console.log('Imagen SVG cargada');
            
            // Obtener las dimensiones del viewBox
            const viewBoxValues = viewBox.split(' ');
            const svgWidth = parseFloat(viewBoxValues[2]);
            const svgHeight = parseFloat(viewBoxValues[3]);
            
            console.log('Dimensiones viewBox:', svgWidth, 'x', svgHeight);
            
            // Instagram Stories estándar: 1080x1920 (9:16 aspect ratio)
            // Calcular el tamaño de exportación manteniendo la proporción del viewBox
            const targetWidth = 1080; // Ancho estándar para Instagram Stories
            const aspectRatio = svgHeight / svgWidth; // Proporción del viewBox (debería ser ~1.78 para 9:16)
            const targetHeight = Math.round(targetWidth * aspectRatio);
            
            console.log('Dimensiones de exportación:', targetWidth, 'x', targetHeight);
            
            // Configurar el canvas temporal con las dimensiones de alta resolución
            tempCanvas.width = targetWidth;
            tempCanvas.height = targetHeight;
            
            // Dibujar la imagen escalada al tamaño completo del canvas temporal
            tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
            
            // Obtener los datos de píxeles para detectar el área con contenido
            const imageData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
            const data = imageData.data;
            
            // Encontrar los bordes del contenido (no transparente)
            let minX = targetWidth;
            let minY = targetHeight;
            let maxX = 0;
            let maxY = 0;
            
            // Buscar píxeles no transparentes
            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const index = (y * targetWidth + x) * 4;
                    const alpha = data[index + 3]; // Canal alpha
                    
                    if (alpha > 0) { // Si el píxel no es completamente transparente
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            // Si no se encontró contenido, usar las dimensiones completas
            if (minX >= maxX || minY >= maxY) {
                minX = 0;
                minY = 0;
                maxX = targetWidth;
                maxY = targetHeight;
            }
            
            // Agregar un pequeño padding (opcional, puedes ajustarlo o eliminarlo)
            const padding = 0; // Sin padding adicional
            minX = Math.max(0, minX - padding);
            minY = Math.max(0, minY - padding);
            maxX = Math.min(targetWidth, maxX + padding);
            maxY = Math.min(targetHeight, maxY + padding);
            
            // Calcular las dimensiones del contenido
            const contentWidth = maxX - minX;
            const contentHeight = maxY - minY;
            
            console.log('Área de contenido:', minX, minY, contentWidth, 'x', contentHeight);
            
            // Crear un nuevo canvas con las dimensiones exactas del contenido
            const finalCanvas = document.createElement('canvas');
            const finalCtx = finalCanvas.getContext('2d');
            finalCanvas.width = contentWidth;
            finalCanvas.height = contentHeight;
            
            // Copiar solo el área con contenido del canvas temporal al canvas final
            finalCtx.drawImage(
                tempCanvas,
                minX, minY, contentWidth, contentHeight, // Área fuente
                0, 0, contentWidth, contentHeight        // Área destino
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
                link.download = 'instagram-text.png';
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
        // Toggle del panel de emojis
        emojiBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const isVisible = emojiPanel.style.display === 'block';
            emojiPanel.style.display = isVisible ? 'none' : 'block';
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
            });
        });
    }

    // Inicializar
    renderText();

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
