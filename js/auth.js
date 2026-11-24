/* ==========================================================
   Login y registro de usuarios (index.html)
   Los usuarios se guardan como arreglo JSON en json-server (/usuarios)
   y la sesión activa se guarda en localStorage.
   ========================================================== */
if (getSesion()) location.replace('app.html');

const MSG_SERVIDOR = 'No hay conexión con la base de datos. Ejecuta <code>npm start</code> y abre <code>http://localhost:3000</code>.';

/* ---------- LOGIN ---------- */
document.getElementById('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  const usuario = document.getElementById('loginUsuario').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  if (!usuario || !password) return mostrarAlerta('alertaAuth', 'Escribe tu usuario y tu contraseña.', 'warning');

  try {
    const coincidencias = await api(`/usuarios?usuario=${encodeURIComponent(usuario)}`);
    const hash = await hashPassword(password);
    const encontrado = coincidencias.find(u => u.password === hash);

    if (!encontrado) return mostrarAlerta('alertaAuth', 'Usuario o contraseña incorrectos.');
    if (!encontrado.activo) return mostrarAlerta('alertaAuth', 'Tu cuenta está inactiva. Pide al administrador que la active.', 'warning');

    setSesion(encontrado);
    location.replace('app.html');
  } catch {
    mostrarAlerta('alertaAuth', MSG_SERVIDOR);
  }
});

/* ---------- REGISTRO ---------- */
document.getElementById('formRegistro').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target;
  const nombre = document.getElementById('regNombre').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const usuario = document.getElementById('regUsuario').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const confirmar = document.getElementById('regConfirmar').value;

  if (!form.checkValidity() || !emailValido(email)) {
    form.classList.add('was-validated');
    return mostrarAlerta('alertaAuth', 'Revisa los campos marcados.', 'warning');
  }
  if (password !== confirmar) return mostrarAlerta('alertaAuth', 'Las contraseñas no coinciden.', 'warning');

  try {
    const [porUsuario, porEmail] = await Promise.all([
      api(`/usuarios?usuario=${encodeURIComponent(usuario)}`),
      api(`/usuarios?email=${encodeURIComponent(email)}`)
    ]);
    if (porUsuario.length) return mostrarAlerta('alertaAuth', 'Ese nombre de usuario ya existe. Prueba con otro.', 'warning');
    if (porEmail.length) return mostrarAlerta('alertaAuth', 'Ya hay una cuenta con ese correo.', 'warning');

    await api('/usuarios', {
      method: 'POST',
      body: {
        nombre, email, usuario,
        password: await hashPassword(password),
        rol: 'usuario',               // toda cuenta nueva es "usuario global"
        activo: true,
        fechaRegistro: new Date().toISOString()
      }
    });

    form.reset();
    form.classList.remove('was-validated');
    bootstrap.Tab.getOrCreateInstance(document.querySelector('[data-bs-target="#tab-login"]')).show();
    document.getElementById('loginUsuario').value = usuario;
    mostrarAlerta('alertaAuth', 'Cuenta creada. Ya puedes iniciar sesión.', 'success');
  } catch {
    mostrarAlerta('alertaAuth', MSG_SERVIDOR);
  }
});
