import { SITE_CONFIG } from './config.js';
import { apiRequest } from './api.js';

const CACHE_KEY = 'sublimagic-public-catalog:v1';
const CACHE_TTL = 60_000;
let inFlight = null;

export const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export const escapeAttr = escapeHtml;

function normalizeItem(item) {
  const capture = item?.captura || {};
  const configuration = item?.configuracion || {};
  const variants = Array.isArray(configuration.variantes) ? configuration.variantes : [];
  return {
    id: String(item?.id || ''),
    tipo: String(item?.tipo || 'PRODUCTO').toUpperCase(),
    name: String(item?.nombre || 'Producto'),
    category: String(item?.categoria || 'Otros'),
    description: String(item?.descripcion || ''),
    image: String(item?.imagen || ''),
    featured: Boolean(item?.destacado),
    order: Number(item?.orden || 0),
    priceLabel: String(item?.precioLabel || 'Cotizar'),
    priceType: String(item?.tipoPrecio || 'NORMAL').toUpperCase(),
    saleUnit: String(item?.unidadVenta || ''),
    pricingRule: item?.reglaPrecio && typeof item.reglaPrecio === 'object' ? item.reglaPrecio : {},
    capture: {
      type: String(capture.tipo || 'CANTIDAD').toUpperCase(),
      label: String(capture.etiqueta || 'Cantidad'),
      unit: String(capture.unidad || 'pieza'),
      min: Number(capture.min ?? 1),
      step: Number(capture.step ?? 1)
    },
    configuration: {
      requiresVariant: Boolean(configuration.requiereVariante),
      fields: configuration.campos && typeof configuration.campos === 'object' ? configuration.campos : {},
      variants: variants.map(variant => ({
        id: String(variant?.id || ''),
        sku: String(variant?.sku || ''),
        sizeGroup: String(variant?.grupoTallaNombre || ''),
        size: String(variant?.tallaNombre || ''),
        color: String(variant?.colorNombre || ''),
        colorHex: String(variant?.colorHex || ''),
        variantName: String(variant?.nombreVariante || '')
      })).filter(variant => variant.id)
    }
  };
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() - parsed.savedAt > CACHE_TTL || !Array.isArray(parsed.items)) return null;
    return parsed.items.map(normalizeItem);
  } catch {
    return null;
  }
}

function writeCache(items) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), items }));
  } catch {}
}

export async function loadPublicCatalog({ force = false } = {}) {
  if (!SITE_CONFIG.livePublicApi) throw new Error('PUBLIC_API_DISABLED');
  if (!force) {
    const cached = readCache();
    if (cached) return cached;
  }
  if (inFlight && !force) return inFlight;

  inFlight = apiRequest(SITE_CONFIG.endpoints.catalog, { cache: 'no-store' })
    .then(payload => {
      const raw = Array.isArray(payload?.items) ? payload.items : [];
      const items = raw.map(normalizeItem).filter(item => item.id);
      writeCache(items);
      return items;
    })
    .finally(() => { inFlight = null; });

  return inFlight;
}

export function catalogItemCard(item) {
  const media = item.image
    ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.name)}" loading="lazy" data-catalog-image>`
    : `<div class="product-media-placeholder" aria-label="Imagen pendiente"><span>Imagen pendiente</span></div>`;
  const badge = item.capture.type === 'METRAJE' ? '<span class="product-unit-badge">Por metraje</span>' : '';
  return `<article class="product-card product-card--premium">
    <div class="product-media product-media--standard">${media}${badge}</div>
    <div class="product-body">
      <div class="meta">${escapeHtml(item.category)}</div>
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <div class="product-price"><strong>${escapeHtml(item.priceLabel)}</strong><a class="btn btn-outline" href="pedido.html?producto=${encodeURIComponent(item.id)}">Personalizar</a></div>
    </div>
  </article>`;
}

export function findCatalogItem(items, id) {
  return items.find(item => item.id === id) || null;
}
