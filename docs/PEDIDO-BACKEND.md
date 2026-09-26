# API privada del configurador V279

La interfaz Next.js puede seguir en GitHub Pages. Los archivos de `backend/pedido-api/` necesitan un hosting PHP; no deben copiarse a `public/` ni al artefacto estático de Pages. Ninguno de los originales de `lo que faltaba/`, su ZIP, sus configuraciones o su recuperación manual debe desplegarse ni versionarse.

## Estado y requisitos

- PHP con cURL, PDO SQLite, fileinfo, mbstring y GD. El código y las pruebas son compatibles con PHP 7.4; para producción debe usarse una versión PHP con soporte de seguridad vigente.
- Hosting HTTPS y un directorio privado escribible **fuera de DocumentRoot**. `TONY_PRIVATE_DIR` contiene `pedido.sqlite`; el código rechaza almacenamiento dentro del directorio web. El directorio debe existir y pertenecer al usuario del proceso PHP, con permisos restringidos. Se utilizan consultas parametrizadas, transacciones SQLite y una restricción única para los identificadores de transacciones de pago.
- Variables de entorno del hosting a partir de `.env.example`. `backend/pedido-api/config.example.php` es una plantilla segura que solo lee `getenv`, bloqueada por `.htaccess`; no contiene claves ni es necesaria para arrancar. PHP no carga archivos `.env` automáticamente. No subir `.env` al directorio público ni poner secretos en `NEXT_PUBLIC_*`.
- Copiar los archivos exactos `data/pedido/prices.json` y `data/pedido/checkout.json` a una ubicación privada; configurar `TONY_PRICES_FILE` y `TONY_CHECKOUT_FILE`. Son las mismas tablas que importa la interfaz; no mantener otra tabla PHP. Actualizarlas juntas con cada versión.
- Configurar `TONY_FRONTEND_URL` con la URL completa de la web (incluye `/TonySport` en Pages) y `TONY_API_PUBLIC_URL` con la URL HTTPS de esta carpeta PHP. El cliente usa `NEXT_PUBLIC_TONY_API_BASE`; es una URL pública, no una clave.
- Configurar un `TONY_APP_SECRET` aleatorio de al menos 32 caracteres y claves **nuevas** para Gemini, Panel y Wompi. Los originales adjuntos contienen credenciales literales; no se copiaron. Rotarlas antes de habilitar el backend.

Los interruptores `TONY_AI_ENABLED`, `TONY_PANEL_ENABLED` y `TONY_WOMPI_ENABLED` están apagados por defecto. No se hicieron solicitudes a servicios reales al implementar o probar esta integración.

## Servidor web

Servir únicamente los endpoints de esta carpeta. Apache debe permitir el `.htaccess` incluido: evita índices, bloquea archivos internos y conserva `Authorization`. En Nginx/IIS replicar esas reglas y pasar el encabezado Bearer a PHP. No servir las carpetas `backend/tests/` ni `docs/` desde la raíz API.

Configurar `post_max_size=25M`, `upload_max_filesize=8M`, `max_file_uploads=9`, `memory_limit=256M` y un tiempo de ejecución acorde con las llamadas IA (hasta 90 segundos por modelo; como máximo dos modelos). Limitar también el cuerpo HTTP en el servidor web a 25 MiB. La aplicación impone 24 MiB por solicitud; el MiB adicional del servidor permite responder con un error JSON legible. Para Wompi, el proxy debe conservar el encabezado oficial `wompi_hash`; algunos proxies descartan encabezados con guion bajo por defecto.

`TONY_ALLOWED_ORIGINS` es una lista CSV de orígenes exactos; si está vacía se usa el origen de `TONY_FRONTEND_URL`. La plantilla incluye el sitio oficial con/sin www, Pages y localhost/127.0.0.1:3000. No admite comodines, rutas ni coincidencias parciales. Cada petición de navegador requiere `Origin`, incluso si es same-origin. Se admite preflight con `Authorization`, `Content-Type`, `Idempotency-Key`. No se usan cookies cross-site. No se confía en `X-Forwarded-For` para la cuota: el hosting debe configurar una dirección cliente fiable si tiene proxy.

## Contrato del cliente

Todos los errores son JSON con `ok:false`, `success:false`, `code`, `error` legible y `retryable`. No devuelven claves, respuesta interna de proveedor ni datos del cliente. Todos los importes públicos son **centavos enteros USD**.

1. `POST session.php`, sin cuerpo. Devuelve `{ok, sessionToken, expiresAt, mock}`. El token tiene 256 bits aleatorios; el servidor guarda únicamente su hash. Vence a las 8 horas. Guardar solo este token en memoria/sessionStorage. No persistir datos del responsable, plantilla de jugadores, firma ni comprobantes en localStorage/sessionStorage.
2. En las siguientes llamadas enviar `Authorization: Bearer <sessionToken>`. Si vence la sesión, los pagos/pedidos anteriores no se reasignan a otra sesión; requieren atención de Tony. El retorno de Wompi debe conservar la pestaña y su sesión original.
3. En creación de pago y envío definitivo enviar `Idempotency-Key` (16–100 caracteres alfanuméricos, guion o guion bajo). Reutilizar la misma clave al reintentar **exactamente** la misma solicitud. Datos distintos con la misma clave devuelven 409. Una llamada externa de resultado incierto conserva su intención; no crea automáticamente otro cobro o envío.

| Endpoint | Entrada | Respuesta principal |
| --- | --- | --- |
| `quote.php` POST | `{order,delivery}` | `{ok,quote,version:279}`; `quote` coincide con `PedidoPricing` de TypeScript |
| `generate.php` POST multipart | `image`, `side:front\|back`, `product:uniform\|shirt`, opcional `placementRules`/`placement_rules`/`prompt` | `{ok,success,image,mime,provider,model,fallback_used,attempts}` |
| `magic_eraser.php` POST multipart | `image`, `side`, `x,y,w,h` en 0–1, región completamente dentro de la imagen | Mismo contrato de imagen |
| `finalize.php` POST multipart | `image`, `side`, `product:uniform\|shirt`, opcional `assets[]` (máximo 8), `assets_meta` JSON con `type/name` | Mismo contrato de imagen |
| `wompi-crear-pago.php` POST | `{order,delivery,amountCents,buyer?}` | `{ok,url,reference,idEnlace,amountCents,quote,status,mock}` |
| `wompi-verificar.php?order=reference` GET | Bearer de la sesión dueña | `{ok,paid,status,reference,amountCents,quote,snapshot:{order,delivery},url?,mock}`; devuelve el enlace existente para recuperar un pago pendiente sin crear otro |
| `tony-submit-order.php` POST | `{order,buyer,delivery,payment,signature,termsAccepted,designs?}` | `{ok,receipt}` |
| `order.php?id=reference` GET | Bearer de la sesión dueña | `{ok,receipt}`, sin datos del responsable, firma o comprobantes |
| `wompi-webhook.php` POST | JSON original de Wompi y encabezado `wompi_hash` obligatorio | `{ok:true}` después de verificar firma y proveedor |
| `wompi-retorno.php?order=reference` GET | Referencia opaca creada en servidor | HTTP 303 al frontend `/configurador?wompi_order=reference`; nunca confirma pagos |

`order` y `delivery` siguen `lib/pedido/types.ts`. `quote` admite campos de selección incompletos; crear pago/enviar exige configuración, 6–99 jugadores, talla/nombre/número completos y ambas vistas finales aprobadas. `design.front/back` pueden ser nulos; si existen deben ser data URLs. Todas las imágenes deben ser PNG/JPEG/WebP verificadas por contenido y dimensiones, no una URL ni un SVG. Una imagen tiene máximo 8 MiB y 20 megapíxeles; cada asset adicional 4 MiB, hasta 40 capas en el pedido. Posiciones y tamaño de las capas usan porcentaje 0–100. Un identificador de diseño compartido no puede representar archivos distintos.

`buyer` requiere nombre, DUI `00000000-0` y teléfono salvadoreño. El correo es opcional; cuando se informa debe ser válido. `signature` es una data URL PNG, hasta 1 MiB y 2048×1024, no vacía. `termsAccepted` debe ser literalmente `true`; se registra la versión actual de condiciones desde checkout.json. Si se manda `designs`, debe ser `{front,back}` e idéntico a `order.design.finalFront/finalBack`.

El precio se calcula en servidor leyendo la tabla JSON: jamás se usa un total del navegador. `amountCents` debe coincidir exactamente con `depositCents`, el anticipo del 50% redondeado a centavos. Al crear el enlace se guarda una instantánea privada de diseño/pedido/entrega; el envío posterior debe coincidir exactamente. `buyer` es opcional al crear el pago porque el formulario lo solicita después; si se envía entonces, tampoco puede cambiar al confirmar.

`payment` acepta `{method:'wompi',bank:'',reference}` o `{method:'transfer',bank,receiptName,receiptData}`. El banco debe existir en checkout.json. El comprobante es una imagen válida de hasta 6 MiB. Una transferencia queda siempre `awaiting_review`; ni una imagen ni un indicador enviado por el cliente pueden marcarla pagada.

`receipt` contiene `{id,reference,status,paymentStatus,panelStatus,currency,totalCents,depositCents,balanceCents,createdAt,mock}`. `status` es `confirmed` para anticipo Wompi verificado o `transfer_review` para revisión de transferencia. `panelStatus` es `sent` o `pending` y **debe mostrarse**: un pedido guardado con envío al Panel pendiente no equivale a una recepción confirmada por el Panel. No expone imágenes, DUI, contacto, nombres de jugadores ni identificadores internos de tarjeta.

## Wompi y Panel

Wompi usa los orígenes oficiales fijos, OAuth de servidor y la API de enlaces. Un pago solo queda `deposit_paid` cuando se verifica aprobación real, importe exacto, ID de comercio, nombre/referencia de enlace, ID de enlace y pertenencia de la transacción al enlace. Se consulta tanto `/EnlacePago/{id}` como `/TransaccionCompra/{id}`. Un ID de transacción no puede acreditarse a dos pedidos. Falta de propiedades, una transacción de pruebas en producción o un vínculo diferente se rechazan.

El webhook verifica HMAC-SHA256 del **cuerpo sin modificar**, usando `WOMPI_CLIENT_SECRET`, y después confirma con la API. No hay firma opcional ni token de secreto en una URL. El retorno del navegador ignora `esAprobada`, monto, hash y transactionId como autorización de pago. Las verificaciones posteriores solo permiten la sesión propietaria.

El Panel recibe el objeto limpio `{id,version,order,buyer,delivery,payment,signature,termsAccepted,termsVersion,designs,quote}`, con `X-Tony-Token` e `Idempotency-Key` igual a la referencia. Debe responder JSON `ok:true` o `success:true`; si incluye `id`, debe coincidir. Este **contrato receptor no pudo verificarse sin acceso al Panel**. Antes de activar `TONY_PANEL_ENABLED`, adaptar/confirmar el receptor y comprobar que maneja esa clave de idempotencia. Nunca activar el proxy original con datos libres del navegador.

El pedido se conserva antes del envío externo. Solo se intenta enviar una vez automáticamente, aun si el navegador reintenta; un timeout permanece `panelStatus:pending`. El operador debe reconciliar el ID en el Panel antes de reenviar. No se incluye un botón público para forzar reenvío o confirmar transferencias. La conciliación administrativa, retención/borrado de pedidos, copias de seguridad y recuperación de sesiones requieren configuración en el hosting y no están implementadas como acciones públicas.

## IA

Los tres prompts fueron extraídos de los archivos V279 y aislados en `prompts.php`; no se copiaron configuraciones ni claves. Se conserva el contrato de Interactions verificado en la documentación oficial, con `store:false` y resultado imagen. `GEMINI_IMAGE_MODEL` predetermina `gemini-3-pro-image` y `GEMINI_IMAGE_FALLBACK_MODEL` predetermina `gemini-3.1-flash-image`; ambas variables son configurables (fallback vacío lo desactiva). No hay reintentos ilimitados: máximo una llamada por modelo; el fallback se usa en saturación o respuesta sin imagen, nunca automáticamente después de un timeout incierto. El cliente espera hasta 200 segundos para esos dos intentos. Los errores técnicos del proveedor no salen al navegador.

Cuotas actuales: sesión nueva 12/h por IP; peticiones generales 120/min por IP y 60/min por sesión; IA 8/h por sesión, 20/h por IP y 2/min por sesión; creación de pago 5/h por sesión; envío de pedido 8/h por sesión. El hosting debe añadir sus límites globales/presupuesto del proveedor según el uso real. Las cuotas por IP evitan que una nueva sesión reinicie la cuota IA.

Adaptación necesaria del prompt heredado: el original exigía siempre una camiseta y una calzoneta. Para `product:shirt` se quitan únicamente las instrucciones que exigen calzoneta y se impone una sola camisa sin prendas adicionales, tanto al generar como al finalizar. `uniform` conserva el texto original. El borrador respeta la prenda existente. El cliente convierte configuración/género en reglas de colocación; no envía datos del comprador al modelo.

Documentación oficial consultada para los contratos: [validación webhook Wompi](https://docs.wompi.sv/webhook/validar-webhook), [crear enlace Wompi](https://docs.wompi.sv/metodos-api/enlace-de-pago), [esquema OpenAPI Wompi](https://api.wompi.sv/swagger/v1/swagger.json), [generación de imágenes Gemini](https://ai.google.dev/gemini-api/docs/image-generation) y [Interactions API](https://ai.google.dev/api/interactions-api).

## Pruebas locales sin servicios reales

```powershell
& 'C:\wamp64\bin\php\php7.4.9\php.exe' backend/tests/run.php
node backend/tests/http.cjs
node backend/tests/client.cjs
npx playwright test tests/pedido/php-pricing.spec.ts
```

Para el frontend interactivo:

```powershell
$env:TONY_TEST_ORIGIN='http://localhost:3000'
$env:TONY_TEST_PORT='8787'
node backend/tests/mock-server.cjs
```

El frontend de pruebas configura `NEXT_PUBLIC_TONY_API_BASE=http://127.0.0.1:8787`. `TONY_TEST_PHP` permite otra ruta al ejecutable. Los runners crean y eliminan un directorio temporal privado con datos sintéticos. Nunca usan claves reales ni llaman proveedores; el cliente HTTP tiene además un bloqueo central contra llamadas externas cuando está en mock.

El modo mock exige `TONY_API_MOCK=true`, entorno `test/development`, servidor y frontend loopback y ausencia de proxy reenviador. No existe un parámetro público que lo active. Las respuestas incluyen `mock:true`; la IA devuelve la imagen de entrada sin decir que fue editada. El enlace de prueba vuelve al frontend local con `mock_payment=1`; solo `POST mock-confirm.php {reference}` con la sesión dueña acredita explícitamente una transacción sintética. Omitir `mock-confirm.php` del paquete de producción como medida adicional.

Las pruebas cubren paridad de precios, redondeo, portero gratis, campos adulterados, archivos falsos, firma vacía, HMAC faltante, asociación/reutilización de pago, transferencia pendiente, sesión propietaria, CORS exacto, idempotencia, retorno, cuotas y los tres endpoints multipart. Quedan pendientes pruebas reales de credenciales, compatibilidad receptor Panel, entrega del webhook y límites del hosting antes de habilitar esos servicios.

La prueba `php-pricing.spec.ts` serializa exactamente las fixtures TypeScript y compara todas las partidas devueltas por PHP, con ambos productos, cantidades 6/11/12/99, telas, complementos, porteros, capas ocultas y medios centavos. Su runner PHP es solo CLI y no abre almacenamiento ni consulta proveedores. `lib/pedido/api.ts` convierte las láminas locales del catálogo a data URLs, conserva el prefijo de Pages, reutiliza bytes para que la instantánea no cambie y no guarda datos personales. El pago debe abrirse en la misma pestaña: así el token opaco en sessionStorage sobrevive el retorno; no se transmite en URL ni se comparte con otra pestaña mediante postMessage.
