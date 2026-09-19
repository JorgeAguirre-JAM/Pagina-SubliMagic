import { SITE_CONFIG } from './config.js';
import { apiRequest, createIdempotencyKey } from './api.js';
const form = document.querySelector('#contact-form');
const message = document.querySelector('[data-contact-message]');
async function setupTurnstile() {
  const host = document.querySelector('[data-turnstile-container]');
  if (!host || !SITE_CONFIG.turnstileSiteKey) return;
  if (!document.querySelector('script[data-turnstile-script]')) {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    document.head.appendChild(script);
  }
  for (let i = 0; i < 80 && !window.turnstile; i += 1) await new Promise(resolve => setTimeout(resolve, 50));
  if (window.turnstile) window.turnstile.render(host, { sitekey: SITE_CONFIG.turnstileSiteKey, theme: 'light' });
}
setupTurnstile();

const setMessage = (text, type='info') => { if (message) { message.className = `alert alert--${type}`; message.textContent = text; message.hidden = false; } };
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fd = new FormData(form);
  if (fd.get('website')) return;
  if (!form.reportValidity()) return;
  if (!SITE_CONFIG.livePublicApi) { setMessage('El formulario en línea todavía no está habilitado. Puedes escribirnos al correo mostrado en esta página.', 'info'); return; }
  if (!SITE_CONFIG.turnstileSiteKey) { setMessage('La API pública está activa, pero falta configurar Turnstile. El envío fue bloqueado por seguridad.', 'error'); return; }
  const payload = Object.fromEntries(fd.entries());
  payload.source = 'WEB_SUBLIMAGIC_CONTACTO';
  payload.idempotencyKey = createIdempotencyKey();
  payload.turnstileToken = window.turnstile?.getResponse?.() || '';
  try { await apiRequest(SITE_CONFIG.endpoints.contact, { method: 'POST', body: JSON.stringify(payload), headers: { 'Idempotency-Key': payload.idempotencyKey } }); form.reset(); setMessage('Mensaje recibido. Te contactaremos lo antes posible.', 'success'); }
  catch (_) { setMessage('No pudimos enviar el mensaje. Inténtalo de nuevo o escríbenos por correo.', 'error'); }
});
