# AulaReserva

AulaReserva será una aplicación web para consultar aulas y gestionar sus reservas.

## Estado actual: fase 4

- API en PHP que devuelve las aulas disponibles en formato JSON.
- Interfaz web que consulta la API y muestra las aulas.
- Formulario de reserva (aula, fecha, hora y responsable) con validación en JavaScript.
- Envío de la reserva al backend (`reservas.php`) mediante `fetch` con método POST.
- Action local que valida la estructura mínima del proyecto.
- Workflow con jobs en paralelo, dependencias (`needs`) y control de concurrencia.

## Estructura

```text
AulaReserva/
├── README.md
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── reserva.js
├── backend/
│   └── public/
│       ├── index.php
│       └── reservas.php
└── .github/
    ├── actions/
    │   └── validar-aulareserva/
    │       └── action.yml
    └── workflows/
        └── validar-proyecto.yml
```

## Cómo ejecutarlo en local

API (backend):

```bash
php -S localhost:8000 -t backend/public
```

Interfaz (frontend), en otra terminal:

```bash
php -S localhost:5500 -t frontend
```

Después se abre http://localhost:5500 en el navegador.

## Integración continua

El workflow `validar-proyecto.yml` se ejecuta con cada `push` a `develop` o a ramas `feature/**`, con cada Pull Request hacia `develop` y de forma manual.

Está dividido en tres jobs:

| Job | Qué comprueba |
|---|---|
| `frontend` | Que existen los archivos del frontend (con la Action local) y la sintaxis JavaScript (`node --check`) |
| `backend` | Que existen los archivos del backend (con la Action local) y la sintaxis PHP (`php -l`) |
| `resultado` | Solo se ejecuta si `frontend` y `backend` terminan correctamente (`needs`) |

`frontend` y `backend` se ejecutan en paralelo, cada uno en su propio runner, por eso cada uno hace su `checkout`.

Además, el workflow usa `concurrency` con `cancel-in-progress: true`: si llegan dos ejecuciones seguidas de la misma rama, se cancela la anterior y solo se comprueba el código más reciente.