# AulaReserva

AulaReserva es una aplicación web para consultar aulas y gestionar sus reservas.

## Estado actual: fase 8

- API en PHP con las aulas y las reservas guardadas en una base de datos SQLite.
- Interfaz web responsive con cabecera, contadores, tarjetas de aulas, formulario de reserva y tabla de reservas con opción de cancelarlas.
- La interfaz muestra el entorno (desarrollo o producción) a partir de un archivo de configuración `config.js`.
- Action local que valida la estructura del proyecto.
- Workflow de validación con jobs en paralelo, dependencias (`needs`) y control de concurrencia.
- Workflows de entrega que generan paquetes de la aplicación como artefactos.
- Pruebas automáticas que arrancan la aplicación en GitHub Actions y comprueban su funcionamiento.
- Imagen Docker con PHP 8.3, Apache y SQLite.
- Despliegue automático en AWS EC2 con GitHub Actions y Docker, con las reservas guardadas en un volumen persistente.

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
├── .gitattributes
├── .dockerignore
├── Dockerfile
├── docker-start.sh
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
├── tests/
│   └── smoke.sh
└── .github/
    ├── actions/
    │   └── validar-aulareserva/
    │       └── action.yml
    └── workflows/
        ├── validar-proyecto.yml
        ├── 05-entrega-aulareserva.yml
        ├── 06-preparar-aulareserva.yml
        ├── 07-comprobar-aulareserva.yml
        └── 08-desplegar-ec2.yml
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

En local se usan los valores de desarrollo del repositorio. En las entregas y en el despliegue, GitHub Actions genera o modifica este archivo a partir de la variable `APP_ENV`. Como el navegador descarga este archivo, solo puede contener valores públicos: nunca contraseñas, tokens ni claves.

## Docker

| Archivo | Función |
|---|---|
| `Dockerfile` | Construye la imagen: parte de `php:8.3-apache`, instala SQLite, copia `backend/`, `frontend/` y `database/` y configura Apache para usar `router.php` como punto de entrada |
| `docker-start.sh` | Se ejecuta al arrancar el contenedor: crea las tablas de SQLite si no existen, da permisos a Apache sobre `/var/www/data` y arranca Apache |
| `.dockerignore` | Excluye de la imagen el historial de Git, los workflows, claves, archivos `.env`, bases de datos y pruebas |

Para construir y ejecutar la imagen a mano:

```bash
sudo docker build -t aulareserva:1.0 .
sudo docker volume create aulareserva_datos
sudo docker run -d \
  --name aulareserva \
  -p 8080:80 \
  -v aulareserva_datos:/var/www/data \
  --restart unless-stopped \
  aulareserva:1.0
```

La aplicación queda disponible en el puerto `8080`. La base de datos se guarda en el volumen `aulareserva_datos`, montado en `/var/www/data`, así que las reservas se conservan aunque se elimine y se vuelva a crear el contenedor.

No se debe ejecutar `docker volume rm aulareserva_datos` ni `docker system prune --volumes`, porque borrarían las reservas.

## Flujo de ramas (GitFlow)

| Rama | Uso |
|---|---|
| `feature/*` | Desarrollo de nuevas funcionalidades |
| `develop` | Integración del trabajo, mediante Pull Requests |
| `release/*` | Versión candidata a publicarse, sobre la que se ejecutan las pruebas automáticas |
| `main` | Versión publicada, desde la que se despliega en AWS EC2 |

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

Se ejecuta de forma manual. Lee las variables `APP_NAME` y `APP_ENV`, genera `frontend/assets/config.js` en el runner, prepara `dist/` y lo sube como artefacto `AulaReserva-<entorno>-<número de ejecución>`.

### `07-comprobar-aulareserva.yml`

Se ejecuta de forma manual, normalmente sobre la rama `release/*` antes de desplegar. Arranca AulaReserva en el runner con una base de datos de pruebas nueva y ejecuta `tests/smoke.sh`, que prueba la API: listado de aulas, creación de una reserva (`201`), rechazo de una reserva duplicada (`409`), consulta y cancelación.

### `08-desplegar-ec2.yml`

Despliega AulaReserva en una instancia AWS EC2. Se ejecuta de forma manual y solo desde la rama `main` (`if: github.ref == 'refs/heads/main'`). Usa el entorno `Produccion` de GitHub.

| Paso | Operación | Dónde |
|---|---|---|
| 1 | Descargar el repositorio | Runner |
| 2 | Comprobar que `APP_ENV` es `production` y ponerlo en `config.js` | Runner |
| 3 | Construir la imagen (`docker build`) y guardarla en un archivo (`docker save`) | Runner |
| 4 | Preparar la clave privada y las claves del servidor para SSH | Runner |
| 5 | Enviar la imagen por `scp` | Runner → EC2 |
| 6 | Cargar la imagen (`docker load`), sustituir el contenedor y arrancarlo con el volumen | EC2 |

La imagen se construye en el runner y EC2 solo la recibe y la ejecuta. En cada despliegue se elimina el contenedor anterior y se crea uno nuevo, pero las reservas se conservan porque están en el volumen.

#### Configuración necesaria

En **Settings → Secrets and variables → Actions**:

| Tipo | Nombre | Significado |
|---|---|---|
| Secret | `EC2_HOST` | IP o DNS público de EC2 |
| Secret | `EC2_USER` | Usuario SSH (`ubuntu`) |
| Secret | `EC2_SSH_PRIVATE_KEY` | Clave privada SSH autorizada en EC2 |
| Secret | `EC2_KNOWN_HOSTS` | Claves públicas del servidor, verificadas comparando sus huellas digitales |
| Variable | `EC2_PORT` | `8080` |

En **Settings → Environments → Produccion**:

| Tipo | Nombre | Valor |
|---|---|---|
| Variable | `APP_ENV` | `production` |

- `EC2_SSH_PRIVATE_KEY` permite a GitHub Actions autenticarse en EC2.
- `EC2_KNOWN_HOSTS` permite comprobar la identidad del servidor. Con `StrictHostKeyChecking=yes`, GitHub Actions no se conecta a un servidor cuyas claves no estén en esa lista.
- La clave privada nunca se guarda en el repositorio, solo en GitHub Secrets.
- Si la IP pública de EC2 cambia al reiniciar la instancia, hay que actualizar `EC2_HOST` y `EC2_KNOWN_HOSTS`.

#### Requisitos de la instancia EC2

- Ubuntu con Docker, Git y `curl` instalados, y Docker en funcionamiento.
- El usuario SSH puede ejecutar `sudo docker` sin contraseña.
- Grupo de seguridad con el puerto `22` (SSH) y el puerto `8080` (aplicación) abiertos.

La aplicación desplegada se abre en `http://IP_PUBLICA_EC2:8080` y muestra el entorno de producción.

La entrega de los artefactos se puede descargar desde **Actions → ejecución → Summary → Artifacts**.