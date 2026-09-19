import { SITE_CONFIG } from './config.js';
import { apiRequest, createIdempotencyKey } from './api.js';
import { escapeAttr, escapeHtml, findCatalogItem, loadPublicCatalog } from './public-catalog.js';
import {
  customerAuth,
  getCustomerIdToken,
  observeCustomer,
  signInCustomerWithGoogle,
  signOutCustomer
} from './customer-auth.js';

const form = document.querySelector('#web-order-form');
const message = document.querySelector('[data-form-message]');
const productSelect = document.querySelector('#producto');
const measureInput = document.querySelector('#medida');
const measureLabel = document.querySelector('[data-measure-label]');
const measureHelp = document.querySelector('[data-measure-help]');
const summaryProduct = document.querySelector('[data-summary-product]');
const summaryQty = document.querySelector('[data-summary-qty]');
const summaryMeasureLabel = document.querySelector('[data-summary-measure-label]');
const summaryContact = document.querySelector('[data-summary-contact]');
const summaryAccount = document.querySelector('[data-summary-account]');
const submit = document.querySelector('[data-submit-order]');
const fields = document.querySelector('[data-order-fields]');
const signInButton = document.querySelector('[data-google-signin]');
const signOutButton = document.querySelector('[data-google-signout]');
const sessionBox = document.querySelector('[data-customer-session]');
const authHint = document.querySelector('[data-auth-hint]');
const customerName = document.querySelector('[data-customer-name]');
const customerEmail = document.querySelector('[data-customer-email]');
const customerAvatar = document.querySelector('[data-customer-avatar]');
const designInput = document.querySelector('#diseno');
const designPreview = document.querySelector('[data-design-preview]');
const securityStatus = document.querySelector('[data-security-status]');
const productConfig = document.querySelector('[data-product-config]');
const summaryVariantRow = document.querySelector('[data-summary-variant-row]');
const summaryVariant = document.querySelector('[data-summary-variant]');

const state = {
  catalog: [],
  user: null,
  selected: null,
  variantUnavailable: false
};

function setMessage(text, type = 'info') {
  if (!message) return;
  message.className = `alert alert--${type}`;
  message.textContent = text;
  message.hidden = false;
}

function clearMessage() {
  if (!message) return;
  message.hidden = true;
  message.textContent = '';
}

function currentItem() {
  return findCatalogItem(state.catalog, productSelect?.value || '');
}

function variantLabel(variant) {
  return [variant.sizeGroup, variant.size, variant.color, variant.variantName]
    .map(value => String(value || '').trim())
    .filter(Boolean)
    .join(' · ') || 'Variante';
}

function selectedVariant() {
  const input = productConfig?.querySelector('[name="varianteProductoId"]');
  const item = currentItem();
  if (!input || !item) return null;
  return item.configuration.variants.find(variant => variant.id === input.value) || null;
}

function variantValue(variant, axis) {
  return String(variant?.[axis] || '').trim();
}

function uniqueVariantValues(variants, axis) {
  return [...new Set(variants.map(variant => variantValue(variant, axis)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true, sensitivity: 'base' }));
}

function filterVariants(variants, selections) {
  return variants.filter(variant => Object.entries(selections).every(([axis, value]) => {
    if (!value) return true;
    return variantValue(variant, axis) === value;
  }));
}

function currentVariantSelectionState() {
  const axes = {};
  productConfig?.querySelectorAll('[data-variant-axis]').forEach(select => {
    axes[select.dataset.variantAxis] = select.value || '';
  });
  return {
    axes,
    finalId: productConfig?.querySelector('[data-variant-final]')?.value
      || productConfig?.querySelector('[name="varianteProductoId"]')?.value
      || ''
  };
}

function variantFieldClass(count) {
  if (count <= 1) return 'field';
  if (count === 2) return 'field field--6';
  return 'field field--4';
}

function renderVariantSelect({ axis, label, options, value, disabled = false, help = '' }, fieldClass) {
  const placeholder = disabled ? 'Selecciona primero la opción anterior' : `Selecciona ${label.toLowerCase()}`;
  const optionHtml = options
    .map(option => `<option value="${escapeAttr(option)}"${option === value ? ' selected' : ''}>${escapeHtml(option)}</option>`)
    .join('');
  return `<div class="${fieldClass}">
    <label for="variante-${escapeAttr(axis)}">${escapeHtml(label)} *</label>
    <select id="variante-${escapeAttr(axis)}" data-variant-axis="${escapeAttr(axis)}"${disabled ? ' disabled' : ''} required>
      <option value="">${escapeHtml(placeholder)}</option>${optionHtml}
    </select>
    ${help ? `<span class="form-help">${escapeHtml(help)}</span>` : ''}
  </div>`;
}

function applyProductConfiguration(item, preferred = null) {
  state.variantUnavailable = false;
  if (!productConfig) return;

  const configuration = item?.configuration || { requiresVariant: false, variants: [] };
  if (!configuration.requiresVariant) {
    productConfig.hidden = true;
    productConfig.innerHTML = '';
    return;
  }

  productConfig.hidden = false;
  if (!configuration.variants.length) {
    state.variantUnavailable = true;
    productConfig.innerHTML = '<div class="alert alert--error">Este producto requiere talla, color o variante, pero Beheer no tiene variantes activas publicables. La solicitud queda bloqueada hasta corregirlo en Beheer.</div>';
    return;
  }

  const variants = configuration.variants;
  const remembered = preferred || currentVariantSelectionState();
  const selections = { ...(remembered?.axes || {}) };

  const groupValues = uniqueVariantValues(variants, 'sizeGroup');
  if (groupValues.length === 1) selections.sizeGroup = groupValues[0];

  const axes = [];
  if (groupValues.length > 1) {
    axes.push({ axis: 'sizeGroup', label: 'Tipo / línea', help: 'Ej. Hombre, Mujer, Niño, Unisex.' });
  }
  if (uniqueVariantValues(variants, 'size').length) axes.push({ axis: 'size', label: 'Talla' });
  if (uniqueVariantValues(variants, 'color').length) axes.push({ axis: 'color', label: 'Color' });
  if (uniqueVariantValues(variants, 'variantName').length) axes.push({ axis: 'variantName', label: 'Variante' });

  const controls = [];
  let previousBlocked = false;
  for (const definition of axes) {
    const previousSelections = {};
    for (const previous of axes) {
      if (previous.axis === definition.axis) break;
      if (selections[previous.axis]) previousSelections[previous.axis] = selections[previous.axis];
    }
    if (selections.sizeGroup && !previousSelections.sizeGroup && definition.axis !== 'sizeGroup') {
      previousSelections.sizeGroup = selections.sizeGroup;
    }

    const options = previousBlocked
      ? []
      : uniqueVariantValues(filterVariants(variants, previousSelections), definition.axis);

    let value = selections[definition.axis] || '';
    if (!options.includes(value)) value = '';
    if (options.length === 1) value = options[0];
    selections[definition.axis] = value;

    const disabled = previousBlocked || options.length === 0;
    controls.push({ ...definition, options, value, disabled });
    if (!disabled && options.length > 1 && !value) previousBlocked = true;
  }

  const renderedCount = Math.max(1, Math.min(3, controls.length));
  const fieldClass = variantFieldClass(renderedCount);
  const controlsHtml = controls.map(control => renderVariantSelect(control, fieldClass)).join('');

  const activeSelections = {};
  if (selections.sizeGroup) activeSelections.sizeGroup = selections.sizeGroup;
  for (const definition of axes) {
    if (selections[definition.axis]) activeSelections[definition.axis] = selections[definition.axis];
  }

  const requiredAxesComplete = controls.every(control => control.disabled || Boolean(selections[control.axis]));
  const matches = requiredAxesComplete ? filterVariants(variants, activeSelections) : [];
  let selectedId = '';
  let finalSelectHtml = '';

  if (matches.length === 1) {
    selectedId = matches[0].id;
  } else if (matches.length > 1) {
    const rememberedFinal = matches.some(variant => variant.id === remembered?.finalId) ? remembered.finalId : '';
    selectedId = rememberedFinal || '';
    const options = matches.map(variant => {
      const suffix = variant.sku ? ` · ${variant.sku}` : '';
      return `<option value="${escapeAttr(variant.id)}"${variant.id === selectedId ? ' selected' : ''}>${escapeHtml(variantLabel(variant) + suffix)}</option>`;
    }).join('');
    finalSelectHtml = `<div class="field">
      <label for="variante-final">Opción específica *</label>
      <select id="variante-final" data-variant-final required>
        <option value="">Selecciona una opción</option>${options}
      </select>
      <span class="form-help">Beheer tiene más de una variante con la misma combinación; selecciona la opción exacta.</span>
    </div>`;
  }

  productConfig.innerHTML = `<div class="form-grid">
    ${controlsHtml}
    ${finalSelectHtml}
  </div>
  <input type="hidden" id="varianteProductoId" name="varianteProductoId" value="${escapeAttr(selectedId)}">
  <span class="form-help">Las opciones se filtran por tipo, talla y color usando exclusivamente las variantes activas registradas en Beheer.</span>`;

  productConfig.querySelectorAll('[data-variant-axis]').forEach(select => {
    select.addEventListener('change', () => {
      const next = currentVariantSelectionState();
      next.axes[select.dataset.variantAxis] = select.value || '';

      const changedIndex = axes.findIndex(definition => definition.axis === select.dataset.variantAxis);
      axes.slice(changedIndex + 1).forEach(definition => { next.axes[definition.axis] = ''; });
      next.finalId = '';

      applyProductConfiguration(item, next);
      updateSummary();
    });
  });

  productConfig.querySelector('[data-variant-final]')?.addEventListener('change', event => {
    const hidden = productConfig.querySelector('[name="varianteProductoId"]');
    if (hidden) hidden.value = event.target.value || '';
    updateSummary();
  });
}

function applyCaptureRules(item) {
  state.selected = item;
  const capture = item?.capture || { type: 'CANTIDAD', label: 'Cantidad', unit: 'pieza', min: 1, step: 1 };
  const label = `${capture.label || 'Cantidad'} *`;
  if (measureLabel) measureLabel.textContent = label;
  if (summaryMeasureLabel) summaryMeasureLabel.textContent = capture.label || 'Cantidad';
  if (measureInput) {
    measureInput.min = String(capture.min ?? 1);
    measureInput.step = String(capture.step ?? 1);
    const current = Number(measureInput.value || 0);
    if (!Number.isFinite(current) || current < Number(measureInput.min)) {
      measureInput.value = String(capture.min ?? 1);
    }
  }
  if (measureHelp) {
    if (!item) measureHelp.textContent = 'Selecciona primero un producto.';
    else if (capture.type === 'METRAJE') measureHelp.textContent = `Captura el metraje en ${capture.unit || 'metros'}.`;
    else measureHelp.textContent = `Captura ${capture.label.toLowerCase()} en ${capture.unit || 'unidades'}.`;
  }
  applyProductConfiguration(item);
  updateSummary();
}

function updateSummary() {
  const item = currentItem();
  if (summaryProduct) summaryProduct.textContent = item?.name || 'Sin seleccionar';
  if (summaryQty) summaryQty.textContent = measureInput?.value || '—';
  if (summaryContact) summaryContact.textContent = document.querySelector('#nombre')?.value || '—';
  if (summaryAccount) summaryAccount.textContent = state.user?.email || 'No autenticada';
  const variant = selectedVariant();
  const showVariant = Boolean(item?.configuration?.requiresVariant);
  if (summaryVariantRow) summaryVariantRow.hidden = !showVariant;
  if (summaryVariant) summaryVariant.textContent = variant ? variantLabel(variant) : (showVariant ? 'Sin seleccionar' : '—');
}

async function loadCatalog() {
  if (!productSelect) return;
  productSelect.disabled = true;
  productSelect.innerHTML = '<option value="">Cargando catálogo desde Beheer…</option>';
  try {
    state.catalog = await loadPublicCatalog({ force: true });
    productSelect.innerHTML = '<option value="">Selecciona un producto o servicio</option>' + state.catalog
      .map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`)
      .join('');

    const requested = new URLSearchParams(location.search).get('producto');
    if (requested && state.catalog.some(item => item.id === requested)) productSelect.value = requested;
    productSelect.disabled = false;
    applyCaptureRules(currentItem());
  } catch (error) {
    console.error(error);
    productSelect.innerHTML = '<option value="">Catálogo no disponible</option>';
    setMessage('No fue posible consultar los productos de Beheer. Para evitar inconsistencias no mostramos una lista local de respaldo.', 'error');
  }
}

function setAuthUi(user) {
  state.user = user || null;
  const authenticated = Boolean(user);
  if (signInButton) signInButton.hidden = authenticated;
  if (sessionBox) sessionBox.hidden = !authenticated;
  if (signOutButton) signOutButton.hidden = !authenticated;
  if (authHint) authHint.textContent = authenticated
    ? 'Cuenta Google verificada. Ya puedes adjuntar tu diseño y enviar la solicitud.'
    : 'Puedes preparar la solicitud. Inicia sesión con Google antes de adjuntar tu diseño y enviarla.';

  if (authenticated) {
    if (customerName) customerName.textContent = user.displayName || 'Cuenta Google';
    if (customerEmail) customerEmail.textContent = user.email || '';
    if (customerAvatar) {
      customerAvatar.src = user.photoURL || 'img/favicon.png';
      customerAvatar.alt = user.displayName || 'Cuenta Google';
    }
    const nameInput = document.querySelector('#nombre');
    const emailInput = document.querySelector('#email');
    if (nameInput && !nameInput.value) nameInput.value = user.displayName || '';
    if (emailInput) emailInput.value = user.email || '';
  }
  if (designInput) designInput.disabled = !authenticated;
  updateSummary();
}

signInButton?.addEventListener('click', async () => {
  clearMessage();
  signInButton.disabled = true;
  try {
    await signInCustomerWithGoogle();
  } catch (error) {
    console.error(error);
    const code = String(error?.code || '');
    setMessage(
      code.includes('operation-not-allowed')
        ? 'Google todavía no está habilitado en Firebase Authentication. Actívalo antes de publicar este flujo.'
        : 'No pudimos iniciar sesión con Google. Inténtalo de nuevo.',
      'error'
    );
  } finally {
    signInButton.disabled = false;
  }
});

signOutButton?.addEventListener('click', async () => {
  await signOutCustomer();
});

observeCustomer(user => setAuthUi(user));

productSelect?.addEventListener('change', () => applyCaptureRules(currentItem()));
form?.addEventListener('input', updateSummary);

function validateDesignFile(file) {
  if (!file) return true;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
  if (!allowed.has(file.type)) {
    setMessage('El diseño debe ser PNG, JPG, WEBP o PDF.', 'error');
    designInput.value = '';
    return false;
  }
  if (file.size > SITE_CONFIG.maxDesignBytes) {
    setMessage('El archivo de diseño supera el máximo de 8 MB.', 'error');
    designInput.value = '';
    return false;
  }
  return true;
}

designInput?.addEventListener('change', () => {
  clearMessage();
  const file = designInput.files?.[0] || null;
  if (!validateDesignFile(file)) return;
  if (!designPreview) return;
  if (!file) {
    designPreview.hidden = true;
    designPreview.textContent = '';
    return;
  }
  designPreview.hidden = false;
  designPreview.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB`;
});

async function setupTurnstile() {
  const host = document.querySelector('[data-turnstile-container]');
  if (!host) return;
  if (!SITE_CONFIG.turnstileSiteKey) {
    if (securityStatus) securityStatus.innerHTML = '<strong>Falta configurar Turnstile.</strong> El catálogo y Google funcionan, pero el envío final permanecerá bloqueado hasta agregar la site key.';
    return;
  }
  if (!document.querySelector('script[data-turnstile-script]')) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    document.head.appendChild(script);
  }
  for (let i = 0; i < 100 && !window.turnstile; i += 1) await new Promise(resolve => setTimeout(resolve, 50));
  if (window.turnstile) window.turnstile.render(host, { sitekey: SITE_CONFIG.turnstileSiteKey, theme: 'light' });
}
setupTurnstile();

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();

  if (!state.user || !customerAuth.currentUser) {
    setMessage('Inicia sesión con Google antes de enviar la solicitud.', 'error');
    return;
  }
  if (!form.reportValidity()) return;
  if (!SITE_CONFIG.livePublicApi) {
    setMessage('La conexión pública con Beheer todavía no está activa.', 'error');
    return;
  }
  if (!SITE_CONFIG.turnstileSiteKey) {
    setMessage('Turnstile todavía no está configurado. Por seguridad el envío está bloqueado.', 'error');
    return;
  }

  const item = currentItem();
  if (!item) {
    setMessage('Selecciona un producto válido del catálogo de Beheer.', 'error');
    return;
  }
  if (state.variantUnavailable) {
    setMessage('Este producto no tiene variantes activas disponibles en Beheer.', 'error');
    return;
  }
  if (item.configuration?.requiresVariant && !selectedVariant()) {
    setMessage('Selecciona una talla, color o variante antes de enviar.', 'error');
    return;
  }

  const design = designInput?.files?.[0] || null;
  if (!validateDesignFile(design)) return;
  const turnstileToken = window.turnstile?.getResponse?.() || '';
  if (!turnstileToken) {
    setMessage('Completa la verificación de seguridad antes de enviar.', 'error');
    return;
  }

  const body = new FormData(form);
  const idempotencyKey = createIdempotencyKey();
  body.set('idempotencyKey', idempotencyKey);
  body.set('source', 'WEB_SUBLIMAGIC');
  body.set('catalogItemId', item.id);
  body.set('catalogItemType', item.tipo);
  body.set('captureType', item.capture.type);
  body.set('turnstileToken', turnstileToken);
  body.set('email', state.user.email || '');
  if (design) body.set('diseno', design, design.name);

  submit.disabled = true;
  submit.textContent = 'Enviando para revisión…';
  try {
    const authToken = await getCustomerIdToken();
    const result = await apiRequest(SITE_CONFIG.endpoints.request, {
      method: 'POST',
      body,
      authToken,
      headers: { 'Idempotency-Key': idempotencyKey }
    });
    setMessage(`Solicitud recibida${result?.folio ? `: ${result.folio}` : ''}. Aparecerá en Beheer como Solicitud web para revisión.`, 'success');
    const keepProduct = productSelect.value;
    form.reset();
    productSelect.value = keepProduct;
    document.querySelector('#email').value = state.user.email || '';
    document.querySelector('#nombre').value = state.user.displayName || '';
    applyCaptureRules(currentItem());
    if (designPreview) designPreview.hidden = true;
    window.turnstile?.reset?.();
  } catch (error) {
    console.error(error);
    if (error.status === 429) setMessage('Se alcanzó el límite de solicitudes. Espera un poco antes de intentar de nuevo.', 'error');
    else if (error.status === 401) setMessage('Tu sesión de Google expiró. Vuelve a iniciar sesión.', 'error');
    else setMessage(error.message || 'No pudimos enviar la solicitud. Inténtalo de nuevo.', 'error');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Enviar solicitud para revisión';
  }
});

await loadCatalog();
