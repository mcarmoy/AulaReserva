const formulario = document.getElementById('form-reserva');
const mensaje = document.getElementById('mensaje-reserva');

formulario.addEventListener('submit', (evento) => {
  evento.preventDefault();

  const campos = formulario.elements;
  const aula = campos.aula.value;
  const fecha = campos.fecha.value;
  const hora = campos.hora.value;
  const responsable = campos.responsable.value.trim();

  const errores = [];
  if (aula === '') errores.push('Selecciona un aula.');
  if (fecha === '') errores.push('La fecha no puede estar vacía.');
  if (hora === '') errores.push('Indica la hora de la reserva.');
  if (responsable === '') errores.push('Indica el responsable de la reserva.');

  if (errores.length > 0) {
    mostrarMensaje(errores, 'error');
    return;
  }

  const nombreAula = campos.aula.options[campos.aula.selectedIndex].textContent;
  mostrarMensaje([`Reserva solicitada: ${nombreAula}, el ${fecha} a las ${hora}, a nombre de ${responsable}.`], 'ok');
  formulario.reset();
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