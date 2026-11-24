/* ==========================================================
   Módulo CONTRASEÑA: cambio de clave del usuario en sesión
   ========================================================== */
const Password = (() => {
  const $ = id => document.getElementById(id);

  async function cambiar(e) {
    e.preventDefault();
    const actual = $('passActual').value;
    const nueva = $('passNueva').value;
    const confirmacion = $('passConfirmar').value;

    if (!actual || !nueva || !confirmacion) return mostrarAlerta('alertaPassword', 'Completa los tres campos.', 'warning');
    if (nueva.length < 6) return mostrarAlerta('alertaPassword', 'La nueva contraseña debe tener mínimo 6 caracteres.', 'warning');
    if (nueva !== confirmacion) return mostrarAlerta('alertaPassword', 'La confirmación no coincide con la nueva contraseña.', 'warning');
    if (nueva === actual) return mostrarAlerta('alertaPassword', 'La nueva contraseña debe ser diferente a la actual.', 'warning');

    try {
      const usuario = await api(`/usuarios/${sesion.id}`);
      if (usuario.password !== await hashPassword(actual)) {
        return mostrarAlerta('alertaPassword', 'La contraseña actual no es correcta.');
      }
      await api(`/usuarios/${sesion.id}`, { method: 'PATCH', body: { password: await hashPassword(nueva) } });
      e.target.reset();
      mostrarAlerta('alertaPassword', 'Contraseña actualizada. Úsala la próxima vez que inicies sesión.', 'success');
      notificar('Contraseña actualizada.');
    } catch {
      mostrarAlerta('alertaPassword', 'No se pudo actualizar. Verifica que json-server esté en ejecución.');
    }
  }

  function init() { $('formPassword').addEventListener('submit', cambiar); }
  function cargar() { limpiarAlerta('alertaPassword'); $('formPassword').reset(); }

  return { init, cargar };
})();
