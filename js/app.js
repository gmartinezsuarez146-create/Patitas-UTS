/* ==========================================================
   Núcleo de la aplicación (app.html)
   - Protege la página: sin sesión vuelve al login.
   - Arma el menú según el perfil (admin / usuario global).
   - Mantiene la plantilla de presentación con fecha y hora.
   - Navega entre secciones y gestiona el logout.
   ========================================================== */
const sesion = getSesion();
const esAdmin = sesion?.rol === 'admin';

/* Opciones del menú y perfiles que pueden verlas */
const MENU = [
  { id: 'inicio',        texto: 'Inicio',        icono: 'bi-house',            roles: ['admin', 'usuario'], descripcion: 'Resumen general.' },
  { id: 'apirest',       texto: 'API REST',      icono: 'bi-cloud-arrow-down', roles: ['admin', 'usuario'], descripcion: 'Explora razas y fotos de perros.' },
  { id: 'articulos',     texto: 'Artículos',     icono: 'bi-heart',            roles: ['admin', 'usuario'], descripcion: 'Conoce las mascotas en adopción.' },
  { id: 'configuracion', texto: 'Configuración', icono: 'bi-gear',             roles: ['admin'],            descripcion: 'Administra las cuentas de usuario.' },
  { id: 'password',      texto: 'Contraseña',    icono: 'bi-key',              roles: ['admin', 'usuario'], descripcion: 'Cambia tu clave de acceso.' },
  { id: 'salir',         texto: 'Salir',         icono: 'bi-box-arrow-right',  roles: ['admin', 'usuario'], descripcion: 'Cerrar sesión.' }
];

/* ---------- Notificaciones y confirmaciones ---------- */
function notificar(mensaje, tipo = 'success') {
  const iconos = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  const id = `toast-${Date.now()}`;
  document.getElementById('toasts').insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-${tipo} border-0" role="status" aria-live="polite">
      <div class="d-flex">
        <div class="toast-body"><i class="bi ${iconos[tipo] || 'bi-info-circle-fill'} me-2"></i>${escapeHtml(mensaje)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    </div>`);
  const el = document.getElementById(id);
  new bootstrap.Toast(el, { delay: 3000 }).show();
  el.addEventListener('hidden.bs.toast', () => el.remove());
}

function confirmar(mensaje, textoBoton = 'Eliminar', claseBoton = 'btn-danger') {
  return new Promise(resolve => {
    const el = document.getElementById('modalConfirmar');
    const btn = document.getElementById('btnConfirmar');
    btn.textContent = textoBoton;
    btn.className = `btn ${claseBoton}`;
    const modal = bootstrap.Modal.getOrCreateInstance(el);
    let aceptado = false;
    document.getElementById('confirmarTexto').textContent = mensaje;
    const alAceptar = () => { aceptado = true; modal.hide(); };
    btn.addEventListener('click', alAceptar, { once: true });
    el.addEventListener('hidden.bs.modal', () => { btn.removeEventListener('click', alAceptar); resolve(aceptado); }, { once: true });
    modal.show();
  });
}

/* ---------- Plantilla de presentación ---------- */
function renderPresentacion() {
  const iniciales = sesion.nombre.split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');
  document.getElementById('avatar').textContent = iniciales;
  document.getElementById('infoNombre').textContent = sesion.nombre;
  document.getElementById('infoUsuario').textContent = `@${sesion.usuario} | ${sesion.email}`;
  document.getElementById('infoRol').textContent = esAdmin ? 'Administrador' : 'Usuario global';
}

function actualizarReloj() {
  const ahora = new Date();
  document.getElementById('hora').textContent = ahora.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('fecha').textContent = ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

/* ---------- Menú y navegación ---------- */
function renderMenu() {
  document.getElementById('menu').innerHTML = MENU
    .filter(m => m.roles.includes(sesion.rol))
    .map(m => `<li class="nav-item"><a class="nav-link" href="#${m.id}" data-sec="${m.id}"><i class="bi ${m.icono} me-1"></i>${m.texto}</a></li>`)
    .join('');
}

const CARGADORES = {
  inicio: () => Inicio.cargar(),
  apirest: () => ApiRest.cargar(),
  articulos: () => Mascotas.cargar(),
  configuracion: () => Configuracion.cargar(),
  password: () => Password.cargar()
};

function navegar(id) {
  if (id === 'salir') return salir();
  const opcion = MENU.find(m => m.id === id);
  if (!opcion || !opcion.roles.includes(sesion.rol)) id = 'inicio';   // un usuario global no puede abrir Configuración

  document.querySelectorAll('.seccion').forEach(s => s.classList.toggle('d-none', s.id !== `sec-${id}`));
  document.querySelectorAll('#menu .nav-link').forEach(a => {
    const activo = a.dataset.sec === id;
    a.classList.toggle('active', activo);
    activo ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current');
  });
  bootstrap.Collapse.getInstance('#menuPrincipal')?.hide();
  history.replaceState(null, '', `#${id}`);
  CARGADORES[id]?.();
  window.scrollTo({ top: 0 });
}

/* ---------- Salir ---------- */
function salir() {
  document.getElementById('despedidaNombre').textContent = sesion.nombre.split(' ')[0];
  cerrarSesion();
  new bootstrap.Modal('#modalSalir').show();
  setTimeout(() => location.replace('index.html'), 3000);
}

/* ---------- Arranque ---------- */
if (!sesion) {
  location.replace('index.html');
} else {
  renderMenu();
  renderPresentacion();
  actualizarReloj();
  setInterval(actualizarReloj, 1000);

  ApiRest.init();
  Mascotas.init();
  Configuracion.init();
  Password.init();

  document.addEventListener('click', e => {
    const enlace = e.target.closest('[data-sec]');
    if (!enlace) return;
    e.preventDefault();
    navegar(enlace.dataset.sec);
  });

  const inicial = location.hash.slice(1);
  navegar(inicial && inicial !== 'salir' ? inicial : 'inicio');
}
