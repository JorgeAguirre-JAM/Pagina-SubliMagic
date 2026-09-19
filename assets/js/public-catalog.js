import { SITE_CONFIG } from './config.js';
import { apiRequest } from './api.js';

const CACHE_KEY = 'sublimagic-public-catalog:v2';
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
  const capture = item?.captura || item?.capture || {};
  const configuration = item?.configuracion || item?.configuration || {};
  const variants = Array.isArray(configuration.variantes)
    ? configuration.variantes
    : (Array.isArray(configuration.variants) ? configuration.variants : []);

  return {
    id: String(item?.id || ''),
    tipo: String(item?.tipo || 'PRODUCTO').toUpperCase(),
    name: String(item?.nombre ?? item?.name ?? 'Producto'),
    category: String(item?.categoria ?? item?.category ?? 'Otros'),
    description: String(item?.descripcion ?? item?.description ?? ''),
    image: String(item?.imagen ?? item?.image ?? ''),
    featured: Boolean(item?.destacado ?? item?.featured),
    order: Number(item?.orden ?? item?.order ?? 0),
    priceLabel: String(item?.precioLabel ?? item?.priceLabel ?? 'Cotizar'),
    priceType: String(item?.tipoPrecio ?? item?.priceType ?? 'NORMAL').toUpperCase(),
    saleUnit: String(item?.unidadVenta ?? item?.saleUnit ?? ''),
    pricingRule: (item?.reglaPrecio && typeof item.reglaPrecio === 'object')
      ? item.reglaPrecio
      : ((item?.pricingRule && typeof item.pricingRule === 'object') ? item.pricingRule : {}),
    capture: {
      type: String(capture.tipo ?? capture.type ?? 'CANTIDAD').toUpperCase(),
      label: String(capture.etiqueta ?? capture.label ?? 'Cantidad'),
      unit: String(capture.unidad ?? capture.unit ?? 'pieza'),
      min: Number(capture.min ?? 1),
      step: Number(capture.step ?? 1)
    },
    configuration: {
      requiresVariant: Boolean(configuration.requiereVariante ?? configuration.requiresVariant),
      fields: (configuration.campos && typeof configuration.campos === 'object')
        ? configuration.campos
        : ((configuration.fields && typeof configuration.fields === 'object') ? configuration.fields : {}),
      variants: variants.map(variant => ({
        id: String(variant?.id || ''),
        sku: String(variant?.sku || ''),
        sizeGroup: String(variant?.grupoTallaNombre ?? variant?.sizeGroup ?? ''),
        size: String(variant?.tallaNombre ?? variant?.size ?? ''),
        color: String(variant?.colorNombre ?? variant?.color ?? ''),
        colorHex: String(variant?.colorHex ?? ''),
        variantName: String(variant?.nombreVariante ?? variant?.variantName ?? '')
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
    return parsed.items.map(normalizeItem).filter(item => item.id);
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
