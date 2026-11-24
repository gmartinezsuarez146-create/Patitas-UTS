/* ==========================================================
   Módulo INICIO: resumen y accesos rápidos
   ========================================================== */
const Inicio = {
  async cargar() {
    document.getElementById('saludoNombre').textContent = sesion.nombre.split(' ')[0];
    Inicio.renderAccesos();

    const cont = document.getElementById('estadisticas');
    cont.innerHTML = spinner('Calculando resumen…');
    try {
      const mascotas = await api('/mascotas');
      const contar = estado => mascotas.filter(m => m.estado === estado).length;

      const tarjetas = [
        { icono: 'bi-heart', titulo: 'Mascotas registradas', valor: mascotas.length },
        { icono: 'bi-house-heart', titulo: 'Disponibles para adopción', valor: contar('Disponible') },
        { icono: 'bi-hourglass-split', titulo: 'Solicitudes en proceso', valor: contar('En proceso') },
        { icono: 'bi-emoji-smile', titulo: 'Ya encontraron hogar', valor: contar('Adoptado') }
      ];
      if (esAdmin) {
        const usuarios = await api('/usuarios');
        tarjetas.push({ icono: 'bi-people', titulo: 'Usuarios registrados', valor: usuarios.length });
      }

      const col = esAdmin ? 'col-6 col-md-4 col-xl' : 'col-6 col-lg-3';
      cont.innerHTML = tarjetas.map(t => `
        <div class="${col}">
          <div class="stat p-3 h-100">
            <i class="bi ${t.icono}"></i>
            <div class="valor">${t.valor}</div>
            <div class="small text-muted">${t.titulo}</div>
          </div>
        </div>`).join('');
    } catch {
      cont.innerHTML = `<div class="col-12"><div class="alert alert-warning mb-0">No se pudo leer la base de datos. Verifica que json-server esté en ejecución.</div></div>`;
    }
  },

  renderAccesos() {
    const opciones = MENU.filter(m => m.roles.includes(sesion.rol) && !['inicio', 'salir'].includes(m.id));
    document.getElementById('accesos').innerHTML = opciones.map(m => `
      <div class="col-sm-6 col-lg-3">
        <button type="button" class="acceso p-3 h-100" data-sec="${m.id}">
          <i class="bi ${m.icono}"></i>
          <div class="fw-bold mt-2">${m.texto}</div>
          <div class="small text-muted">${m.descripcion}</div>
        </button>
      </div>`).join('');
  }
};
