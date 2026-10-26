import { FONTS, getFontFamily, getFontLabel, getSystemFamilies, loadSystemFonts } from '../fonts.js';

// Combobox de fuentes con buscador. Al primer foco carga las fuentes del sistema
// (queryLocalFonts exige gesto del usuario; el click que da el foco lo provee).
export function createFontCombobox({ root, input, list, hint, getValue, onSelect }) {
    let activeIndex = -1;

    function getItems() {
        const items = FONTS.map(f => ({ value: f.id, label: f.label, group: 'Styles' }));
        items.push({ value: 'custom', label: getFontLabel('custom') + ' (upload)', group: 'Styles' });
        getSystemFamilies().forEach(fam => items.push({ value: 'sys:' + fam, label: fam, group: 'System fonts' }));
        return items;
    }

    function renderList(filter) {
        const q = (filter || '').trim().toLowerCase();
        const items = getItems().filter(it => !q || it.label.toLowerCase().includes(q));
        activeIndex = -1;
        list.innerHTML = '';
        if (items.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'font-list-empty';
            empty.textContent = 'No matches';
            list.appendChild(empty);
            return;
        }
        let lastGroup = null;
        items.forEach(it => {
            if (it.group !== lastGroup) {
                const g = document.createElement('div');
                g.className = 'font-list-group';
                g.textContent = it.group;
                list.appendChild(g);
                lastGroup = it.group;
            }
            const el = document.createElement('div');
            el.className = 'font-list-item' + (it.value === getValue() ? ' selected' : '');
            el.setAttribute('role', 'option');
            el.id = 'font-opt-' + list.children.length;
            el.textContent = it.label;
            el.dataset.value = it.value;
            // Muestra de la fuente en la propia lista.
            if (it.value !== 'custom') el.style.fontFamily = getFontFamily(it.value);
            list.appendChild(el);
        });
    }

    function currentFilter() {
        return input.value === getFontLabel(getValue()) ? '' : input.value;
    }

    function open() {
        renderList(currentFilter());
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
    }

    function close() {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
        sync();
    }

    function sync() {
        if (document.activeElement !== input || list.hidden) input.value = getFontLabel(getValue());
    }

    function select(value) {
        list.hidden = true;
        input.setAttribute('aria-expanded', 'false');
        onSelect(value);
        input.value = getFontLabel(value);
    }

    input.addEventListener('focus', () => {
        loadSystemFonts()
            .then(() => {
                hint.hidden = true;
                if (!list.hidden) renderList(currentFilter());
            })
            .catch(err => {
                hint.hidden = false;
                hint.textContent = err.message === 'unsupported'
                    ? 'System fonts require desktop Chrome/Edge (over http://localhost or https).'
                    : 'Could not access system fonts (permission denied).';
            });
        input.select();
        open();
    });
    input.addEventListener('input', () => {
        list.hidden = false;
        input.setAttribute('aria-expanded', 'true');
        renderList(input.value);
    });
    input.addEventListener('keydown', e => {
        const items = list.querySelectorAll('.font-list-item');
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (list.hidden) open();
            if (!items.length) return;
            activeIndex += e.key === 'ArrowDown' ? 1 : -1;
            if (activeIndex < 0) activeIndex = items.length - 1;
            if (activeIndex >= items.length) activeIndex = 0;
            items.forEach((el, i) => el.classList.toggle('active', i === activeIndex));
            items[activeIndex].scrollIntoView({ block: 'nearest' });
            input.setAttribute('aria-activedescendant', items[activeIndex].id);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const target = activeIndex >= 0 ? items[activeIndex] : items[0];
            if (target) select(target.dataset.value);
        } else if (e.key === 'Escape') {
            close();
            input.blur();
        }
    });
    // mousedown (no click) para seleccionar antes de que el blur cierre la lista.
    list.addEventListener('mousedown', e => {
        const item = e.target.closest('.font-list-item');
        if (!item) return;
        e.preventDefault();
        select(item.dataset.value);
    });
    document.addEventListener('click', e => {
        if (!root.contains(e.target) && !list.hidden) close();
    });

    return { sync };
}
