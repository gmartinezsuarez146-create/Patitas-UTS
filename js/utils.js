/* ==========================================================
   Utilidades compartidas por todas las páginas
   ========================================================== */
const SESION_KEY = 'patitas_sesion';

/** Cifra una contraseña con SHA-256 (no se guardan contraseñas en texto plano). */
async function hashPassword(texto) {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ----- Sesión (se guarda en localStorage como objeto JSON, sin la contraseña) ----- */
function getSesion() {
  try { return JSON.parse(localStorage.getItem(SESION_KEY)); } catch { return null; }
}
function setSesion(usuario) {
  const { password, ...datos } = usuario;
  localStorage.setItem(SESION_KEY, JSON.stringify(datos));
}
function cerrarSesion() {
  localStorage.removeItem(SESION_KEY);
}

/**
 * Envoltorio de fetch para json-server.
 * @param {string} ruta     p. ej. '/usuarios' o '/mascotas/3'
 * @param {object} opciones { method, body }
 */
async function api(ruta, opciones = {}) {
  const res = await fetch(`${API_URL}${ruta}`, {
    method: opciones.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opciones.body ? JSON.stringify(opciones.body) : undefined
  });
  if (!res.ok) throw new Error(`Error ${res.status} en ${ruta}`);
  return res.status === 204 ? null : res.json();
}

/* ----- Helpers de interfaz ----- */
function escapeHtml(texto = '') {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
function moneda(valor) { return formatoCOP.format(Number(valor) || 0); }

function fechaCorta(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
}

function emailValido(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function mostrarAlerta(idContenedor, mensaje, tipo = 'danger') {
  document.getElementById(idContenedor).innerHTML =
    `<div class="alert alert-${tipo} alert-dismissible fade show py-2" role="alert">${mensaje}
       <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
     </div>`;
}
function limpiarAlerta(idContenedor) { document.getElementById(idContenedor).innerHTML = ''; }

function spinner(texto = 'Cargando…') {
  return `<div class="col-12 text-center text-muted py-5"><div class="spinner-border text-secondary mb-2" role="status"></div><div>${texto}</div></div>`;
}

/* Botones de "ver contraseña": <button data-ver="idDelInput"> */
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-ver]');
  if (!btn) return;
  const input = document.getElementById(btn.dataset.ver);
  const visible = input.type === 'text';
  input.type = visible ? 'password' : 'text';
  btn.innerHTML = `<i class="bi ${visible ? 'bi-eye' : 'bi-eye-slash'}"></i>`;
});
