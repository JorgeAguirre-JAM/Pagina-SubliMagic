import { SITE_CONFIG } from './config.js';

const icon = (name) => {
  const icons = {
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };
  return icons[name] || '';
};

function headerTemplate() {
  const page = document.body.dataset.page || '';
  const link = (href, key, label) => `<a href="${href}" ${page === key ? 'aria-current="page"' : ''}>${label}</a>`;
  return `
    <header class="site-header">
      <div class="container navbar">
        <a class="brand" href="index.html" aria-label="Subli-Magic - Inicio">
          <img src="img/HERRADURA SUBLI.png" alt="Subli-Magic">
        </a>
        <button class="menu-toggle" type="button" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button>
        <nav class="nav-links" aria-label="Navegación principal">
          ${link('index.html', 'home', 'Inicio')}
          ${link('productos.html', 'productos', 'Productos')}
          <a href="index.html#soluciones">Soluciones</a>
          <a href="index.html#empresas">Para empresas</a>
          ${link('nosotros.html', 'nosotros', 'Nosotros')}
          ${link('contacto.html', 'contacto', 'Contacto')}
          <a class="nav-cta" href="pedido.html">Solicita tu cotización ${icon('arrow')}</a>
        </nav>
      </div>
    </header>`;
}

function footerTemplate() {
  const c = SITE_CONFIG.contact;
  return `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <img src="img/HERRADURA SUBLI.png" alt="Subli-Magic">
            <p>Agencia de merchandising para marcas, empresas, equipos, creadores, eventos y proyectos especiales.</p>
          </div>
          <div>
            <h4>Productos</h4>
            <a href="productos.html?categoria=Ropa">Ropa</a>
            <a href="productos.html?categoria=Tazas">Tazas y termos</a>
            <a href="productos.html?categoria=Kits">Kits corporativos</a>
            <a href="productos.html">Todos los productos</a>
          </div>
          <div>
            <h4>Soluciones</h4>
            <a href="index.html#empresas">Para empresas</a>
            <a href="pedido.html?tipo=evento">Para eventos</a>
            <a href="pedido.html?producto=otro">Proyectos especiales</a>
            <a href="nosotros.html">Nosotros</a>
          </div>
          <div>
            <h4>Contacto</h4>
            <a href="mailto:${c.email}">${c.email}</a>
            <a href="tel:+529213031536">${c.phone}</a>
            <span>${c.city}</span>
            <a href="${c.instagram}" target="_blank" rel="noopener">Instagram</a>
            <a href="${c.facebook}" target="_blank" rel="noopener">Facebook</a>
          </div>
        </div>
        <div class="footer-note">
          <span>© ${new Date().getFullYear()} Subli-Magic. Todos los derechos reservados.</span>
          <span><a href="terminos.html" style="display:inline">Términos</a> · <a href="priv.html" style="display:inline">Privacidad</a></span>
        </div>
      </div>
    </footer>`;
}

const headerHost = document.querySelector('[data-site-header]');
const footerHost = document.querySelector('[data-site-footer]');
if (headerHost) headerHost.outerHTML = headerTemplate();
if (footerHost) footerHost.outerHTML = footerTemplate();

const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}
