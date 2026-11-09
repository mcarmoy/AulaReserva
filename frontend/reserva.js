const formulario = document.getElementById('form-reserva');
const mensaje = document.getElementById('mensaje-reserva');

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const campos = formulario.elements;
  const reserva = {
    aula: campos.aula.value,
    fecha: campos.fecha.value,
    hora: campos.hora.value,
    responsable: campos.responsable.value.trim(),
  };

  const errores = [];
  if (reserva.aula === '') errores.push('Selecciona un aula.');
  if (reserva.fecha === '') errores.push('La fecha no puede estar vacía.');
  if (reserva.hora === '') errores.push('Indica la hora de la reserva.');
  if (reserva.responsable === '') errores.push('Indica el responsable de la reserva.');

  if (errores.length > 0) {
    mostrarMensaje(errores, 'error');
    return;
  }

  try {
    const respuesta = await fetch(`${API_URL}/reservas.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reserva),
    });
    const datos = await respuesta.json();

    if (respuesta.ok) {
      mostrarMensaje([datos.mensaje], 'ok');
      formulario.reset();
    } else {
      mostrarMensaje([datos.error], 'error');
    }
  } catch (error) {
    mostrarMensaje(['No se ha podido enviar la reserva. ¿Está arrancada la API?'], 'error');
    console.error(error);
  }
});

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