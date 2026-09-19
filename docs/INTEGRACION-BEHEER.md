# Integración Subli-Magic → Beheer

## Arquitectura

```text
Subli-Magic
  -> GET catálogo público de Beheer
  -> configurar producto real
  -> Google Auth
  -> Turnstile
  -> POST solicitud multipart
  -> validación backend + rate limit + idempotencia
  -> R2 privado + solicitudesWeb
  -> revisión humana en Beheer
  -> cotización o pedido real
```

El sitio no escribe directamente en Firestore y no tiene credenciales de R2.

## API consumida

```text
GET  /api/public/catalogo
GET  /api/public/productos/{id}
POST /api/public/solicitudes-web
POST /api/public/contacto
```

`assets/js/config.js` mantiene `livePublicApi: true`. Antes de publicar es obligatorio configurar `turnstileSiteKey` y habilitar Google Authentication/Authorized domains.

## Catálogo

No existe fallback local. Si Beheer no responde, el sitio muestra un estado de indisponibilidad.

Cada artículo público puede incluir:

- ID público y referencia maestra;
- nombre/descripcion/imagen de presentación;
- categoría;
- `tipoPrecio`;
- `unidadVenta`;
- `reglaPrecio`;
- configuración de `captura`;
- variantes activas seguras cuando corresponda.

Costos, márgenes, proveedores y stock interno no forman parte del contrato público.

## Solicitud

El endpoint usa `multipart/form-data` porque el diseño viaja en la misma operación controlada. Requiere Google verificado, Turnstile e `Idempotency-Key`.

Campos principales:

```text
catalogItemId
medida
varianteProductoId (cuando aplique)
personalizacion
nombre
telefono
fechaDeseada
comentarios
turnstileToken
diseno (opcional)
website (honeypot, debe quedar vacío)
```

El archivo admite PNG, JPG/JPEG, WEBP o PDF, máximo 8 MB.

## Estados

```text
RECIBIDA
VERIFICADA
EN_REVISION
CONTACTADA
COTIZADA
CONVERTIDA
RECHAZADA
SPAM
```

Una solicitud web no descuenta inventario ni crea movimientos financieros. `COTIZADA` y `CONVERTIDA` se alcanzan únicamente cuando Beheer crea y vincula una cotización/pedido real.

## Seguridad

- Google Auth de cliente público;
- Turnstile verificado server-side;
- rate limit persistente y condicionado por versión de Firestore;
- honeypot;
- idempotencia ligada al UID;
- validación server-side de producto, medida, variante, MIME y tamaño;
- CORS restringido;
- R2 privado;
- roles internos separados de clientes web.
