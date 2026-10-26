import { readJSON, writeJSON } from '../storage.js';

const PRESETS_KEY = 'textEditorPresets';

// Presets con nombre: guardar (con confirmación si ya existe), cargar,
// renombrar y borrar. getSnapshot() devuelve el preset; apply(preset) lo aplica.
export function createPresets({ select, saveBtn, renameBtn, deleteBtn, getSnapshot, apply, toast }) {
    const getPresets = () => {
        const p = readJSON(PRESETS_KEY, {});
        return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    };
    const savePresets = presets => writeJSON(PRESETS_KEY, presets);

    function refresh(selectedName = select.value) {
        const names = Object.keys(getPresets()).sort((a, b) => a.localeCompare(b));
        select.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = names.length ? '-- Select a preset --' : '-- No presets yet --';
        select.appendChild(placeholder);
        names.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = name;
            select.appendChild(opt);
        });
        select.value = names.includes(selectedName) ? selectedName : '';
        renameBtn.disabled = deleteBtn.disabled = !select.value;
    }

    function askName(message, initial) {
        const name = prompt(message, initial || '');
        return name == null ? null : name.trim() || null;
    }

    saveBtn.addEventListener('click', () => {
        const name = askName('Preset name:', select.value);
        if (!name) return;
        const presets = getPresets();
        if (presets[name] && !confirm(`A preset named "${name}" already exists. Overwrite it?`)) return;
        presets[name] = getSnapshot();
        if (!savePresets(presets)) {
            toast('Could not save the preset (browser storage is full).', 'error');
            return;
        }
        refresh(name);
        toast(`Preset "${name}" saved`);
    });

    select.addEventListener('change', () => {
        renameBtn.disabled = deleteBtn.disabled = !select.value;
        const preset = getPresets()[select.value];
        if (preset) apply(preset, select.value);
    });

    renameBtn.addEventListener('click', () => {
        const oldName = select.value;
        if (!oldName) return;
        const newName = askName('New name:', oldName);
        if (!newName || newName === oldName) return;
        const presets = getPresets();
        if (presets[newName] && !confirm(`A preset named "${newName}" already exists. Overwrite it?`)) return;
        presets[newName] = presets[oldName];
        delete presets[oldName];
        savePresets(presets);
        refresh(newName);
        toast(`Preset renamed to "${newName}"`);
    });

    deleteBtn.addEventListener('click', () => {
        const name = select.value;
        if (!name || !confirm(`Delete preset "${name}"?`)) return;
        const presets = getPresets();
        delete presets[name];
        savePresets(presets);
        refresh('');
        toast(`Preset "${name}" deleted`);
    });

    refresh('');
    return { refresh };
}
