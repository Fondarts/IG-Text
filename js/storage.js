// Acceso a localStorage tolerante a fallos: un valor corrupto, el modo privado o
// la cuota llena nunca deben romper la app.

export function readJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
    } catch (e) {
        console.warn(`No se pudo leer "${key}" de localStorage:`, e);
        return fallback;
    }
}

// Devuelve false si no se pudo guardar (ej. QuotaExceededError).
export function writeJSON(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.warn(`No se pudo guardar "${key}" en localStorage:`, e);
        return false;
    }
}

export function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
