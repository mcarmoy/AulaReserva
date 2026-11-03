const API_URL = 'http://localhost:8000';

async function cargarAulas() {
  const contenedor = document.getElementById('lista-aulas');
  const selectAula = document.getElementById('aula');

  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      throw new Error(`Error HTTP ${respuesta.status}`);
    }
    const aulas = await respuesta.json();

    contenedor.innerHTML = '';
    aulas.forEach((aula) => {
      const tarjeta = document.createElement('article');
      tarjeta.className = 'tarjeta';

      const nombre = document.createElement('h3');
      nombre.textContent = aula.nombre;

      const capacidad = document.createElement('p');
      capacidad.textContent = `Capacidad: ${aula.capacidad} personas`;

      tarjeta.append(nombre, capacidad);
      contenedor.appendChild(tarjeta);
      const opcion = document.createElement('option');
      opcion.value = aula.id;
      opcion.textContent = `${aula.nombre} (${aula.capacidad} plazas)`;
      selectAula.appendChild(opcion);
    });
  } catch (error) {
    contenedor.textContent = 'No se han podido cargar las aulas. ¿Está arrancada la API?';
    console.error(error);
  }
}

cargarAulas();