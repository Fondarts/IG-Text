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
    const borderRadius = 25;

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
        const size = Math.max(parseInt(sliderValue, 10) || 60, 15);
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
            
            // Variables para rastrear la línea anterior (como en el código Android)
            let prevWidth = -1;
            let prevLeft = -1;
            let prevRight = -1;
            let prevBottom = -1;
            let prevTop = -1;
            
            // Construir el path línea por línea, exactamente como en el código de Stack Overflow
            lineMetrics.forEach((lineMetric, lnum) => {
                const textWidth = lineMetric.width;
                const width = textWidth + 2 * padding;
                
                // Calcular posición según alineación basándose en la posición X del texto
                // El texto ya está posicionado correctamente en lineMetric.x
                let shiftLeft, shiftRight;
                if (alignment === 'right') {
                    // ALIGN_END / Gravity.RIGHT - el texto termina en lineMetric.x
                    // text-anchor='end' significa que lineMetric.x es el punto final del texto
                    shiftRight = lineMetric.x + padding;
                    shiftLeft = Math.max(0, shiftRight - width);
                } else if (alignment === 'left') {
                    // ALIGN_START / Gravity.LEFT - el texto comienza en lineMetric.x
                    // text-anchor='start' significa que lineMetric.x es el punto inicial del texto
                    shiftLeft = Math.max(0, lineMetric.x - padding);
                    shiftRight = shiftLeft + width;
                } else {
                    // ALIGN_CENTER / Gravity.CENTER - el texto está centrado en lineMetric.x
                    // text-anchor='middle' significa que lineMetric.x es el centro del texto
                    shiftLeft = Math.max(0, lineMetric.x - (width / 2));
                    shiftRight = Math.min(referenceWidth, shiftLeft + width);
                    // Ajustar shiftLeft si shiftRight fue limitado
                    if (shiftRight === referenceWidth) {
                        shiftLeft = referenceWidth - width;
                    }
                }
                
                const top = lineMetric.y - lineMetric.height / 2;
                const bottom = lineMetric.y + lineMetric.height / 2;
                
                if (lnum === 0) {
                    // Primera línea: dibujar rectángulo redondeado simple
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const pathData = `M ${shiftLeft + r},${top} L ${shiftRight - r},${top} A ${r},${r} 0 0 1 ${shiftRight},${top + r} L ${shiftRight},${bottom - r} A ${r},${r} 0 0 1 ${shiftRight - r},${bottom} L ${shiftLeft + r},${bottom} A ${r},${r} 0 0 1 ${shiftLeft},${bottom - r} L ${shiftLeft},${top + r} A ${r},${r} 0 0 1 ${shiftLeft + r},${top} Z`;
                    pathElement.setAttribute('d', pathData);
                    pathElement.setAttribute('fill', bgRgba);
                    svg.appendChild(pathElement);
                } else {
                    // Líneas siguientes: construir path con curvas cúbicas (exactamente como en el código de Stack Overflow)
                    const difference = width - prevWidth;
                    const diff = -Math.sign(difference) * Math.min(2 * r, Math.abs(difference / 2)) / 2;
                    
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    const pathSegments = [];
                    
                    // Mover al punto inicial (prevLeft, prevBottom - radius)
                    pathSegments.push(`M ${prevLeft},${prevBottom - r}`);
                    
                    // Curva cúbica 1 (solo si no es ALIGN_START / Gravity.LEFT)
                    if (alignment !== 'left') {
                        pathSegments.push(`C ${prevLeft},${prevBottom - r}, ${prevLeft},${top}, ${prevLeft + diff},${top}`);
                    } else {
                        pathSegments.push(`L ${prevLeft},${prevBottom + r}`);
                    }
                    
                    // Línea hasta rect.left - diff, rect.top
                    pathSegments.push(`L ${shiftLeft - diff},${top}`);
                    
                    // Curva cúbica 2
                    pathSegments.push(`C ${shiftLeft - diff},${top}, ${shiftLeft},${top}, ${shiftLeft},${top + r}`);
                    
                    // Línea hacia abajo
                    pathSegments.push(`L ${shiftLeft},${bottom - r}`);
                    
                    // Curva cúbica 3
                    pathSegments.push(`C ${shiftLeft},${bottom - r}, ${shiftLeft},${bottom}, ${shiftLeft + r},${bottom}`);
                    
                    // Línea inferior
                    pathSegments.push(`L ${shiftRight - r},${bottom}`);
                    
                    // Curva cúbica 4
                    pathSegments.push(`C ${shiftRight - r},${bottom}, ${shiftRight},${bottom}, ${shiftRight},${bottom - r}`);
                    
                    // Línea hacia arriba
                    pathSegments.push(`L ${shiftRight},${top + r}`);
                    
                    // Curva cúbica 5 (solo si no es ALIGN_END / Gravity.RIGHT)
                    if (alignment !== 'right') {
                        pathSegments.push(`C ${shiftRight},${top + r}, ${shiftRight},${top}, ${shiftRight + diff},${top}`);
                        pathSegments.push(`L ${prevRight - diff},${top}`);
                        pathSegments.push(`C ${prevRight - diff},${top}, ${prevRight},${top}, ${prevRight},${prevBottom - r}`);
                    } else {
                        pathSegments.push(`L ${prevRight},${prevBottom - r}`);
                    }
                    
                    // Curva cúbica 7
                    pathSegments.push(`C ${prevRight},${prevBottom - r}, ${prevRight},${prevBottom}, ${prevRight - r},${prevBottom}`);
                    
                    // Línea hacia la izquierda
                    pathSegments.push(`L ${prevLeft + r},${prevBottom}`);
                    
                    // Curva cúbica 8
                    pathSegments.push(`C ${prevLeft + r},${prevBottom}, ${prevLeft},${prevBottom}, ${prevLeft},${top - r}`);
                    pathSegments.push('Z');
                    
                    pathElement.setAttribute('d', pathSegments.join(' '));
                    pathElement.setAttribute('fill', bgRgba);
                    svg.appendChild(pathElement);
                }
                
                // Actualizar valores previos (exactamente como en el código de Stack Overflow)
                prevWidth = width;
                prevLeft = shiftLeft;
                prevRight = shiftRight;
                prevBottom = bottom;
                prevTop = top;
            });
        }

        // Renderizar texto
        lineMetrics.forEach((lineMetric) => {
            const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textElement.setAttribute('x', lineMetric.x);
            textElement.setAttribute('y', lineMetric.y);
            textElement.setAttribute('dominant-baseline', 'middle');
            
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
