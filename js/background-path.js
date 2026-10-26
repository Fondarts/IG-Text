// Path del fondo continuo con "efecto escalera" (basado en https://stackoverflow.com/a/49288455).
// Cada rect: { shiftLeft, shiftRight, top, bottom } en coordenadas del bloque.

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

export function buildBackgroundPath(lineRects, r) {
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
