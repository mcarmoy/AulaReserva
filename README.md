# AulaReserva

AulaReserva es una aplicación web para consultar aulas y gestionar sus reservas.

## Estado actual: fase 5

- API en PHP con las aulas y las reservas guardadas en una base de datos SQLite.
- Interfaz web que muestra las aulas, permite solicitar reservas y lista las reservas guardadas con opción de cancelarlas.
- Las reservas se mantienen al recargar la página, y la API rechaza las reservas duplicadas.
- Action local que valida la estructura del proyecto.
- Workflow de validación con jobs en paralelo, dependencias (`needs`) y control de concurrencia.
- Workflow de entrega que genera un paquete de la aplicación como artefacto y lo comprueba.

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
│   ├── app.js
│   └── reserva.js
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
        └── 05-entrega-aulareserva.yml
```

## Cómo ejecutarlo en local

Requisitos: PHP con la extensión `pdo_sqlite` activada (se comprueba con `php -m`).

Desde la raíz del proyecto:

```bash
php -S localhost:8000 -t backend/public backend/public/router.php
```

Después se abre http://localhost:8000 en el navegador.

La base de datos se crea automáticamente en `data/aulareserva.sqlite` a partir de `database/schema.sql` la primera vez que se usa la API. Su ubicación se puede cambiar con la variable de entorno `DB_PATH`. La carpeta `data/` está en el `.gitignore` y no se sube al repositorio.

## Integración continua

### `validar-proyecto.yml`

Se ejecuta con cada `push` a `develop` o a ramas `feature/**`, con cada Pull Request hacia `develop` y de forma manual. Tiene tres jobs:

| Job | Qué comprueba |
|---|---|
| `frontend` | Que existen los archivos del frontend (con la Action local) y la sintaxis JavaScript (`node --check`) |
| `backend` | Que existen los archivos del backend y `database/schema.sql` (con la Action local), y la sintaxis PHP (`php -l`) |
| `resultado` | Solo se ejecuta si `frontend` y `backend` terminan correctamente (`needs`) |

`frontend` y `backend` se ejecutan en paralelo, cada uno en su propio runner. Con `concurrency` y `cancel-in-progress: true`, un push nuevo cancela la ejecución anterior de la misma rama.

### `05-entrega-aulareserva.yml`

Se ejecuta de forma manual (`workflow_dispatch`). Tiene dos jobs:

| Job | Qué hace |
|---|---|
| `empaquetar` | Copia `frontend/`, `backend/` y `database/` en `dist/`, crea `dist/version.txt` con la rama, el commit y el número de ejecución, y sube `dist/` como artefacto `AulaReserva-<número de ejecución>` |
| `comprobar` | Depende de `empaquetar`. Descarga el artefacto en `entrega/`, sin hacer checkout del repositorio, comprueba que contiene los archivos principales y muestra `version.txt` |

La entrega se puede descargar desde **Actions → ejecución → Summary → Artifacts**.