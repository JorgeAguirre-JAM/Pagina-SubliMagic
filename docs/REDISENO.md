# Rediseño del sitio Subli-Magic

## Qué cambió

El sitio anterior dependía de Bootstrap, jQuery, Font Awesome, Owl Carousel y estilos inline distribuidos entre varias páginas. Productos, precios, navbar y footer estaban duplicados o escritos manualmente.

La nueva versión usa HTML, CSS y JavaScript nativos con una estructura pequeña:

```text
assets/
  css/
    tokens.css
    base.css
    components.css
    pages.css
  js/
    config.js
    shell.js
    api.js
    public-catalog.js
    catalogo.js
    home.js
    pedido.js
    contacto.js
```

`assets/js/shell.js` centraliza navbar y footer. Ya no es necesario copiar ambos bloques entre páginas.

## Páginas principales

- `index.html`: portada comercial.
- `productos.html`: catálogo filtrable.
- `pedido.html`: solicitud web preparada para Beheer.
- `nosotros.html`: identidad y proceso.
- `contacto.html`: contacto sin Formspree.
- `priv.html`: política de privacidad modernizada conservando el contenido original.
- `terminos.html`: términos modernizados y aclaración de que una solicitud web no equivale a pedido confirmado.

Los archivos `about.html`, `aboutrse.html`, `misionvision.html` y `contact.html` permanecen como redirecciones para no romper enlaces antiguos.

## Identidad

Subli-Magic conserva su identidad propia. Beheer no aparece como marca visual del negocio; se menciona únicamente como plataforma operativa en textos técnicos/de proceso.

La interfaz usa negro/grafito y blanco como base, con el gradiente de color asociado al logotipo de Subli-Magic como acento controlado.

## Rendimiento

Se eliminaron dependencias de frontend que ya no eran necesarias. La carpeta final solo conserva las imágenes usadas por la nueva interfaz y el sitio utiliza `loading="lazy"` fuera del hero.
