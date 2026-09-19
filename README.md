# Subli-Magic — sitio comercial

Sitio público de Subli-Magic como agencia de merchandising para personas, empresas, equipos, creadores, eventos y proyectos especiales.

## Ejecutar localmente

Desde la carpeta `SubliMagic/`:

```text
php -S localhost:5501
```

Abrir `http://localhost:5501`.

## Archivos principales

- `index.html`: portada comercial y máximo 4 productos destacados.
- `productos.html`: catálogo completo con búsqueda, categoría y ordenamiento.
- `pedido.html`: personalización y solicitud web.
- `nosotros.html`: presentación del negocio.
- `contacto.html`: contacto.
- `assets/js/config.js`: API, Firebase y Turnstile site key.
- `assets/js/public-catalog.js`: normalización/render del catálogo recibido desde Beheer.
- `assets/js/media-config.js`: fotografías editoriales del sitio, no productos.
- `docs/INTEGRACION-BEHEER.md`: contrato y seguridad de la integración.

## Fuente de verdad

No existe catálogo local de respaldo. Productos, servicios, precios, unidades, reglas de captura, publicación web y variantes provienen de Beheer. Si la API no está disponible, la interfaz informa indisponibilidad en vez de inventar productos.

## Envío de solicitudes

El envío público está conectado a la API real de Beheer. Requiere Google, Turnstile y validaciones server-side. La `turnstileSiteKey` debe configurarse antes de abrir el formulario al público.
