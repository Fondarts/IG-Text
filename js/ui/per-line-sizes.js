import { lineSize, LINE_SIZE_MIN, LINE_SIZE_MAX } from '../state.js';

// Lista de sliders de tamaño por línea manual (override del tamaño global).
// El override se guarda como escala: al mover el tamaño global, todas las
// líneas escalan proporcionalmente.
//   onChange(index, sizePx | null) → null = volver al tamaño global.
export function createPerLineSizes({ group, list, onChange }) {
    let signature = '';

    function previewForLine(line) {
        const trimmed = line.trim();
        if (trimmed === '') return '(empty)';
        return trimmed.length > 28 ? trimmed.slice(0, 28) + '…' : trimmed;
    }

    function update(state) {
        const lines = state.text.split('\n');
        const visible = lines.length > 1;
        group.hidden = !visible;
        if (!visible) {
            list.innerHTML = '';
            signature = '';
            return;
        }

        // Fast path: mismo texto → sólo actualizar valores (no destruir el slider
        // que el usuario está arrastrando).
        const sig = lines.join('\n');
        if (sig === signature && list.children.length === lines.length) {
            lines.forEach((_, i) => {
                const row = list.children[i];
                const custom = state.perLineScales[i] != null;
                const effective = lineSize(state, i);
                const slider = row.querySelector('input[type="range"]');
                if (document.activeElement !== slider) slider.value = String(effective);
                row.querySelector('.per-line-value').textContent = `${effective}px`;
                row.querySelector('.per-line-reset').disabled = !custom;
            });
            return;
        }

        signature = sig;
        list.innerHTML = '';
        lines.forEach((line, i) => {
            const custom = state.perLineScales[i] != null;
            const effective = lineSize(state, i);

            const row = document.createElement('div');
            row.className = 'per-line-size-row';

            const label = document.createElement('span');
            label.className = 'per-line-label';
            label.title = line;
            label.textContent = `L${i + 1}: ${previewForLine(line)}`;

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = String(LINE_SIZE_MIN);
            slider.max = String(LINE_SIZE_MAX);
            slider.value = String(effective);
            slider.setAttribute('aria-label', `Font size for line ${i + 1}`);
            slider.addEventListener('input', () => onChange(i, parseInt(slider.value, 10)));

            const value = document.createElement('span');
            value.className = 'per-line-value';
            value.textContent = `${effective}px`;

            const reset = document.createElement('button');
            reset.type = 'button';
            reset.className = 'per-line-reset';
            reset.textContent = '↺';
            reset.title = 'Reset to global size';
            reset.setAttribute('aria-label', `Reset line ${i + 1} to global size`);
            reset.disabled = !custom;
            reset.addEventListener('click', () => onChange(i, null));

            row.append(label, slider, value, reset);
            list.appendChild(row);
        });
    }

    return { update, invalidate: () => { signature = ''; } };
}
