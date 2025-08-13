# Busca autor

Aplicación web que permite buscar libros por autor utilizando la API pública de **Open Library**.  
El usuario ingresa un nombre de autor, la aplicación realiza una solicitud `fetch` con `async/await`, procesa la respuesta y muestra los primeros resultados con título, autor(es) y año de publicación.

---

##  Objetivos
- Practicar el consumo de una API pública con `fetch` y `async/await`.
- Mostrar resultados dinámicamente en el DOM.
- Implementar estados de carga y validaciones de entrada.
- Manejar errores de red y casos sin resultados.
- Mejorar la experiencia de usuario con estilos y diseño responsive.

---

##  Funcionalidades
- Campo de texto para buscar por **autor**.
- Botón **“Buscar libros”**.
- Tarjetas con **título, autor(es), año y portada**.
- Mensaje de **"Cargando resultados..."** mientras se espera la respuesta.
- Validación de entrada (mínimo 2 caracteres).
- Manejo de errores y mensajes amigables.
- Contador del número total de resultados encontrados.
- Nueva búsqueda sin recargar la página.

---

##  Estructura del proyecto

/ busca-autor

├─ index.html       

└─ assets/

├─ css/

│  └─ styles.css 

└─ js/

└─ app.js     

---

## Cómo usar
1. Abrir `index.html` en un navegador o usar Live Server.
2. Escribir el nombre de un autor (ej: *Isabel Allende*).
3. Presionar **Buscar libros**.
4. Ver los resultados, con título, autor(es) y año.
5. Usar filtros opcionales de año y ordenamiento.

---

## API utilizada
- **Open Library Search API**  
  Endpoint: `https://openlibrary.org/search.json`  
  Parámetros usados:
  - `author` (o `q` con búsqueda por campo)
  - `limit` para restringir resultados
  - `fields` para optimizar respuesta

---

## Lógica de la aplicación
- Evento `submit` del formulario llama a `buscarLibrosPorAutor()`.
- Validaciones previas (mínimo 2 caracteres y años válidos).
- Construcción de la URL con parámetros.
- Petición con `fetch` y `async/await`.
- Renderizado de resultados como tarjetas.
- Mostrar mensaje si no hay resultados o si hay un error.
- Contador total y loader con animación.

---

##  Manejo de errores
- Entrada inválida → alerta de advertencia.
- Sin resultados → mensaje informativo.
- Error de red o HTTP → mensaje de error y log en consola.
- Filtros de año incorrectos → aviso al usuario.

---

##  Estilos
- Uso de **Bootstrap 5** y **Google Fonts**.
- Diseño responsive para móviles, tablets y desktop.
- Tarjetas con sombras y efectos `hover`.
- Loader animado y skeletons de carga.
- Footer con enlaces a web, GitHub y LinkedIn.

---

## Autor
Desarrollado por **Magdalena Inalaf G.**
- [Sitio web](https://inalaf.ca)
- [GitHub](https://github.com/MagdaIG)
- [LinkedIn](https://www.linkedin.com/in/minalaf/)

## Licencia

Este proyecto se distribuye bajo la licencia MIT.


