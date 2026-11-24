/* ==========================================================
   Módulo CONFIGURACIÓN: CRUD de usuarios con Fetch (solo admin)
     GET    /usuarios          -> listar
     POST   /usuarios          -> crear
     PATCH  /usuarios/:id      -> actualizar
     DELETE /usuarios/:id      -> eliminar
   ========================================================== */
const Configuracion = (() => {
  let lista = [];
  let modal;
  const $ = id => document.getElementById(id);
  const esYo = id => String(id) === String(sesion.id);

  async function cargar() {
    if (!esAdmin) return;
    $('tablaUsuarios').innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Cargando usuarios…</td></tr>`;
    try {
      lista = await api('/usuarios');
      render();
    } catch {
      $('tablaUsuarios').innerHTML = `<tr><td colspan="7"><div class="alert alert-warning mb-0">No se pudieron cargar los usuarios. Verifica que json-server esté en ejecución.</div></td></tr>`;
    }
  }

  function render() {
    $('tablaUsuarios').innerHTML = lista.map(u => `
      <tr>
        <td>${u.id}</td>
        <td><div class="fw-semibold">${escapeHtml(u.nombre)} ${esYo(u.id) ? '<span class="badge text-bg-secondary">Tú</span>' : ''}</div>
            <small class="text-muted">${escapeHtml(u.email)}</small></td>
        <td>@${escapeHtml(u.usuario)}</td>
        <td><span class="badge ${u.rol === 'admin' ? 'text-bg-dark' : 'rol-badge'}">${u.rol === 'admin' ? 'Administrador' : 'Usuario global'}</span></td>
        <td><span class="badge ${u.activo ? 'text-bg-success' : 'text-bg-secondary'}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td class="small">${fechaCorta(u.fechaRegistro)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-primary" data-editar="${u.id}" aria-label="Editar ${escapeHtml(u.nombre)}"><i class="bi bi-pencil"></i></button>
          <button class="btn btn-sm btn-outline-danger" data-eliminar="${u.id}" ${esYo(u.id) ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''} aria-label="Eliminar ${escapeHtml(u.nombre)}"><i class="bi bi-trash"></i></button>
        </td>
      </tr>`).join('');
  }

  function abrir(u = null) {
    const form = $('formUsuario');
    form.reset();
    form.classList.remove('was-validated');
    limpiarAlerta('alertaUsuario');
    $('modalUsuarioTitulo').textContent = u ? 'Editar usuario' : 'Nuevo usuario';
    $('usrId').value = u?.id ?? '';
    $('usrNombre').value = u?.nombre ?? '';
    $('usrEmail').value = u?.email ?? '';
    $('usrUsuario').value = u?.usuario ?? '';
    $('usrRol').value = u?.rol ?? 'usuario';
    $('usrActivo').checked = u ? u.activo : true;
    $('usrPassword').required = !u;
    $('usrPasswordAyuda').textContent = u ? 'Déjala vacía para conservar la contraseña actual.' : 'Mínimo 6 caracteres.';
    // El administrador no puede quitarse su propio perfil ni desactivarse
    const propio = u && esYo(u.id);
    $('usrRol').disabled = propio;
    $('usrActivo').disabled = propio;
    modal.show();
  }

  async function guardar(e) {
    e.preventDefault();
    const form = e.target;
    const id = $('usrId').value;
    const email = $('usrEmail').value.trim().toLowerCase();
    const usuario = $('usrUsuario').value.trim().toLowerCase();
    const password = $('usrPassword').value;

    if (!form.checkValidity() || !emailValido(email)) { form.classList.add('was-validated'); return; }

    try {
      // Validar que usuario y correo no estén repetidos (ignorando el mismo registro)
      const [porUsuario, porEmail] = await Promise.all([
        api(`/usuarios?usuario=${encodeURIComponent(usuario)}`),
        api(`/usuarios?email=${encodeURIComponent(email)}`)
      ]);
      if (porUsuario.some(u => String(u.id) !== id)) return mostrarAlerta('alertaUsuario', 'Ese nombre de usuario ya existe.', 'warning');
      if (porEmail.some(u => String(u.id) !== id)) return mostrarAlerta('alertaUsuario', 'Ese correo ya está registrado.', 'warning');

      const datos = {
        nombre: $('usrNombre').value.trim(),
        email, usuario,
        rol: $('usrRol').value,
        activo: $('usrActivo').checked
      };
      if (password) datos.password = await hashPassword(password);

      if (id) {
        await api(`/usuarios/${id}`, { method: 'PATCH', body: datos });
        if (esYo(id)) {                 // si edité mi propia cuenta, actualizo la sesión y la plantilla
          Object.assign(sesion, datos);
          setSesion(sesion);
          renderPresentacion();
        }
        notificar('Usuario actualizado.');
      } else {
        await api('/usuarios', { method: 'POST', body: { ...datos, fechaRegistro: new Date().toISOString() } });
        notificar('Usuario creado.');
      }
      modal.hide();
      cargar();
    } catch {
      mostrarAlerta('alertaUsuario', 'No se pudo guardar. Verifica que json-server esté en ejecución.');
    }
  }

  async function eliminar(id) {
    if (esYo(id)) return;
    const u = lista.find(x => String(x.id) === String(id));
    if (!(await confirmar(`¿Eliminar la cuenta de ${u?.nombre}?`))) return;
    try {
      await api(`/usuarios/${id}`, { method: 'DELETE' });
      notificar('Usuario eliminado.');
      cargar();
    } catch {
      notificar('No se pudo eliminar el usuario.', 'danger');
    }
  }

  function init() {
    if (!esAdmin) return;
    modal = new bootstrap.Modal('#modalUsuario');
    $('btnNuevoUsuario').addEventListener('click', () => abrir());
    $('formUsuario').addEventListener('submit', guardar);
    $('tablaUsuarios').addEventListener('click', e => {
      const editar = e.target.closest('[data-editar]');
      const borrar = e.target.closest('[data-eliminar]');
      if (editar) abrir(lista.find(u => String(u.id) === editar.dataset.editar));
      if (borrar) eliminar(borrar.dataset.eliminar);
    });
  }

  return { init, cargar };
})();
