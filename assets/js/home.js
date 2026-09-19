import { SITE_MEDIA } from './media-config.js';
import { catalogItemCard, loadPublicCatalog } from './public-catalog.js?v=20260919-5';

function safeImage(img, fallback = 'img/favicon.png') {
  if (!img) return;
  img.addEventListener('error', () => {
    if (img.dataset.fallbackApplied) return;
    img.dataset.fallbackApplied = 'true';
    img.src = fallback;
  }, { once: true });
}

const hero = document.querySelector('[data-hero-image]');
if (hero) { hero.src = SITE_MEDIA.hero.src; hero.alt = SITE_MEDIA.hero.alt; safeImage(hero, 'img/fondo1.jpg'); }
const enterprise = document.querySelector('[data-enterprise-image]');
if (enterprise) { enterprise.src = SITE_MEDIA.enterprise.src; enterprise.alt = SITE_MEDIA.enterprise.alt; safeImage(enterprise, 'img/medium-shot-people-working-desk.jpg'); }
const offer = document.querySelector('[data-offer-image]');
if (offer) { offer.src = SITE_MEDIA.offerBanner.src; offer.alt = SITE_MEDIA.offerBanner.alt; safeImage(offer, 'img/fondo1.jpg'); }

const productHost = document.querySelector('[data-featured-products]');
if (productHost) {
  productHost.innerHTML = '<div class="catalog-loading-card">Cargando productos desde Beheer…</div>';
  try {
    const items = await loadPublicCatalog();
    const featured = items
      .filter(item => item.featured === true)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'es'))
      .slice(0, 4);
    productHost.innerHTML = featured.length
      ? featured.map(catalogItemCard).join('')
      : '<div class="catalog-empty-card">Todavía no hay productos destacados publicados desde Beheer.</div>';
  } catch (error) {
    console.error(error);
    productHost.innerHTML = '<div class="catalog-empty-card catalog-empty-card--error">No fue posible cargar el catálogo en este momento. No se muestran productos provisionales para evitar inconsistencias.</div>';
  }
}
