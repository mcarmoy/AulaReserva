const API_URL = '/api';

const config = window.APP_CONFIG || { nombre: 'AulaReserva', entorno: 'development' };

const selectAula = document.getElementById('aula');
const formulario = document.getElementById('form-reserva');
const mensaje = document.getElementById('mensaje');
const tablaReservas = document.getElementById('tabla-reservas');
const sinReservas = document.getElementById('sin-reservas');

// Muestra el nombre y el entorno que vienen de config.js
function mostrarConfiguracion() {
  const entornos = {
    development: '🟡 DESARROLLO',
    production: '🟢 PRODUCCIÓN',
  };
  document.getElementById('nombre-app').textContent = config.nombre;
  document.getElementById('entorno-app').textContent = entornos[config.entorno] || config.entorno;
  document.title = config.nombre;
}

async function cargarAulas() {
  const contenedor = document.getElementById('lista-aulas');
  try {
    const respuesta = await fetch(`${API_URL}/aulas`);
    const aulas = await respuesta.json();

    contenedor.innerHTML = '';
    aulas.forEach((aula) => {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta';

      const nombre = document.createElement('h3');
      nombre.textContent = aula.nombre;

      const capacidad = document.createElement('p');
      capacidad.textContent = `Capacidad: ${aula.capacidad} personas`;

      const ubicacion = document.createElement('p');
      ubicacion.textContent = aula.ubicacion;

      tarjeta.append(nombre, capacidad, ubicacion);
      contenedor.appendChild(tarjeta);

      const opcion = document.createElement('option');
      opcion.value = aula.id;
      opcion.textContent = `${aula.nombre} (${aula.capacidad} plazas)`;
      selectAula.appendChild(opcion);
    });

    document.getElementById('total-aulas').textContent = aulas.length;
  } catch (error) {
    contenedor.textContent = 'No se han podido cargar las aulas. ¿Está arrancada la API?';
    console.error(error);
  }
}

async function cargarReservas() {
  try {
    const respuesta = await fetch(`${API_URL}/reservas`);
    const reservas = await respuesta.json();

    tablaReservas.innerHTML = '';
    reservas.forEach((reserva) => {
      const fila = document.createElement('tr');
      [reserva.aula, reserva.fecha, reserva.hora, reserva.responsable].forEach((valor) => {
        const celda = document.createElement('td');
        celda.textContent = valor;
        fila.appendChild(celda);
      });

      const celdaBoton = document.createElement('td');
      const boton = document.createElement('button');
      boton.textContent = 'Cancelar';
      boton.addEventListener('click', () => cancelarReserva(reserva.id));
      celdaBoton.appendChild(boton);
      fila.appendChild(celdaBoton);

      tablaReservas.appendChild(fila);
    });

    document.getElementById('total-reservas').textContent = reservas.length;
    sinReservas.hidden = reservas.length > 0;
  } catch (error) {
    mostrarMensaje(['No se han podido cargar las reservas.'], 'error');
    console.error(error);
  }
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const campos = formulario.elements;
  const reserva = {
    aula_id: campos.aula.value,
    fecha: campos.fecha.value,
    hora: campos.hora.value,
    responsable: campos.responsable.value.trim(),
  };

  const errores = [];
  if (reserva.aula_id === '') errores.push('Selecciona un aula.');
  if (reserva.fecha === '') errores.push('La fecha no puede estar vacía.');
  if (reserva.hora === '') errores.push('Indica la hora de la reserva.');
  if (reserva.responsable === '') errores.push('Indica el responsable de la reserva.');

  if (errores.length > 0) {
    mostrarMensaje(errores, 'error');
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/reservas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reserva),
    });
    const datos = await respuesta.json();

    if (respuesta.ok) {
      mostrarMensaje([datos.mensaje], 'ok');
      formulario.reset();
      cargarReservas();
    } else {
      mostrarMensaje([datos.error], 'error');
    }
  } catch (error) {
    mostrarMensaje(['No se ha podido enviar la reserva. ¿Está arrancada la API?'], 'error');
    console.error(error);
  }
});

async function cancelarReserva(id) {
  const respuesta = await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
  const datos = await respuesta.json();
  mostrarMensaje([datos.mensaje || datos.error], respuesta.ok ? 'ok' : 'error');
  cargarReservas();
}

function mostrarMensaje(lineas, tipo) {
  mensaje.className = `mensaje ${tipo}`;
  mensaje.innerHTML = '';
  const lista = document.createElement('ul');
  lineas.forEach((linea) => {
    const elemento = document.createElement('li');
    elemento.textContent = linea;
    lista.appendChild(elemento);
  });
  mensaje.appendChild(lista);
}

mostrarConfiguracion();
cargarAulas();
cargarReservas();