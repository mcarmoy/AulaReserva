# AulaReserva

AulaReserva es una aplicación web para consultar aulas y gestionar sus reservas.

## Estado actual: fase 6

- API en PHP con las aulas y las reservas guardadas en una base de datos SQLite.
- Interfaz web responsive con cabecera, contadores, tarjetas de aulas, formulario de reserva y tabla de reservas con opción de cancelarlas.
- La interfaz muestra el entorno (desarrollo o producción) a partir de un archivo de configuración `config.js`.
- Action local que valida la estructura del proyecto.
- Workflow de validación con jobs en paralelo, dependencias (`needs`) y control de concurrencia.
- Workflow de entrega que genera un paquete de la aplicación como artefacto y lo comprueba.
- Workflow que genera `config.js` con variables de GitHub Actions y prepara una entrega configurada.

## API

| Método | Ruta | Funcionalidad | Código |
|---|---|---|---|
| `GET` | `/api/health` | Comprobar que la API funciona | `200` |
| `GET` | `/api/aulas` | Obtener el listado de aulas | `200` |
| `POST` | `/api/reservas` | Crear una reserva | `201` |
| `GET` | `/api/reservas` | Consultar las reservas | `200` |
| `DELETE` | `/api/reservas/{id}` | Cancelar una reserva | `200` |
| `POST` | `/api/reservas` | Reserva duplicada | `409` |

## Estructura

```text
AulaReserva/
├── README.md
├── .gitignore
├── frontend/
│   ├── index.html
│   └── assets/
│       ├── config.js
│       ├── styles.css
│       └── app.js
├── backend/
│   ├── public/
│   │   ├── index.php
│   │   └── router.php
│   └── src/
│       └── bootstrap.php
├── database/
│   └── schema.sql
└── .github/
    ├── actions/
    │   └── validar-aulareserva/
    │       └── action.yml
    └── workflows/
        ├── validar-proyecto.yml
        ├── 05-entrega-aulareserva.yml
        └── 06-preparar-aulareserva.yml
```

## Cómo ejecutarlo en local

Requisitos: PHP con la extensión `pdo_sqlite` activada (se comprueba con `php -m`).

Desde la raíz del proyecto:

```bash
php -S localhost:8000 -t backend/public backend/public/router.php
```

Después se abre http://localhost:8000 en el navegador.

La base de datos se crea automáticamente en `data/aulareserva.sqlite` a partir de `database/schema.sql` la primera vez que se usa la API. Su ubicación se puede cambiar con la variable de entorno `DB_PATH`. La carpeta `data/` está en el `.gitignore` y no se sube al repositorio.

## Configuración

`frontend/assets/config.js` indica el nombre de la aplicación y el entorno:

```javascript
window.APP_CONFIG = { nombre: "AulaReserva", entorno: "development" };
```

En local se usan los valores de desarrollo del repositorio. En las entregas, el archivo lo genera GitHub Actions a partir de las variables `APP_NAME` y `APP_ENV`. Como el navegador descarga este archivo, solo puede contener valores públicos: nunca contraseñas, tokens ni claves.

## Integración continua

### `validar-proyecto.yml`

Se ejecuta con cada `push` a `develop` o a ramas `feature/**`, con cada Pull Request hacia `develop` y de forma manual. Tiene tres jobs:

| Job | Qué comprueba |
|---|---|
| `frontend` | Que existen `index.html` y los archivos de `assets/` (con la Action local) y la sintaxis JavaScript (`node --check`) |
| `backend` | Que existen los archivos del backend y `database/schema.sql` (con la Action local), y la sintaxis PHP (`php -l`) |
| `resultado` | Solo se ejecuta si `frontend` y `backend` terminan correctamente (`needs`) |

`frontend` y `backend` se ejecutan en paralelo, cada uno en su propio runner. Con `concurrency` y `cancel-in-progress: true`, un push nuevo cancela la ejecución anterior de la misma rama.

### `05-entrega-aulareserva.yml`

Se ejecuta de forma manual. El job `empaquetar` copia `frontend/`, `backend/` y `database/` en `dist/`, crea `version.txt` y sube `dist/` como artefacto. El job `comprobar` descarga el artefacto, sin hacer checkout, y comprueba que contiene los archivos principales.

### `06-preparar-aulareserva.yml`

Se ejecuta de forma manual. Lee las variables `APP_NAME` y `APP_ENV` (**Settings → Secrets and variables → Actions → Variables**), genera `frontend/assets/config.js` en el runner, prepara `dist/` y lo sube como artefacto `AulaReserva-<entorno>-<número de ejecución>`.

Para generar una entrega de otro entorno basta con cambiar el valor de `APP_ENV` en GitHub, sin modificar el código ni el workflow.

La entrega se puede descargar desde **Actions → ejecución → Summary → Artifacts**.