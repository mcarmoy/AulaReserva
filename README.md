# AulaReserva

AulaReserva será una aplicación web para consultar aulas y gestionar sus reservas.

## Estado actual: fase 1

- API en PHP que devuelve las aulas disponibles en formato JSON.
- Interfaz web que consulta la API y muestra las aulas.
- Action local que valida la estructura mínima del proyecto.

## Estructura

```text
AulaReserva/
├── README.md
├── frontend/
│   ├── index.html
│   └── app.js
├── backend/
│   └── public/
│       └── index.php
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

El workflow `validar-proyecto.yml` usa la Action local `validar-aulareserva` para comprobar que existen los archivos principales del proyecto.