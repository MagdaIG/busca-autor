const UI = {
  form: document.getElementById('searchForm'),
  input: document.getElementById('authorInput'),
  btn: document.getElementById('searchBtn'),
  status: document.getElementById('statusArea'),
  alert: document.getElementById('alertArea'),
  totalBadge: document.getElementById('totalBadge'),
  totalCount: document.getElementById('totalCount'),
  grid: document.getElementById('resultsGrid'),
  skeletonLoader: document.getElementById('skeletonLoader'),
  yearFrom: document.getElementById('yearFrom'),
  yearTo: document.getElementById('yearTo'),
  sortBy: document.getElementById('sortBy')
};

const API_SEARCH = 'https://openlibrary.org/search.json';
const DEFAULT_LIMIT = 10;

UI.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  await buscarLibrosPorAutor();
});

document.addEventListener('DOMContentLoaded', () => {
  UI.input.focus();
});

async function buscarLibrosPorAutor() {
  limpiarUI();
  mostrarSkeletonLoading(true);

  const author = UI.input.value.trim();
  if (author.length < 2) {
    showAlert('Por favor, ingresa al menos 2 caracteres para realizar la búsqueda.', 'warning');
    UI.input.focus();
    mostrarSkeletonLoading(false);
    return;
  }

  // Validación y normalización de años
  let from = UI.yearFrom.value ? parseInt(UI.yearFrom.value, 10) : null;
  let to = UI.yearTo.value ? parseInt(UI.yearTo.value, 10) : null;
  if ((from && from < 1000) || (to && to < 1000)) {
    showAlert('El año debe ser mayor o igual a 1000.', 'warning');
    mostrarSkeletonLoading(false);
    return;
  }
  if (from && to && from > to) {
    // Intercambia si vienen invertidos
    [from, to] = [to, from];
  }

  const parts = [];
  parts.push(`author:"${author.replace(/"/g, '\\"')}"`);
  if (from && to) parts.push(`first_publish_year:[${from} TO ${to}]`);
  else if (from)  parts.push(`first_publish_year:[${from} TO 3000]`);
  else if (to)    parts.push(`first_publish_year:[1000 TO ${to}]`);

  const q = parts.join(' AND ');

  // Campos mínimos recomendados para rendimiento
  const fields = [
    'title',
    'author_name',
    'first_publish_year',
    'isbn',
    'cover_i'
  ].join(',');

  // Nota: usé limit=10 y orden por relevancia del motor;
  // el ordenamiento extra (año/título) lo hice en cliente.
  const params = new URLSearchParams({
    q,
    limit: String(DEFAULT_LIMIT),
    fields
  });

  const url = `${API_SEARCH}?${params.toString()}`;

  setLoading(true, `Buscando libros de ${author}...`);

  try {
    const response = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' }
    }, 10000);

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

    const data = await response.json();

    const total = Number(data?.numFound ?? 0);
    updateResultsCount(total);

    if (total > 0) {
      const books = processBooksData(data.docs || []);
      renderBooks(books);
      setLoading(false, `Mostrando ${Math.min(DEFAULT_LIMIT, total)} de ${total.toLocaleString('es')} resultados.`);
    } else {
      showAlert(`No se encontraron libros para "${author}". Prueba con otro nombre o revisa la ortografía.`, 'info');
      setLoading(false, '');
    }
  } catch (error) {
    console.error('Error en la búsqueda:', error);
    showAlert('Ocurrió un problema al buscar los libros. Por favor, intenta nuevamente más tarde.', 'danger');
    setLoading(false, '');
  } finally {
    mostrarSkeletonLoading(false);
    UI.btn.disabled = false;
  }
}

// Transformación de datos + ordenamiento cliente
function processBooksData(books) {
  const safe = (v, fallback = null) => (v ?? fallback);

  const mapped = books.map(book => ({
    title: safe(book.title, 'Título desconocido'),
    authors: Array.isArray(book.author_name) && book.author_name.length
      ? book.author_name.join(', ')
      : 'Autor desconocido',
    year: safe(book.first_publish_year, null),
    coverId: safe(book.cover_i, null),
    isbn: Array.isArray(book.isbn) && book.isbn.length ? book.isbn[0] : null
  }));

  const sort = UI.sortBy.value;
  if (sort === 'year_asc') {
    mapped.sort((a, b) => (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER));
  } else if (sort === 'year_desc') {
    mapped.sort((a, b) => (b.year ?? -Number.MAX_SAFE_INTEGER) - (a.year ?? -Number.MAX_SAFE_INTEGER));
  } else if (sort === 'title_asc') {
    mapped.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'title_desc') {
    mapped.sort((a, b) => b.title.localeCompare(a.title));
  }

  return mapped;
}

//Render
function renderBooks(books) {
  UI.grid.innerHTML = '';
  if (!books.length) return;

  const fragment = document.createDocumentFragment();

  books.forEach(book => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';

    const cover = book.coverId
      ? `<img src="https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg"
               alt="Portada de ${escapeHtml(book.title)}"
               class="img-thumbnail rounded"
               style="width:80px;height:120px;object-fit:cover;">`
      : `<div class="d-flex align-items-center justify-content-center bg-light rounded"
               style="width:80px;height:120px;">
             <i class="fa-solid fa-book-open text-muted fa-2x"></i>
         </div>`;

    const detailsBtn = book.isbn
      ? `<a href="https://openlibrary.org/isbn/${encodeURIComponent(book.isbn)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-sm btn-outline-primary">Detalles</a>`
      : '';

    col.innerHTML = `
      <div class="book-card">
        <div class="d-flex align-items-start gap-3 mb-3">
          ${cover}
          <div>
            <h3 class="book-title">${escapeHtml(book.title)}</h3>
            <span class="book-author"><i class="fa-solid fa-user-pen me-1"></i>${escapeHtml(book.authors)}</span>
            <div class="d-flex align-items-center gap-2 mt-2">
              <span class="book-year"><i class="fa-solid fa-calendar-days me-1"></i>${book.year ?? 'Año no disponible'}</span>
              ${detailsBtn}
            </div>
          </div>
        </div>
      </div>
    `;
    fragment.appendChild(col);
  });

  UI.grid.appendChild(fragment);
}

function limpiarUI() {
  UI.alert.innerHTML = '';
  UI.grid.innerHTML = '';
  UI.totalBadge.classList.add('d-none');
}

function setLoading(isLoading, message) {
  UI.btn.disabled = isLoading;
  UI.status.innerHTML = isLoading
    ? `<span class="loader" aria-live="polite">
         <span class="dot"></span><span class="dot"></span><span class="dot"></span>
       </span> <span class="ms-2">${escapeHtml(message)}</span>`
    : `<span class="text-muted">${escapeHtml(message)}</span>`;
}

function showAlert(message, type = 'info') {
  const icons = {
    info: 'fa-circle-info',
    warning: 'fa-triangle-exclamation',
    danger: 'fa-circle-exclamation',
    success: 'fa-circle-check'
  };

  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show d-flex align-items-center`;
  alert.role = 'alert';
  alert.innerHTML = `
    <i class="fa-solid ${icons[type]} me-2"></i>
    <div>${escapeHtml(message)}</div>
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  UI.alert.appendChild(alert);
}

function updateResultsCount(total) {
  if (total > 0) {
    UI.totalCount.textContent = total.toLocaleString('es');
    UI.totalBadge.classList.remove('d-none');
  } else {
    UI.totalBadge.classList.add('d-none');
  }
}

function mostrarSkeletonLoading(show) {
  UI.skeletonLoader.innerHTML = show
    ? Array(DEFAULT_LIMIT).fill().map(() => `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="skeleton-card"></div>
        </div>`).join('')
    : '';

  UI.skeletonLoader.classList.toggle('d-none', !show);
  UI.grid.classList.toggle('d-none', show);
}

// Fetch con timeout
async function fetchWithTimeout(resource, options = {}, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// Escape básico para evitar XSS en textos
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
