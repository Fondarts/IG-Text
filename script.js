// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Elementos del DOM
    const textInput = document.getElementById('text-input');
    const svg = document.getElementById('text-svg');
    const textStyle = document.getElementById('text-style');
    const textColor = document.getElementById('text-color');
    const bgColor = document.getElementById('bg-color');
    const bgOpacity = document.getElementById('bg-opacity');
    const opacityValue = document.getElementById('opacity-value');
    const fontSize = document.getElementById('font-size');
    const fontSizeValue = document.getElementById('font-size-value');
    const bold = document.getElementById('bold');
    const italic = document.getElementById('italic');
    const transparentBg = document.getElementById('transparent-bg');
    const textAlign = document.getElementById('text-align');
    const downloadBtn = document.getElementById('download-btn');
    const emojiBtn = document.getElementById('emoji-btn');
    const emojiPanel = document.getElementById('emoji-panel');

    // Verificar que todos los elementos existan
    if (!textInput || !svg || !textStyle || !textColor || !bgColor || 
        !bgOpacity || !opacityValue || !fontSize || !fontSizeValue || 
        !bold || !italic || !transparentBg || !textAlign || !downloadBtn) {
        console.error('Error: Not all DOM elements were found');
        return;
    }

    const padding = 15;
    const borderRadius = 10;

    // Función para obtener la fuente según el estilo
    function getFontFamily(style) {
        const fonts = {
            classic: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            modern: '"Helvetica Neue", Arial, sans-serif',
            neon: '"Arial Black", Arial, sans-serif',
            typewriter: '"Courier New", monospace',
            strong: 'Impact, "Arial Black", sans-serif'
        };
        return fonts[style] || fonts.classic;
    }


    // Función para dividir texto en líneas que quepan en el ancho disponible
    function wrapText(text, maxWidth, fontFamily, fontSize, fontWeight, fontStyle) {
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
            testElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${fontSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle};`);
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
        const isBold = bold.checked;
        const isItalic = italic.checked;
        const isTransparent = transparentBg.checked;
        const alignment = textAlign.value;

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
                referenceHeight = rect.height - 40;
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
                const wrapped = wrapText(line.trim(), availableWidth - (padding * 2), fontFamily, size, fontWeight, fontStyle);
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
            textElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${fontWeight}; font-style: ${fontStyle};`);
            tempGroup.appendChild(textElement);
            lineElements.push(textElement);
        });

        // Agregar temporalmente al SVG para medir
        svg.appendChild(tempGroup);
        
        // Medir cada línea usando getBBox
        let currentY = padding;
        wrappedLines.forEach((line, index) => {
            const textElement = lineElements[index];
            const bbox = textElement.getBBox();
            const lineHeight = bbox.height || size * 1.2;
            
            lineMetrics.push({
                text: line,
                width: bbox.width,
                height: lineHeight,
                x: padding,
                y: currentY + lineHeight / 2
            });
            
            currentY += lineHeight;
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
        // Usar referenceWidth para las posiciones para que el texto no se corte
        lineMetrics.forEach((metric) => {
            if (alignment === 'center') {
                metric.x = referenceWidth / 2;
            } else if (alignment === 'right') {
                // Alineación derecha: texto pegado al borde derecho con padding
                metric.x = referenceWidth - padding;
            } else {
                // Izquierda: texto pegado al borde izquierdo con padding
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
            const lineRects = lineMetrics.map((lineMetric, lnum) => {
                const textWidth = lineMetric.width;
                let width = textWidth + 2 * padding;
                
                let shiftLeft, shiftRight;
                if (alignment === 'right') {
                    shiftRight = lineMetric.x + padding;
                    shiftLeft = Math.max(0, shiftRight - width);
                } else if (alignment === 'left') {
                    shiftLeft = Math.max(0, lineMetric.x - padding);
                    shiftRight = shiftLeft + width;
                } else {
                    shiftLeft = Math.max(0, lineMetric.x - (width / 2));
                    shiftRight = Math.min(referenceWidth, shiftLeft + width);
                    if (shiftRight === referenceWidth) {
                        shiftLeft = referenceWidth - width;
                    }
                }
                
                const top = lineMetric.y - lineMetric.height / 2;
                const bottom = lineMetric.y + lineMetric.height / 2;
                
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

        // Renderizar texto
        lineMetrics.forEach((lineMetric) => {
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', lineMetric.x);
            // Adjust Y position slightly up to better center emojis (they tend to sit lower)
            textElement.setAttribute('y', lineMetric.y - size * 0.05);
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
            textElement.setAttribute('style', `font-family: ${fontFamily}; font-size: ${size}px; font-weight: ${fontWeight}; font-style: ${fontStyle};`);
            textElement.textContent = lineMetric.text;
            svg.appendChild(textElement);
        });

        // Actualizar valores de UI
        fontSizeValue.textContent = `${size}px`;
        opacityValue.textContent = `${Math.round(opacity * 100)}%`;
    }

    // Event listeners
    textInput.addEventListener('input', renderText);
    textStyle.addEventListener('change', renderText);
    textColor.addEventListener('input', renderText);
    bgColor.addEventListener('input', renderText);
    bgOpacity.addEventListener('input', renderText);
    fontSize.addEventListener('input', renderText);
    bold.addEventListener('change', renderText);
    italic.addEventListener('change', renderText);
    transparentBg.addEventListener('change', renderText);
    textAlign.addEventListener('change', renderText);

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
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = function() {
            console.log('Imagen SVG cargada');
            
            // Obtener las dimensiones del viewBox
            const viewBoxValues = viewBox.split(' ');
            const svgWidth = parseFloat(viewBoxValues[2]);
            const svgHeight = parseFloat(viewBoxValues[3]);
            
            console.log('Dimensiones:', svgWidth, 'x', svgHeight);
            
            // Configurar el canvas con las dimensiones del SVG
            canvas.width = svgWidth;
            canvas.height = svgHeight;
            
            // Dibujar la imagen en el canvas
            ctx.drawImage(img, 0, 0, svgWidth, svgHeight);
            
            // Convertir el canvas a PNG y descargar
            canvas.toBlob(function(blob) {
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
