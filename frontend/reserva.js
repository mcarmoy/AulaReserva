const formulario = document.getElementById('form-reserva');
const mensaje = document.getElementById('mensaje-reserva');
const listaReservas = document.getElementById('lista-reservas');

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

async function cargarReservas() {
  try {
    const respuesta = await fetch(`${API_URL}/reservas`);
    const reservas = await respuesta.json();

    listaReservas.innerHTML = '';
    if (reservas.length === 0) {
      listaReservas.textContent = 'Todavía no hay reservas.';
      return;
    }

    reservas.forEach((reserva) => {
      const elemento = document.createElement('li');
      elemento.textContent = `${reserva.aula} · ${reserva.fecha} a las ${reserva.hora} · ${reserva.responsable} `;

      const boton = document.createElement('button');
      boton.textContent = 'Cancelar';
      boton.addEventListener('click', () => cancelarReserva(reserva.id));

      elemento.appendChild(boton);
      listaReservas.appendChild(elemento);
    });
  } catch (error) {
    listaReservas.textContent = 'No se han podido cargar las reservas.';
    console.error(error);
  }
}

async function cancelarReserva(id) {
  const respuesta = await fetch(`${API_URL}/reservas/${id}`, { method: 'DELETE' });
  const datos = await respuesta.json();
  mostrarMensaje([datos.mensaje || datos.error], respuesta.ok ? 'ok' : 'error');
  cargarReservas();
}

function mostrarMensaje(lineas, tipo) {
  mensaje.className = tipo;
  mensaje.innerHTML = '';
  const lista = document.createElement('ul');
  lineas.forEach((linea) => {
    const elemento = document.createElement('li');
    elemento.textContent = linea;
    lista.appendChild(elemento);
  });
  mensaje.appendChild(lista);
}

cargarReservas();