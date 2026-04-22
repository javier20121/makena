# Shopify en Makena

Este proyecto ya consume productos y carrito desde Shopify con la Storefront API.

Importante:
- El frontend de Makena usa `Storefront API` para leer productos y crear carrito.
- La carga o edicion de productos no se debe hacer desde `app.js` ni desde el navegador.
- Para subir productos tenes que usar `Shopify Admin` con CSV o `Admin API` desde un backend o script.

## 1. Conectar la web con Shopify

1. En Shopify instala el canal `Headless`.
2. Crea un storefront nuevo.
3. Genera un `Storefront API access token`.
4. En permisos del storefront habilita lectura de productos, colecciones y carrito.
5. Publica los productos al canal correspondiente para que el storefront pueda verlos.
6. En la web toca el boton de configuracion, pone tu dominio `tu-tienda.myshopify.com` y el token de Storefront.

En este repo la conexion esta en [app.js](C:/Users/becke/OneDrive/Escritorio/makena/app.js:9) y el panel de configuracion en [index.html](C:/Users/becke/OneDrive/Escritorio/makena/index.html:313).

## 2. Forma mas simple para subir productos

Usa CSV desde el admin de Shopify:

1. En Shopify anda a `Products`.
2. Hace click en `Import`.
3. Sube un archivo CSV en el formato de Shopify.
4. Si queres actualizar productos existentes, usa `Overwrite products with matching handles`.

Esto es lo mejor si:
- Tenes una lista de productos en Excel o Google Sheets.
- Vas a cargar muchos productos de una sola vez.
- No queres programar una integracion todavia.

## 3. Forma automatica para subir productos

Si queres subir productos desde un sistema propio, usa `Admin API`.

Flujo recomendado hoy:

1. Crea una app en `Dev Dashboard`.
2. Agrega scopes como `write_products` y `read_products`.
3. Instala la app en tu tienda.
4. Si la app es para tu propia organizacion, pedi el access token por `client credentials grant`.
5. Con ese token llama `productCreate`, `productSet` o `productVariantsBulkCreate` segun el caso.

Nunca pongas el `Admin API access token`, `client_id` o `client_secret` dentro de `app.js` o `index.html`.

## 4. Que usar en tu caso

Para Makena te conviene esto:

1. Conectar la web con `Storefront API` para mostrar catalogo y carrito.
2. Subir productos por `CSV` al principio.
3. Cuando ya tengas una planilla estable, pasar a una automatizacion con `Admin API` y un backend chico.

## 5. Links oficiales

- Storefront API getting started: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/getting-started
- Headless channel: https://shopify.dev/docs/storefronts/headless/building-with-the-storefront-api/manage-headless-channels
- Importar productos por CSV: https://help.shopify.com/es/manual/products/import-export/import-products
- Usar CSV de productos: https://help.shopify.com/es/manual/products/import-export/using-csv
- Crear apps en Dev Dashboard: https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard
- Obtener access token con client credentials grant: https://shopify.dev/apps/build/authentication-authorization/access-tokens/client-credentials-grant
- productCreate: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productcreate
- productSet: https://shopify.dev/docs/api/admin-graphql/latest/mutations/productSet
- API versioning: https://shopify.dev/docs/api/usage/versioning
