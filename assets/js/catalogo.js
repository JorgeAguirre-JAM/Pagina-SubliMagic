import { catalogItemCard, loadPublicCatalog } from './public-catalog.js';

const grid = document.querySelector('[data-catalog-grid]');
const search = document.querySelector('[data-catalog-search]');
const category = document.querySelector('[data-catalog-category]');
const count = document.querySelector('[data-catalog-count]');
const sort = document.querySelector('[data-catalog-sort]');
const state = { items: [], query: '', category: 'Todos', sort: 'recommended' };

function bindImageFallbacks() {
  grid?.querySelectorAll('[data-catalog-image]').forEach(img => {
    img.addEventListener('error', () => {
      const host = img.closest('.product-media');
      if (!host) return;
      img.remove();
      if (!host.querySelector('.product-media-placeholder')) {
        host.insertAdjacentHTML('afterbegin', '<div class="product-media-placeholder"><span>Imagen pendiente</span></div>');
      }
    }, { once: true });
  });
}

function render() {
  if (!grid) return;
  const q = state.query.trim().toLowerCase();
  const items = state.items.filter(item => {
    const matchCategory = state.category === 'Todos' || item.category === state.category;
    const matchQuery = !q || `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(q);
    return matchCategory && matchQuery;
  }).sort((a, b) => {
    if (state.sort === 'name-asc') return a.name.localeCompare(b.name, 'es');
    if (state.sort === 'name-desc') return b.name.localeCompare(a.name, 'es');
    if (state.sort === 'category') return a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es');
    return Number(b.featured) - Number(a.featured) || a.order - b.order || a.name.localeCompare(b.name, 'es');
  });
  if (count) count.textContent = `${items.length} ${items.length === 1 ? 'resultado' : 'resultados'}`;
  grid.innerHTML = items.length
    ? items.map(catalogItemCard).join('')
    : '<div class="catalog-empty-card">No encontramos productos con esos filtros.</div>';
  bindImageFallbacks();
}

async function loadCatalog() {
  if (!grid) return;
  grid.innerHTML = '<div class="catalog-loading-card">Cargando catálogo desde Beheer…</div>';
  try {
    state.items = await loadPublicCatalog();
    const categories = ['Todos', ...new Set(state.items.map(item => item.category).filter(Boolean))];
    if (category) category.innerHTML = categories.map(item => `<option value="${item}">${item}</option>`).join('');
    const requested = new URLSearchParams(location.search).get('categoria');
    if (requested && categories.includes(requested) && category) { category.value = requested; state.category = requested; }
    render();
  } catch (error) {
    console.error(error);
    grid.innerHTML = '<div class="catalog-empty-card catalog-empty-card--error">No se pudo consultar el catálogo de Beheer. Para mantener congruencia, Subli-Magic no muestra productos locales de respaldo.</div>';
    if (count) count.textContent = 'Catálogo no disponible';
  }
}

search?.addEventListener('input', () => { state.query = search.value; render(); });
category?.addEventListener('change', () => { state.category = category.value; render(); });
sort?.addEventListener('change', () => { state.sort = sort.value; render(); });
loadCatalog();
