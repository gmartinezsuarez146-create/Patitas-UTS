# Documentación de APIs · Patitas UTS

## 1. API REST pública: Dog CEO

- URL base: `https://dog.ceo/api`
- Documentación oficial: https://dog.ceo/dog-api/documentation/
- No requiere API key ni registro.
- Archivo que la consume: `js/apirest.js`

### Endpoints usados

| Método | Endpoint | Uso en la app |
|---|---|---|
| GET | `/breeds/list/all` | Llena el selector de razas |
| GET | `/breeds/image/random/12` | 12 fotos aleatorias de cualquier raza |
| GET | `/breed/{raza}/images/random/12` | 12 fotos de una raza (ej. `beagle`) |
| GET | `/breed/{raza}/{subraza}/images/random/12` | 12 fotos de una sub-raza (ej. `bulldog/french`) |

### Ejemplos de respuesta

`GET /breeds/list/all`
```json
{
  "message": {
    "akita": [],
    "beagle": [],
    "bulldog": ["boston", "english", "french"]
  },
  "status": "success"
}
```

`GET /breed/beagle/images/random/2`
```json
{
  "message": [
    "https://images.dog.ceo/breeds/beagle/n02088364_11136.jpg",
    "https://images.dog.ceo/breeds/beagle/n02088364_959.jpg"
  ],
  "status": "success"
}
```

### Funcionamiento en el código

1. `cargarRazas()` hace `fetch('/breeds/list/all')`, recorre el objeto `message` con `Object.entries()` y crea una opción por cada raza; si la raza tiene sub-razas, crea una opción por cada una (`bulldog/french` → "French Bulldog").
2. `construirUrl()` decide el endpoint: si hay raza elegida usa `/breed/{raza}/images/random/12`; si no, `/breeds/image/random/12`.
3. `consultar()` ejecuta `fetch(url)`, valida `res.ok` y `status === "success"`, quita fotos repetidas y llama a `render()`.
4. `razaDesdeUrl()` obtiene el nombre de la raza desde la URL de cada foto (`/breeds/hound-afghan/...` → "Afghan Hound").
5. `render()` pinta cada foto como tarjeta de Bootstrap con el nombre de la raza.
6. Si el perfil es administrador, el botón **Registrar en adopción** abre el formulario de mascota con la especie, la raza y la foto ya llenas; al guardar se ejecuta `POST /mascotas`.
7. Los errores de red se capturan con `try/catch` y se muestran en pantalla.

## 2. API REST local: json-server

- URL base: `http://localhost:3000`
- Archivo de datos: `db/db.json`
- Se inicia con `npm start`

### Usuarios (`js/auth.js`, `js/configuracion.js`, `js/password.js`)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/usuarios` | Lista todos los usuarios |
| GET | `/usuarios?usuario={u}` | Busca por nombre de usuario (login y validación) |
| GET | `/usuarios?email={correo}` | Busca por correo (validación) |
| GET | `/usuarios/{id}` | Obtiene un usuario |
| POST | `/usuarios` | Crea un usuario (registro o desde Configuración) |
| PATCH | `/usuarios/{id}` | Actualiza datos o contraseña |
| DELETE | `/usuarios/{id}` | Elimina un usuario |

### Mascotas (`js/mascotas.js`, `js/inicio.js`)

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/mascotas?_sort=id&_order=desc` | Lista de la más reciente a la más antigua |
| GET | `/mascotas/{id}` | Verifica que siga disponible antes de una solicitud |
| POST | `/mascotas` | Registra una mascota |
| PATCH | `/mascotas/{id}` | Edita una mascota o registra una solicitud de adopción |
| DELETE | `/mascotas/{id}` | Elimina una mascota |

Ejemplo de cuerpo al solicitar una adopción (`PATCH /mascotas/2`):
```json
{
  "estado": "En proceso",
  "solicitante": { "id": 2, "nombre": "Usuario Global", "email": "usuario@patitas.org" },
  "fechaSolicitud": "2026-11-24T15:30:00.000Z"
}
```

Todas las peticiones pasan por la función `api()` de `js/utils.js`, que agrega el encabezado `Content-Type: application/json`, convierte el cuerpo con `JSON.stringify` y lanza un error si la respuesta no es exitosa.
