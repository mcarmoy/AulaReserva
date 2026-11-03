const API_URL = 'http://localhost:8000';

async function cargarAulas() {
  const contenedor = document.getElementById('lista-aulas');

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
    });
  } catch (error) {
    contenedor.textContent = 'No se han podido cargar las aulas. ¿Está arrancada la API?';
    console.error(error);
  }
}

cargarAulas();