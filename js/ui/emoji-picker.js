import { EMOJI_CATEGORIES, IMAGE_EMOJIS } from '../emoji-data.js';
import { IMAGE_EMOJI_BY_CHAR, isCountryFlag, flagTwemojiUrl, emojiKey } from '../emoji.js';
import { readJSON, writeJSON } from '../storage.js';

const RECENTS_KEY = 'recentEmojis';
const FAVORITES_KEY = 'favoriteEmojis';
const MAX_RECENTS = 16;
const MAX_RESULTS = 160;
const LONG_PRESS_MS = 500;

// Nombres y palabras clave en inglés y español (emojibase), cargados al abrir
// el picker por primera vez.
const EMOJIBASE = 'https://cdn.jsdelivr.net/npm/emojibase-data@15.3.2/';

// Barra de categorías: un ícono por sección para saltar directo a ella.
const NAV_ITEMS = [
    { key: 'favorites', icon: '⭐', label: 'Favorites' },
    { key: 'recent', icon: '🕘', label: 'Recently used' },
    { key: 'Special', icon: '🏅', label: 'Special' },
    { key: 'Smileys & Emotion', icon: '😀' },
    { key: 'People & Body', icon: '👋' },
    { key: 'Animals & Nature', icon: '🐶' },
    { key: 'Food & Drink', icon: '🍔' },
    { key: 'Travel & Places', icon: '✈️' },
    { key: 'Activities', icon: '⚽' },
    { key: 'Objects', icon: '💡' },
    { key: 'Symbols', icon: '🔣' },
    { key: 'Flags', icon: '🏁' }
];

const normalize = s => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');

export function createEmojiPicker({ button, panel, search, nav, sectionsEl, statusEl, onPick, toast }) {
    // Catálogo: [{ emoji, category, label, keywords }]
    const catalog = [];
    const seen = new Set();
    IMAGE_EMOJIS.forEach(spec => {
        catalog.push({ emoji: spec.char, category: 'Special', label: spec.label, keywords: normalize(spec.label + ' ' + spec.keywords) });
        seen.add(spec.char);
    });
    EMOJI_CATEGORIES.forEach(cat => {
        cat.set.split(/\s+/).forEach(e => {
            if (!e || seen.has(e)) return;
            seen.add(e);
            catalog.push({ emoji: e, category: cat.title, label: '', keywords: normalize(cat.title) });
        });
    });

    let favorites = readList(FAVORITES_KEY);
    let recents = readList(RECENTS_KEY);
    let namesState = 'idle'; // idle | loading | ready | failed

    function readList(key) {
        const v = readJSON(key, []);
        return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
    }

    function loadNames() {
        if (namesState !== 'idle') return;
        namesState = 'loading';
        Promise.all(['en', 'es'].map(lang =>
            fetch(`${EMOJIBASE}${lang}/compact.json`).then(r => {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
        )).then(([en, es]) => {
            const byKey = new Map();
            const add = (list) => list.forEach(entry => {
                if (!entry.unicode) return;
                const key = emojiKey(entry.unicode);
                const info = byKey.get(key) || { labels: [], tags: [] };
                if (entry.label) info.labels.push(entry.label);
                if (entry.tags) info.tags.push(...entry.tags);
                byKey.set(key, info);
            });
            add(en);
            add(es);
            catalog.forEach(item => {
                const info = byKey.get(emojiKey(item.emoji));
                if (!info) return;
                item.label = info.labels[0] || item.label;
                item.labelText = normalize(info.labels.join(' | '));
                item.keywords = normalize(`${info.labels.join(' ')} ${info.tags.join(' ')} ${item.category}`);
            });
            // Tooltips con el nombre del emoji.
            panel.querySelectorAll('.emoji-item').forEach(btn => applyTitle(btn, btn.dataset.emoji));
            namesState = 'ready';
            if (search.value.trim()) renderSearch();
        }).catch(err => {
            console.warn('No se pudieron cargar los nombres de emojis:', err);
            namesState = 'failed';
            if (search.value.trim()) renderSearch();
        });
    }

    const itemByEmoji = new Map(catalog.map(item => [item.emoji, item]));

    function applyTitle(btn, value) {
        const item = itemByEmoji.get(value);
        const name = item && item.label ? item.label : (isCountryFlag(value) ? 'Flag' : value);
        btn.title = name;
        btn.setAttribute('aria-label', favorites.includes(value) ? `${name} (favorite)` : name);
    }

    // Botón de emoji. Los emoji-imagen y las banderas muestran una imagen y
    // guardan en dataset.emoji lo que realmente se inserta en el texto.
    function makeButton(value) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'emoji-item' + (favorites.includes(value) ? ' is-favorite' : '');
        btn.dataset.emoji = value;
        const spec = IMAGE_EMOJI_BY_CHAR[value];
        if (spec || isCountryFlag(value)) {
            const im = document.createElement('img');
            im.src = spec ? spec.dataURI : flagTwemojiUrl(value);
            im.alt = '';
            im.loading = 'lazy';
            btn.appendChild(im);
        } else {
            btn.textContent = value;
        }
        applyTitle(btn, value);
        return btn;
    }

    function makeSection(title, emojis, extraClass = '', navKey = '') {
        const section = document.createElement('div');
        section.className = 'emoji-section ' + extraClass;
        if (navKey) section.dataset.nav = navKey;
        const h = document.createElement('div');
        h.className = 'emoji-section-title';
        h.textContent = title;
        const grid = document.createElement('div');
        grid.className = 'emoji-grid';
        emojis.forEach(e => grid.appendChild(makeButton(e)));
        section.append(h, grid);
        return section;
    }

    // Secciones fijas (se arman una vez) + dinámicas (favoritos, recientes, resultados).
    const dynamicEl = document.createElement('div');
    const staticEl = document.createElement('div');
    const resultsEl = document.createElement('div');
    resultsEl.hidden = true;
    sectionsEl.append(resultsEl, dynamicEl, staticEl);

    const byCategory = new Map();
    catalog.forEach(item => {
        if (!byCategory.has(item.category)) byCategory.set(item.category, []);
        byCategory.get(item.category).push(item.emoji);
    });
    byCategory.forEach((emojis, title) => staticEl.appendChild(makeSection(title, emojis, '', title)));

    function renderDynamic() {
        dynamicEl.innerHTML = '';
        if (favorites.length) dynamicEl.appendChild(makeSection('★ Favorites', favorites, 'favorites-section', 'favorites'));
        if (recents.length) dynamicEl.appendChild(makeSection('Recently used', recents, '', 'recent'));
        // Favoritos/recientes vacíos: su ícono se oculta.
        nav.querySelector('[data-nav="favorites"]').hidden = !favorites.length;
        nav.querySelector('[data-nav="recent"]').hidden = !recents.length;
        updateActiveNav();
    }

    // ---- Barra de categorías ----
    const header = panel.querySelector('.emoji-panel-header');
    NAV_ITEMS.forEach(item => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'emoji-nav-btn';
        b.dataset.nav = item.key;
        b.textContent = item.icon;
        b.title = item.label || item.key;
        b.setAttribute('aria-label', b.title);
        nav.appendChild(b);
    });

    function sectionTop(section) {
        return section.offsetTop - header.offsetHeight - 8;
    }

    nav.addEventListener('click', e => {
        const b = e.target.closest('.emoji-nav-btn');
        if (!b) return;
        e.stopPropagation();
        if (search.value) { search.value = ''; renderSearch(); }
        const section = sectionsEl.querySelector(`.emoji-section[data-nav="${CSS.escape(b.dataset.nav)}"]`);
        if (!section) return;
        // Salto instantáneo: con miles de emojis, el scroll suave tardaba ~1 s.
        const first = sectionsEl.querySelector('.emoji-section[data-nav]');
        panel.scrollTop = section === first ? 0 : sectionTop(section);
        setActiveNav(b.dataset.nav);
    });

    function setActiveNav(key) {
        nav.querySelectorAll('.emoji-nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === key));
    }

    // Resaltar la categoría visible según el scroll.
    let navRaf = 0;
    function updateActiveNav() {
        if (search.value.trim()) { setActiveNav(null); return; }
        const sections = [...sectionsEl.querySelectorAll('.emoji-section[data-nav]')].filter(s => s.offsetParent !== null);
        let current = sections[0];
        for (const s of sections) {
            if (sectionTop(s) <= panel.scrollTop + 1) current = s;
        }
        // Al fondo del scroll, la última sección (puede ser corta y nunca llegar arriba).
        if (panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2) current = sections[sections.length - 1];
        setActiveNav(current ? current.dataset.nav : null);
    }
    panel.addEventListener('scroll', () => {
        cancelAnimationFrame(navRaf);
        navRaf = requestAnimationFrame(updateActiveNav);
    }, { passive: true });

    // Ranking: nombre idéntico a la búsqueda > palabra exacta > prefijo de palabra
    // > contenido en el nombre > palabra clave. Empate → nombre más corto.
    function searchCatalog(query) {
        const q = normalize(query).trim();
        const terms = q.split(/\s+/).filter(Boolean);
        const results = [];
        catalog.forEach(item => {
            const labels = (item.labelText || '').split(' | ');
            const words = labels.join(' ').split(/[\s:,]+/);
            let score = labels.includes(q) ? -10 : 0;
            for (const term of terms) {
                if (words.includes(term)) score += 0;
                else if (words.some(w => w.startsWith(term))) score += 1;
                else if (item.labelText && item.labelText.includes(term)) score += 2;
                else if (item.keywords.includes(term)) score += 3;
                else return;
            }
            results.push({ item, score, len: (item.label || '').length });
        });
        results.sort((a, b) => a.score - b.score || a.len - b.len);
        return results.slice(0, MAX_RESULTS).map(r => r.item.emoji);
    }

    function renderSearch() {
        const q = search.value.trim();
        resultsEl.innerHTML = '';
        statusEl.hidden = true;
        if (!q) {
            resultsEl.hidden = true;
            dynamicEl.hidden = staticEl.hidden = false;
            updateActiveNav();
            return;
        }
        setActiveNav(null);
        panel.scrollTop = 0;
        dynamicEl.hidden = staticEl.hidden = true;
        resultsEl.hidden = false;
        const found = searchCatalog(q);
        if (found.length) {
            resultsEl.appendChild(makeSection(`Results for "${q}"`, found));
        } else {
            const empty = document.createElement('div');
            empty.className = 'emoji-empty';
            empty.textContent = 'No emojis found';
            resultsEl.appendChild(empty);
        }
        if (namesState === 'loading') {
            statusEl.hidden = false;
            statusEl.textContent = 'Loading emoji names…';
        } else if (namesState === 'failed') {
            statusEl.hidden = false;
            statusEl.textContent = 'Emoji names unavailable (offline?): searching by category only.';
        }
    }

    function toggleFavorite(value) {
        const isFav = favorites.includes(value);
        favorites = isFav ? favorites.filter(e => e !== value) : [value, ...favorites];
        writeJSON(FAVORITES_KEY, favorites);
        panel.querySelectorAll('.emoji-item').forEach(btn => {
            if (btn.dataset.emoji === value) {
                btn.classList.toggle('is-favorite', !isFav);
                applyTitle(btn, value);
            }
        });
        renderDynamic();
        toast(isFav ? 'Removed from favorites' : 'Added to favorites ★');
    }

    function pick(value) {
        onPick(value);
        recents = [value, ...recents.filter(e => e !== value)].slice(0, MAX_RECENTS);
        writeJSON(RECENTS_KEY, recents);
        // No re-armar las secciones bajo el cursor mientras se busca.
        if (!search.value.trim()) renderDynamic();
    }

    // ---- Interacción (delegada en el panel) ----
    let longPressTimer = null;
    let suppressClickUntil = 0;

    panel.addEventListener('pointerdown', e => {
        const btn = e.target.closest('.emoji-item');
        if (!btn || e.button !== 0) return;
        clearTimeout(longPressTimer);
        longPressTimer = setTimeout(() => {
            suppressClickUntil = Date.now() + 800;
            toggleFavorite(btn.dataset.emoji);
        }, LONG_PRESS_MS);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type =>
        panel.addEventListener(type, () => clearTimeout(longPressTimer)));
    panel.addEventListener('scroll', () => clearTimeout(longPressTimer), { passive: true });

    panel.addEventListener('click', e => {
        const btn = e.target.closest('.emoji-item');
        if (!btn) return;
        if (Date.now() < suppressClickUntil) return; // fue un long-press
        pick(btn.dataset.emoji);
    });

    panel.addEventListener('contextmenu', e => {
        const btn = e.target.closest('.emoji-item');
        if (!btn) return;
        e.preventDefault();
        // En Android el long-press dispara también contextmenu: no duplicar.
        if (Date.now() < suppressClickUntil) return;
        toggleFavorite(btn.dataset.emoji);
    });

    search.addEventListener('input', renderSearch);
    search.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const first = resultsEl.querySelector('.emoji-item');
            if (first) pick(first.dataset.emoji);
        } else if (e.key === 'Escape') {
            if (search.value) { search.value = ''; renderSearch(); } else close();
        } else if (e.key === 'ArrowDown') {
            const first = [...panel.querySelectorAll('.emoji-item')].find(b => b.offsetParent !== null);
            if (first) { e.preventDefault(); first.focus(); }
        }
    });

    // Navegación con flechas dentro de la grilla.
    sectionsEl.addEventListener('keydown', e => {
        const btn = e.target.closest('.emoji-item');
        if (!btn) return;
        const items = [...panel.querySelectorAll('.emoji-item')].filter(b => b.offsetParent !== null);
        const i = items.indexOf(btn);
        const cols = getComputedStyle(btn.parentElement).gridTemplateColumns.split(' ').length;
        const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols };
        if (e.key in moves) {
            e.preventDefault();
            const next = items[i + moves[e.key]];
            if (next) next.focus();
            else if (e.key === 'ArrowUp') search.focus();
        } else if (e.key === 'Escape') {
            close();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // Tipear con el foco en la grilla → seguir buscando.
            search.focus();
        }
    });

    function open() {
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        loadNames();
        renderDynamic();
        // En mobile no forzar el teclado en pantalla.
        if (window.matchMedia('(pointer: fine)').matches) search.focus();
    }

    function close() {
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        clearTimeout(longPressTimer);
    }

    button.addEventListener('click', e => {
        e.stopPropagation();
        if (panel.hidden) open(); else close();
    });
    document.addEventListener('click', e => {
        if (!panel.hidden && !panel.contains(e.target) && !button.contains(e.target)) close();
    });

    renderDynamic();
    return { open, close };
}
