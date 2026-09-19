# Imágenes del sitio Subli-Magic

## Imágenes editoriales

`assets/js/media-config.js` centraliza únicamente las fotografías editoriales del rediseño:

- Hero principal.
- Banner de oferta.
- Sección para empresas.
- Categorías u otros apoyos editoriales definidos por el sitio.

Las imágenes de producto **no** se mantienen en este archivo. Cada producto público obtiene `imagenWeb` directamente desde Beheer.

## Medidas recomendadas

| Uso | Medida | Relación |
| --- | --- | --- |
| Producto | 1200 × 1500 px | 4:5 |
| Categoría | 1000 × 1000 px | 1:1 |
| Hero | 1920 × 1080 px | 16:9 |
| Banner de oferta | 1200 × 628 px | 1.91:1 |
| Sección empresas | 1600 × 900 px | 16:9 |

Las tarjetas usan `object-fit: cover`, por lo que mantienen su estructura aunque cambie la fotografía.

## Cambiar el hero

Editar `assets/js/media-config.js`:

```js
hero: {
  src: 'https://tu-cdn.com/subli-magic/hero.jpg',
  alt: 'Descripción de la imagen',
  recommendedSize: '1920 × 1080 px',
  ratio: '16:9'
}
```

## Cambiar la imagen de un producto

Editar el producto/servicio correspondiente en Beheer y actualizar `imagenWeb`. Subli-Magic recibirá la nueva URL desde `GET /api/public/catalogo`; no debe añadirse una copia manual al frontend.

Las imágenes editoriales actuales pueden seguir siendo provisionales durante pruebas. Antes de publicar comercialmente, usar fotografías propias o recursos cuya licencia comercial haya sido revisada.
