# Documentación Técnica – App de Notas (Obsidian‑like)

---

## 1. Arquitectura del Backend

El backend está implementado en **PHP 8.2** sin frameworks externos, siguiendo el patrón de **arquitectura por capas**:

- **Capa de presentación (Router / Controladores)**:  
  - `public/index.php` actúa como *front controller*.  
  - Recibe todas las peticiones, analiza la ruta y el método HTTP, y delega en el controlador correspondiente.  
  - Soporta rutas con parámetros dinámicos (expresiones regulares).  
  - Incluye un middleware de autenticación JWT que se ejecuta antes de los controladores protegidos.

- **Capa de controladores (`src/Controllers/`)**:
  - Reciben los datos de la petición (query string, cuerpo JSON, parámetros de ruta).  
  - Validan la entrada (a nivel básico).  
  - Llaman a los servicios correspondientes.  
  - Capturan excepciones y devuelven respuestas JSON con los códigos HTTP adecuados (200, 201, 400, 401, 404, 500).

- **Capa de servicios (`src/Services/`)**:
  - Contienen la lógica de negocio.  
  - Validan reglas de dominio (ej. email único, contraseña correcta, suscripción activa).  
  - Utilizan repositorios para interactuar con la base de datos.  
  - Gestionan la generación y verificación de tokens JWT.

- **Capa de repositorios (`src/Repositories/`)**:
  - Encapsulan todas las consultas SQL a PostgreSQL.  
  - Usan PDO con *prepared statements* para evitar inyecciones.  
  - Mapean filas a objetos de tipo `Entity`.

- **Capa de entidades (`src/Entities/`)**:
  - Clases planas (DTO) que representan las tablas de la base de datos.  
  - Contienen propiedades y un constructor que acepta un array para su creación.

- **Capa de configuración (`src/Config/Database.php`)**:
  - Implementa el patrón *Singleton* para la conexión PDO.  
  - Lee las credenciales de las variables de entorno (`$_ENV`).

- **Middleware (`src/Middleware/AuthMiddleware.php`)**:
  - Extrae el token JWT del header `Authorization`.  
  - Verifica su validez con el servicio `AuthService`.  
  - Si es válido, devuelve el `id_usuario`; en caso contrario, responde con 401.

- **Router**:
  - Las rutas se definen en un array asociativo dentro de `index.php`.  
  - Soporta rutas exactas y con parámetros (mediante regex).  
  - Gestiona automáticamente las peticiones `OPTIONS` para CORS.

---

## 2. Base de Datos (PostgreSQL)

La base de datos es **PostgreSQL 17** (o 15, según elección). El script de inicialización (`ini_db.sql`) crea las siguientes tablas y relaciones:

### Tablas principales

- **usuario**  
  `id_usuario SERIAL PRIMARY KEY`  
  `nombre VARCHAR(100) NOT NULL`  
  `email VARCHAR(150) UNIQUE NOT NULL`  
  `password VARCHAR(255) NOT NULL` (hash bcrypt)  
  `notificaciones_activas BOOLEAN DEFAULT TRUE`  
  `plan_actual INTEGER` (FK a `plan.id_plan`, opcional)

- **plan**  
  `id_plan SERIAL PRIMARY KEY`  
  `nombre VARCHAR(50) NOT NULL`  
  `precio_mensual DECIMAL(10,2)`  
  `precio_anual DECIMAL(10,2)`  
  *Datos iniciales*: Gratuito (0), Pro (30/70), Empresa (150/1200).

  Los precios estan dados en moneda mexicana

- **nota**  
  `id_nota SERIAL PRIMARY KEY`  
  `titulo VARCHAR(255) NOT NULL`  
  `contenido TEXT`  
  `fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP`  
  `fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP`  
  `favorito BOOLEAN DEFAULT FALSE`  
  `esta_archivado BOOLEAN DEFAULT FALSE`  
  `papelera BOOLEAN DEFAULT FALSE`  
  `id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE`  
  `id_categoria INTEGER` (reservado para futura funcionalidad)

- **suscripcion**  
  `id_suscripcion SERIAL PRIMARY KEY`  
  `fecha_inicio DATE NOT NULL`  
  `fecha_fin DATE` (NULL si activa)  
  `metodo_pago VARCHAR(50)`  
  `id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario)`  
  `id_plan INTEGER NOT NULL REFERENCES plan(id_plan)`  
  `ultimo_pago DATE`

- **recordatorio**  
  `id_recordatorio SERIAL PRIMARY KEY`  
  `fecha DATE NOT NULL`  
  `hora TIME NOT NULL`  
  `mensaje TEXT`  
  `id_nota INTEGER NOT NULL REFERENCES nota(id_nota) ON DELETE CASCADE`

- **log**  
  `id_log SERIAL PRIMARY KEY`  
  `nombre VARCHAR(255) NOT NULL`

### Relaciones clave
- Un usuario puede tener muchas notas, una suscripción activa (una o varias históricas), y varios recordatorios a través de sus notas.
- Una nota puede tener un recordatorio opcional.
- Los planes son independientes y se asignan a suscripciones.

---

## 3. API REST

**Base URL**: `http://<host>:8000/api`  url de desarrollo para produccion se utilizara una distinta.

### Autenticación
- **Registro**: `POST /auth/register` – Body: `{ "nombre": "...", "email": "...", "password": "..." }` → Devuelve `201` con los datos del usuario (sin password).
- **Login**: `POST /auth/login` – Body: `{ "email": "...", "password": "..." }` → Devuelve `200` con `{ "token": "...", "user": {...} }`.
- Todas las rutas protegidas requieren el header `Authorization: Bearer <token>`.

### Endpoints de Usuario
| Método | Ruta | Descripción | Parámetros | Respuesta |
|--------|------|-------------|------------|-----------|
| GET | `/user/profile` | Obtener perfil del usuario autenticado | - | `200` con objeto `User` |
| PUT | `/user/profile` | Actualizar nombre, email, notificaciones | Body: `{ "nombre", "email", "notificaciones_activas" }` | `200` con objeto actualizado |
| PUT | `/user/password` | Cambiar contraseña | Body: `{ "old_password", "new_password" }` | `200` con mensaje de éxito |
| DELETE | `/user/account` | Eliminar cuenta (borrado físico en cascada) | - | `204` |

### Endpoints de Notas
| Método | Ruta | Descripción | Parámetros | Respuesta |
|--------|------|-------------|------------|-----------|
| GET | `/notes` | Listar notas (no papelera) | Query `?trash=1` para incluir papelera | `200` con array de notas |
| GET | `/notes/{id}` | Obtener una nota | - | `200` con objeto nota |
| POST | `/notes` | Crear nota | Body: `{ "titulo", "contenido" }` | `201` con nota creada |
| PUT | `/notes/{id}` | Actualizar nota | Body: campos a modificar (`titulo`, `contenido`, `favorito`, `esta_archivado`, `papelera`, `id_categoria`) | `200` con nota actualizada |
| DELETE | `/notes/{id}` | Eliminar nota definitivamente | - | `204` |

### Endpoints de Planes y Suscripciones
| Método | Ruta | Descripción | Parámetros | Respuesta |
|--------|------|-------------|------------|-----------|
| GET | `/plans` | Listar todos los planes | - | `200` con array de planes |
| GET | `/subscription/active` | Obtener suscripción activa del usuario | - | `200` con objeto suscripción o `null` |
| POST | `/subscription/checkout` | Iniciar sesión de pago Stripe | Body: `{ "plan_id", "success_url", "cancel_url" }` | `200` con `{ "checkout_url": "..." }` |
| DELETE | `/subscription/cancel` | Cancelar suscripción activa | - | `200` con mensaje de éxito |

### Endpoints de Recordatorios
| Método | Ruta | Descripción | Parámetros | Respuesta |
|--------|------|-------------|------------|-----------|
| GET | `/notes/{noteId}/reminder` | Obtener recordatorio de una nota | - | `200` con objeto recordatorio o `null` |
| POST | `/notes/{noteId}/reminder` | Crear o actualizar recordatorio | Body: `{ "fecha", "hora", "mensaje" }` | `200` con recordatorio guardado |
| DELETE | `/notes/{noteId}/reminder` | Eliminar recordatorio | - | `204` |

### Endpoints de Logs (Auditoría)
| Método | Ruta | Descripción | Parámetros | Respuesta |
|--------|------|-------------|------------|-----------|
| GET | `/logs` | Listar todos los logs | - | `200` con array de logs |
| POST | `/logs` | Crear un log | Body: `{ "nombre" }` | `201` con log creado |

### Webhook de Stripe
- `POST /stripe-webhook`: Endpoint público para recibir eventos de Stripe (pendiente de implementación completa; actualmente solo responde con `200`).

### Códigos de error
- `400` – Solicitud mal formada o validación fallida.
- `401` – Token no proporcionado o inválido.
- `403` – Prohibido (ej. intentar acceder a nota de otro usuario).
- `404` – Recurso no encontrado.
- `500` – Error interno (no expuesto al cliente).

Todas las respuestas de error siguen el formato: `{ "error": "mensaje" }`.

---

## 4. Frontend (React SPA)

El frontend está construido con **React 18** y **Vite**, usando **Tailwind CSS 4** para los estilos. Sigue una arquitectura de componentes funcionales con hooks y Context API para la navegación.

### Estructura de directorios (src)
```
src/
├── Components/
│   ├── Header.jsx
│   ├── PanelSup.jsx
│   └── NotaCard.jsx (componente reutilizable para notas)
├── pages/
│   ├── Notes.jsx          # Contenedor principal (SPA)
│   ├── ZonaTrabajo.jsx    # Lista de notas activas
│   ├── ListaCarpetas.jsx  # Placeholder para carpetas
│   ├── CrearNota.jsx      # Formulario de creación
│   ├── Premium.jsx        # Lista de planes y suscripción
│   ├── Perfil.jsx         # Edición de perfil, cambio de contraseña, eliminación de cuenta
│   └── Papelera.jsx       # Notas en papelera (restaurar / eliminar definitivamente)
├── context/
│   └── PageContext.js     # Provee la sección activa y función para cambiarla
├── utils/
│   ├── BaseURL.js         # Exporta BASE_URL (variable de entorno o fallback)
│   └── images/            # Imágenes estáticas
└── actions/
    └── FormAction.js      # Funciones para login/registro (usadas en Login)
```

### Mecanismo de navegación SPA
- `PageContext` define las secciones posibles (`ZONA_TRABAJO`, `LISTA_CARPETAS`, `CREAR_NOTA`, `PREMIUM`, `PERFIL`, `PAPELERA`) y expone `seccionActiva` y `cambiarSeccion`.
- `PanelSup` renderiza botones que al hacer clic llaman a `cambiarSeccion`.
- `Notes` envuelve la aplicación con `PageProvider` y renderiza condicionalmente (mediante `switch`) el componente de la página según `seccionActiva`.
- El `Header` es común y no se re-renderiza al cambiar de sección.

### Gestión de autenticación
- El token JWT y los datos del usuario se almacenan en `localStorage` al hacer login.
- Se incluye el token en el header `Authorization` en todas las peticiones a la API.
- Si el token expira o es inválido, los componentes manejan el error y redirigen al login.

### Estilos y colores
- Fondo: blanco (`bg-white`).
- Elementos principales: `violet-600` (botones activos, títulos, enlaces).
- Acentos: `pink-400` (en botones de acciones secundarias, como "Suscribirse").
- Estados de carga y error se muestran con componentes sencillos y notificaciones `react-hot-toast`.

---

## 5. Comunicación Frontend ↔ Backend

- **URL base**: se define en `src/utils/BaseURL.js` como `export const BASE_URL = 'http://localhost:8000/api'` (se sobrescribe en producción con variable de entorno `VITE_API_URL`).
- **Formato de datos**: JSON.
- **Manejo de errores**: se capturan excepciones en los `fetch`; se muestra un `toast.error()` con el mensaje devuelto por el backend o un mensaje genérico.
- **Actualización optimista**: Algunas operaciones (como mover a papelera o restaurar) actualizan el estado local sin esperar la confirmación del servidor, aunque se maneja el rollback en caso de error.
- **Protección de rutas**: el componente `Notes` (y todos los demás) verifican la existencia del token; si no existe, redirigen a `/login` (actualmente se usa `window.location.href`).

---

## 6. Dockerización

### Dockerfile
- Base: `php:8.2-cli-bullseye` (Debian stable) para evitar problemas de DNS.
- Instala el paquete `libpq-dev` y la extensión `pdo_pgsql`.
- Descarga Composer y ejecuta `composer install --no-dev`.
- Copia el código fuente y expone el puerto `8000`.
- Comando: `php -S 0.0.0.0:8000 -t public`.

### docker-compose.yml
- **Servicio `postgres`**:
  - Imagen: `postgres:17-alpine`
  - Variables de entorno para base de datos, usuario y contraseña.
  - Puerto expuesto `5432`.
  - Volumen persistente `postgres_data` y montaje del script `ini_db.sql` en el directorio de inicialización.
- **Servicio `php`**:
  - Construcción a partir del Dockerfile actual.
  - Puerto `8000` expuesto.
  - Volumen montado para desarrollo en caliente (`.:/var/www/html`).
  - Dependencia de `postgres`.
  - Variables de entorno para la conexión a la BD y JWT.

### Variables de entorno (`.env`)
```
DB_HOST=postgres
DB_PORT=5432
DB_NAME=notas_db
DB_USER=notas_user
DB_PASS=admin12345
JWT_SECRET=...
JWT_EXPIRES=86400
```

---

## 7. Despliegue en Render (Free Tier)

### Servicios utilizados
- **Web Service** para el backend (Docker).
- **PostgreSQL** (base de datos) o base de datos externa (Neon.tech).

### Configuración recomendada
1. Conectar repositorio de GitHub a Render.
2. Crear Web Service a partir del Dockerfile.
3. Añadir variables de entorno (igual que en `.env`, pero con los valores de Render).
4. Crear base de datos PostgreSQL (en Render o externa). Si se usa la de Render, tener en cuenta que expira a los 30 días. Se recomienda usar **Neon.tech** para persistencia gratuita.
5. Configurar health check (opcional) y timeout adecuado para la suspensión por inactividad.

### Limitaciones del free tier
- El Web Service se suspende tras 15 minutos de inactividad; la primera petición tras la pausa puede demorar hasta 30 segundos.
- La base de datos PostgreSQL gratuita en Render expira a los 30 días y tiene 1 GB de almacenamiento.
- RAM máxima: 512 MB (la aplicación consume menos de 200 MB).
- El tamaño de las imágenes Docker no está limitado, pero se recomienda mantenerlas optimizadas.

### Estrategia para la base de datos
- Usar **Neon.tech** (PostgreSQL gratuito de 0.5 GB persistente) y configurar la `DATABASE_URL` en Render.
- Alternativamente, usar el script de backup para migrar datos mensualmente si se mantiene en Render.

---

## 8. Seguridad y Buenas Prácticas

- **Contraseñas**: hasheadas con `password_hash()` (bcrypt).
- **JWT**: firmado con `HS256` y tiempo de expiración configurable.
- **PDO**: prepared statements para prevenir SQL injection.
- **CORS**: configurado en `index.php` para permitir solicitudes desde el frontend (origen específico).
- **Validación**: a nivel de servicios y controladores; no se confía en los datos del cliente.
- **Logs**: se almacenan acciones relevantes (opcional, para auditoría).
- **Eliminación de cuenta**: borrado en cascada gracias a `ON DELETE CASCADE` en la BD.
- **Variables de entorno**: no se incluyen en el repositorio; se inyectan en tiempo de ejecución.

---

## 9. Flujo de Trabajo Típico

1. **Usuario se registra** (`POST /auth/register`).
2. **Inicia sesión** (`POST /auth/login`), recibe token y datos.
3. **Accede a la zona de trabajo** (GET `/notes`), ve sus notas.
4. **Crea una nueva nota** (`POST /notes`).
5. **Edita o mueve a papelera** (PUT `/notes/{id}`).
6. **Desde la papelera**, puede restaurar o eliminar definitivamente.
7. **Puede suscribirse a un plan** (GET `/plans`, POST `/subscription/checkout` → redirige a Stripe).
8. **Gestiona su perfil** (GET/PUT `/user/profile`, PUT `/user/password`, DELETE `/user/account`).

---

## 10. Próximas Extensiones (No Implementadas)

- Soporte para categorías y etiquetas.
- Búsqueda de notas por texto completo.
- Edición de notas en tiempo real (WebSockets).
- Integración completa del webhook de Stripe para activar suscripciones automáticamente.
- Sistema de notificaciones por correo electrónico.
- Implementación de paginación en la lista de notas.

---

*Documentación generada a partir del código fuente – Versión 1.0 (Junio 2026)*