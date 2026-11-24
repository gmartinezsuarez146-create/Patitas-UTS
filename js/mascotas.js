/* ==========================================================
   Módulo ARTÍCULOS: mascotas en adopción (json-server /mascotas)
   - Administrador: registra, edita y elimina mascotas (CRUD con Fetch).
   - Usuario global: consulta, filtra y solicita la adopción.
   ========================================================== */
const Mascotas = (() => {
  let lista = [];
  let modal;
  const $ = id => document.getElementById(id);
  const ESTADOS = { 'Disponible': 'text-bg-success', 'En proceso': 'text-bg-warning', 'Adoptado': 'text-bg-secondary' };

  async function cargar() {
    $('gridMascotas').innerHTML = spinner('Cargando mascotas…');
    try {
      lista = await api('/mascotas?_sort=id&_order=desc');      // READ
      render();
    } catch {
      $('gridMascotas').innerHTML = `<div class="col-12"><div class="alert alert-warning">No se pudieron cargar las mascotas. Verifica que json-server esté en ejecución.</div></div>`;
    }
  }

  function render() {
    const texto = $('buscarMascota').value.trim().toLowerCase();
    const especie = $('filtroEspecie').value;
    const estado = $('filtroEstado').value;
    const datos = lista.filter(m =>
      `${m.nombre} ${m.raza}`.toLowerCase().includes(texto) &&
      (!especie || m.especie === especie) &&
      (!estado || m.estado === estado));
    $('totalMascotas').textContent = lista.length;

    if (!datos.length) {
      $('gridMascotas').innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="bi bi-search-heart fs-1"></i>
        <p class="mt-2">${lista.length ? 'Ninguna mascota coincide con los filtros.' : 'Aún no hay mascotas registradas.'}</p></div>`;
      return;
    }
    $('gridMascotas').innerHTML = datos.map(tarjeta).join('');
  }

  function tarjeta(m) {
    const icono = m.especie === 'Gato' ? 'bi-emoji-heart-eyes' : 'bi-heart';
    const foto = m.imagen
      ? `<img src="${escapeHtml(m.imagen)}" class="articulo-img" alt="Foto de ${escapeHtml(m.nombre)}" loading="lazy">`
      : `<div class="articulo-img sin-imagen" aria-hidden="true"><i class="bi ${icono}"></i></div>`;
    const salud = (ok, txt) => `<span class="${ok ? 'si' : 'no'} me-3"><i class="bi ${ok ? 'bi-check-circle-fill' : 'bi-dash-circle'}"></i> ${txt}</span>`;

    let pie = '';
    if (esAdmin) {
      pie = `
        <div class="card-footer bg-transparent d-flex gap-2">
          <button class="btn btn-sm btn-outline-primary flex-fill" data-editar="${m.id}"><i class="bi bi-pencil"></i> Editar</button>
          <button class="btn btn-sm btn-outline-danger flex-fill" data-eliminar="${m.id}"><i class="bi bi-trash"></i> Eliminar</button>
        </div>`;
    } else if (m.estado === 'Disponible') {
      pie = `<div class="card-footer bg-transparent"><button class="btn btn-sm btn-primary w-100" data-adoptar="${m.id}"><i class="bi bi-house-heart"></i> Quiero adoptar a ${escapeHtml(m.nombre)}</button></div>`;
    }

    const solicitud = m.solicitante && m.estado === 'En proceso'
      ? `<div class="solicitud mt-2"><i class="bi bi-envelope-paper-heart"></i> ${
          esAdmin ? `Solicitud de ${escapeHtml(m.solicitante.nombre)} (${escapeHtml(m.solicitante.email)})`
                  : (String(m.solicitante.id) === String(sesion.id) ? 'Tu solicitud está en revisión' : 'Ya tiene una solicitud en revisión')
        }</div>` : '';

    return `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <div class="card h-100 articulo position-relative">
          ${foto}
          <span class="badge mascota-estado ${ESTADOS[m.estado] || 'text-bg-light'}">${escapeHtml(m.estado)}</span>
          <div class="card-body">
            <h2 class="h5 fw-bold mb-0">${escapeHtml(m.nombre)}</h2>
            <div class="small text-muted mb-2">${escapeHtml(m.especie)} · ${escapeHtml(m.raza)}</div>
            <div class="mb-2">
              <span class="chip">${escapeHtml(m.edad)}</span><span class="chip">${escapeHtml(m.sexo)}</span><span class="chip">${escapeHtml(m.tamano)}</span>
            </div>
            <div class="salud mb-2">${salud(m.vacunado, 'Vacunado')}${salud(m.esterilizado, 'Esterilizado')}</div>
            <p class="small text-muted descripcion mb-0">${escapeHtml(m.descripcion || '')}</p>
            ${solicitud}
          </div>
          ${pie}
        </div>
      </div>`;
  }

  function vistaPrevia(url) {
    const ok = !!url;
    $('masVista').classList.toggle('d-none', !ok);
    $('masSinVista').classList.toggle('d-none', ok);
    if (ok) $('masVista').src = url;
  }

  /** Abre el formulario. Con id = editar; sin id = registrar (puede venir pre-llenado desde API REST). */
  function abrir(m = {}) {
    if (!esAdmin) return;
    const form = $('formMascota');
    form.reset();
    form.classList.remove('was-validated');
    form.dataset.origen = m.origen || '';
    $('modalMascotaTitulo').textContent = m.id ? `Editar a ${m.nombre}` : 'Registrar mascota';
    $('masId').value = m.id ?? '';
    $('masNombre').value = m.nombre ?? '';
    $('masEspecie').value = m.especie ?? 'Perro';
    $('masRaza').value = m.raza ?? '';
    $('masEdad').value = m.edad ?? '';
    $('masSexo').value = m.sexo ?? 'Macho';
    $('masTamano').value = m.tamano ?? 'Mediano';
    $('masEstado').value = m.estado ?? 'Disponible';
    $('masImagen').value = m.imagen ?? '';
    $('masVacunado').checked = !!m.vacunado;
    $('masEsterilizado').checked = !!m.esterilizado;
    $('masDescripcion').value = m.descripcion ?? '';
    vistaPrevia(m.imagen);
    modal.show();
  }

  async function guardar(e) {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }

    const id = $('masId').value;
    const datos = {
      nombre: $('masNombre').value.trim(),
      especie: $('masEspecie').value,
      raza: $('masRaza').value.trim(),
      edad: $('masEdad').value.trim(),
      sexo: $('masSexo').value,
      tamano: $('masTamano').value,
      estado: $('masEstado').value,
      imagen: $('masImagen').value.trim(),
      vacunado: $('masVacunado').checked,
      esterilizado: $('masEsterilizado').checked,
      descripcion: $('masDescripcion').value.trim()
    };
    try {
      if (id) {
        await api(`/mascotas/${id}`, { method: 'PATCH', body: { ...datos, fechaActualizacion: new Date().toISOString() } }); // UPDATE
        notificar(`${datos.nombre} se actualizó.`);
      } else {
        await api('/mascotas', {                                                                                         // CREATE
          method: 'POST',
          body: { ...datos, ...(form.dataset.origen && { origen: form.dataset.origen }), creadoPor: sesion.id, fechaCreacion: new Date().toISOString() }
        });
        notificar(`${datos.nombre} quedó registrado(a) para adopción.`);
      }
      modal.hide();
      cargar();
    } catch {
      notificar('No se pudo guardar la mascota.', 'danger');
    }
  }

  async function eliminar(id) {
    const m = lista.find(x => String(x.id) === String(id));
    if (!(await confirmar(`¿Eliminar a ${m?.nombre} del catálogo? Esta acción no se puede deshacer.`))) return;
    try {
      await api(`/mascotas/${id}`, { method: 'DELETE' });                                                               // DELETE
      notificar(`${m?.nombre} se eliminó del catálogo.`);
      cargar();
    } catch {
      notificar('No se pudo eliminar la mascota.', 'danger');
    }
  }

  /** Usuario global: solicita la adopción (la mascota pasa a "En proceso"). */
  async function solicitar(id) {
    const m = lista.find(x => String(x.id) === String(id));
    if (!(await confirmar(`¿Enviar solicitud para adoptar a ${m?.nombre}? La fundación te contactará a ${sesion.email}.`, 'Enviar solicitud', 'btn-primary'))) return;
    try {
      const actual = await api(`/mascotas/${id}`);
      if (actual.estado !== 'Disponible') { notificar(`${m.nombre} ya no está disponible.`, 'warning'); return cargar(); }
      await api(`/mascotas/${id}`, {
        method: 'PATCH',
        body: {
          estado: 'En proceso',
          solicitante: { id: sesion.id, nombre: sesion.nombre, email: sesion.email },
          fechaSolicitud: new Date().toISOString()
        }
      });
      notificar(`¡Solicitud enviada! Pronto te contactaremos sobre ${m.nombre}.`);
      cargar();
    } catch {
      notificar('No se pudo enviar la solicitud.', 'danger');
    }
  }

  function init() {
    modal = new bootstrap.Modal('#modalMascota');
    if (!esAdmin) $('btnNuevaMascota').classList.add('d-none');

    ['buscarMascota', 'filtroEspecie', 'filtroEstado'].forEach(id => $(id).addEventListener('input', render));
    $('btnNuevaMascota').addEventListener('click', () => abrir());
    $('masImagen').addEventListener('change', e => vistaPrevia(e.target.value.trim()));
    $('formMascota').addEventListener('submit', guardar);
    $('gridMascotas').addEventListener('click', e => {
      const editar = e.target.closest('[data-editar]');
      const borrar = e.target.closest('[data-eliminar]');
      const adoptar = e.target.closest('[data-adoptar]');
      if (editar && esAdmin) abrir(lista.find(m => String(m.id) === editar.dataset.editar));
      if (borrar && esAdmin) eliminar(borrar.dataset.eliminar);
      if (adoptar && !esAdmin) solicitar(adoptar.dataset.adoptar);
    });
  }

  return { init, cargar, abrir };
})();
