/* ==========================================================
   Módulo API REST: consumo de la API pública Dog CEO
   Documentación oficial: https://dog.ceo/dog-api/documentation/
   No requiere registro ni API key.
   ----------------------------------------------------------
   Endpoints utilizados (todos con método GET):
     /breeds/list/all                          -> todas las razas y sus sub-razas
     /breeds/image/random/12                   -> 12 fotos aleatorias
     /breed/{raza}/images/random/12            -> 12 fotos de una raza
     /breed/{raza}/{subraza}/images/random/12  -> 12 fotos de una sub-raza
   Formato de respuesta:
     { "message": [ "https://images.dog.ceo/breeds/hound-afghan/n02088094_1003.jpg", ... ],
       "status": "success" }
   En /breeds/list/all, "message" es un objeto: { "bulldog": ["boston","english","french"], "akita": [] }
   ----------------------------------------------------------
   Flujo:
     1. cargarRazas() llena el <select> con las razas.
     2. construirUrl() arma la URL según la raza elegida.
     3. consultar() hace fetch(), valida la respuesta y pinta las fotos.
     4. La raza de cada foto se saca de su URL (razaDesdeUrl).
     5. El administrador puede "Registrar en adopción": se abre el formulario
        de mascota con la foto y la raza ya llenas, y se guarda con POST /mascotas.
   ========================================================== */
const ApiRest = (() => {
  const CANTIDAD = 12;
  let fotos = [];
  let iniciado = false;
  const $ = id => document.getElementById(id);

  const capitalizar = t => t.replace(/\b\w/g, c => c.toUpperCase());

  /** Llena el selector con razas y sub-razas. */
  async function cargarRazas() {
    const res = await fetch(`${PUBLIC_API}/breeds/list/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const opciones = [];
    Object.entries(data.message).forEach(([raza, subrazas]) => {
      if (subrazas.length) subrazas.forEach(sub => opciones.push({ valor: `${raza}/${sub}`, texto: `${sub} ${raza}` }));
      else opciones.push({ valor: raza, texto: raza });
    });
    $('apiRaza').insertAdjacentHTML('beforeend',
      opciones.map(o => `<option value="${escapeHtml(o.valor)}">${escapeHtml(capitalizar(o.texto))}</option>`).join(''));
  }

  /** URL según la raza elegida (vacío = aleatorias de todas las razas). */
  function construirUrl(raza) {
    return raza
      ? `${PUBLIC_API}/breed/${raza}/images/random/${CANTIDAD}`
      : `${PUBLIC_API}/breeds/image/random/${CANTIDAD}`;
  }

  /** https://images.dog.ceo/breeds/hound-afghan/xxx.jpg  ->  "Afghan Hound" */
  function razaDesdeUrl(url) {
    const segmento = (url.split('/breeds/')[1] || '').split('/')[0];
    const [raza, sub] = segmento.split('-');
    return capitalizar(sub ? `${sub} ${raza}` : raza || 'Desconocida');
  }

  async function consultar() {
    const url = construirUrl($('apiRaza').value);
    $('apiResultados').innerHTML = spinner('Buscando peluditos…');
    $('apiEstado').innerHTML = '';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.status !== 'success') throw new Error('respuesta inválida');
      fotos = [...new Set(data.message)];   // quita fotos repetidas
      $('apiEstado').innerHTML = `<code>GET ${escapeHtml(url)}</code> &nbsp;·&nbsp; ${fotos.length} foto(s)`;
      render();
    } catch (err) {
      fotos = [];
      $('apiResultados').innerHTML = `<div class="col-12"><div class="alert alert-danger">No se pudo consultar la API pública (${escapeHtml(err.message)}). Revisa tu conexión a internet.</div></div>`;
    }
  }

  function render() {
    $('apiResultados').innerHTML = fotos.map((url, i) => `
      <div class="col-6 col-md-4 col-xl-3">
        <div class="card h-100 articulo">
          <img src="${escapeHtml(url)}" class="articulo-img" alt="Perro de raza ${escapeHtml(razaDesdeUrl(url))}" loading="lazy">
          <div class="card-body py-2">
            <div class="fw-bold">${escapeHtml(razaDesdeUrl(url))}</div>
          </div>
          ${esAdmin ? `<div class="card-footer bg-transparent"><button class="btn btn-sm btn-outline-primary w-100" data-registrar="${i}"><i class="bi bi-plus-circle"></i> Registrar en adopción</button></div>` : ''}
        </div>
      </div>`).join('');
  }

  function init() {
    $('formApi').addEventListener('submit', e => { e.preventDefault(); consultar(); });
    $('apiRaza').addEventListener('change', consultar);
    $('apiOtras').addEventListener('click', consultar);
    $('apiResultados').addEventListener('click', e => {
      const btn = e.target.closest('[data-registrar]');
      if (!btn || !esAdmin) return;
      const url = fotos[Number(btn.dataset.registrar)];
      Mascotas.abrir({ especie: 'Perro', raza: razaDesdeUrl(url), imagen: url, estado: 'Disponible', origen: 'Dog CEO' });
    });
  }

  function cargar() {
    if (iniciado) return;
    iniciado = true;
    cargarRazas().catch(() => {});
    consultar();
  }

  return { init, cargar };
})();
