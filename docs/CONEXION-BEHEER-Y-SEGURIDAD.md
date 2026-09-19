# Subli-Magic conectado a Beheer

## Qué viene de Beheer

Los productos y servicios visibles en Subli-Magic se consultan desde Beheer. No hay una segunda lista manual de productos en este proyecto.

El inicio muestra máximo cuatro artículos. `productos.html` funciona como catálogo/tienda completa.

Para publicar un artículo, entrar a Beheer → Catálogos → Productos y servicios y activar **Publicar en web**. Para priorizarlo en el inicio, activar **Destacado en inicio**.

## Imágenes

La imagen de cada producto se define en Beheer con `imagenWeb` y se recomienda 1200 × 1500 px (4:5).

Las únicas imágenes editoriales que siguen configuradas en este sitio son hero, oferta y sección empresas. Se cambian en:

`assets/js/media-config.js`

Recomendaciones:

- hero: 1920 × 1080;
- oferta: 1200 × 628;
- empresas: 1600 × 900.

Las URL actuales son provisionales y pueden sustituirse sin tocar el HTML.

## Google antes de enviar

El botón **Personalizar** lleva al formulario. El formulario permanece bloqueado hasta iniciar sesión con Google. El correo utilizado se obtiene de esa sesión y se envía un token Firebase al backend.

Esto no da acceso al panel Beheer: el usuario público no tiene rol interno.

## Diseño adjunto

El cliente puede subir PNG, JPG o WEBP, máximo 8 MB. El backend valida MIME y tamaño antes de guardarlo en R2 privado.

## DTF

El campo de medida cambia automáticamente según lo que Beheer indique:

- DTF Textil → Metraje (m), mínimo 0.50.
- DTF UV → Tabloides 29×41, entero, porque Beheer lo calcula hoy a $180 por tabloide.
- Productos por metro → Metraje.
- Otros → Cantidad.

## Antes de publicar

1. Habilitar Google en Firebase Authentication.
2. Agregar el dominio público a Authorized domains.
3. Crear Turnstile y colocar la site key en `assets/js/config.js`.
4. Configurar el secret de Turnstile y CORS en Render.
5. En Beheer marcar explícitamente los productos que se publicarán.
6. Probar una solicitud web de punta a punta antes de anunciar el sitio.
