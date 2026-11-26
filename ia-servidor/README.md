# Servidor del mockup con IA de Tony Sportswear

Este servidor hace funcionar los botones de IA de **Crea tu pedido** en la web de GitHub Pages: «Generar mockup con IA», «Borrar área con IA» y «Preparar mockup profesional con IA». Funciona en Vercel y genera las imágenes con **Google Gemini a través de Vercel AI Gateway**:

- `google/gemini-3-pro-image` (Nano Banana Pro), el modelo principal;
- `google/gemini-3.1-flash-image` (Nano Banana 2), el respaldo, que solo se usa si el principal está saturado o no devuelve imagen.

No necesita claves. En Vercel, AI Gateway se autentica solo con el token OIDC del proyecto.

## Desplegar en un clic

[![Desplegar en Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodyworksoporte-dot%2FTonySport%2Ftree%2Fmain%2Fia-servidor&project-name=tony-mockup-ia)

Enlace directo: https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodyworksoporte-dot%2FTonySport%2Ftree%2Fmain%2Fia-servidor&project-name=tony-mockup-ia

1. La carpeta `ia-servidor/` tiene que estar publicada en la rama `main` del repositorio `codyworksoporte-dot/TonySport`; el botón la copia desde ahí.
2. Abre el enlace, inicia sesión en Vercel y pulsa **Deploy**. No hay que escribir ninguna variable.
3. Al terminar, abre la URL del proyecto (por ejemplo `https://tony-mockup-ia.vercel.app`). Debe responder con un JSON `{"ok":true,"service":"tony-mockup-ia",...,"auth":"vercel-oidc"}`.

Con eso basta. El botón crea un repositorio nuevo con una copia de esta carpeta. Si prefieres que cada cambio en `TonySport` se despliegue solo, importa en Vercel el repositorio `TonySport` y elige `ia-servidor` como **Root Directory**.

## Conectar la web

1. En GitHub, abre `codyworksoporte-dot/TonySport` → **Settings** → **Secrets and variables** → **Actions** → pestaña **Variables** → **New repository variable**.
2. Nombre: `NEXT_PUBLIC_TONY_API_BASE`. Valor: la URL del proyecto de Vercel sin barra final, por ejemplo `https://tony-mockup-ia.vercel.app`.
3. Vuelve a publicar la web: **Actions** → «Publicar Tony Sportswear» → **Run workflow**, o haz cualquier push a `main`. La variable se incorpora al compilar; sin volver a publicar no cambia nada.

Desde ese momento los botones de IA quedan activos en https://codyworksoporte-dot.github.io/TonySport/configurador. Los pasos de envío del pedido y de pago responden «El envío de pedidos en línea se activará pronto. Tu diseño queda guardado.» hasta que exista ese servicio.

## Costo

Cada imagen consume créditos de AI Gateway de tu cuenta de Vercel. Vercel incluye un crédito gratuito mensual por equipo (revisa el monto vigente en el panel **AI Gateway**). Después se paga por uso, al precio del proveedor. Precios del catálogo de AI Gateway consultados en noviembre de 2026, por imagen de 1K:

| Modelo | Precio aproximado por imagen |
| --- | --- |
| `google/gemini-3-pro-image` (principal) | 0,134 USD |
| `google/gemini-3.1-flash-image` (respaldo) | 0,067 USD |

A eso se suma una fracción de centavo por la imagen y el texto que recibe el modelo. Un mockup completo usa cuatro imágenes (frente y espalda al generar, y frente y espalda en el acabado): unos 0,54 USD con el modelo principal, o 0,27 USD si usas solo el rápido (`AI_IMAGE_MODEL=google/gemini-3.1-flash-image`).

Para no pasarte, fija un tope de gasto en Vercel: **AI Gateway** → **Budgets**, o `vercel ai-gateway budgets set team --amount 10 --refresh-period monthly`.

## Límites

- Cuerpo de cada solicitud: menos de 4,5 MB, el límite de Vercel Functions. El navegador reduce las imágenes antes de enviarlas: la principal a 1600 px como máximo y los logos a 1024 px, en WebP.
- El servidor exige como máximo 4 MB por archivo y 4,4 MB en total. Acepta PNG, JPEG y WebP, verificados por su contenido.
- Hasta 8 logos originales por vista en el acabado.
- Cuotas en memoria, por instancia: 8 imágenes por hora por sesión, 20 por hora por IP y 2 por minuto por IP. Son de mejor esfuerzo; el tope de gasto de Vercel es la protección real.
- Una llamada por modelo, sin reintentos automáticos. Una espera agotada no lanza otra llamada pagada. Cada respuesta tarda unos 185 segundos como máximo; el navegador espera 200. `maxDuration` es de 300 s con Fluid compute.
- CORS con orígenes exactos: `https://codyworksoporte-dot.github.io`, `http://localhost:3000` y `http://127.0.0.1:3000`. Si la web cambia de dominio, agrégalo en `lib/config.js`.

## Variables opcionales

Ninguna es necesaria.

| Variable | Uso |
| --- | --- |
| `AI_IMAGE_MODEL` | Modelo principal. Predeterminado: `google/gemini-3-pro-image`. |
| `AI_IMAGE_FALLBACK_MODEL` | Respaldo. Predeterminado: `google/gemini-3.1-flash-image`. Si queda vacío, no hay respaldo. |
| `AI_GATEWAY_API_KEY` | Clave de AI Gateway en lugar de OIDC, por ejemplo fuera de Vercel. |
| `GEMINI_API_KEY` | Usa la API de Gemini directamente, sin AI Gateway. `GEMINI_IMAGE_MODEL` y `GEMINI_IMAGE_FALLBACK_MODEL` cambian sus modelos. |
| `SESSION_SECRET` | Al menos 32 caracteres. Firma los tokens de sesión con un secreto propio. Sin ella, se usa uno derivado del despliegue; en cada despliegue nuevo el navegador abre otra sesión sola. |

## Endpoints

El cliente (`lib/pedido/api.ts`) llama a rutas `.php`. `vercel.json` las reescribe hacia `api/`:

| Ruta | Respuesta |
| --- | --- |
| `GET /` | Estado del servicio, sin secretos. |
| `POST /session.php` | `{ok, sessionToken (64 hex), expiresAt, mock:false}`. El token dura 8 horas. |
| `POST /generate.php`, `/magic_eraser.php`, `/finalize.php` | Multipart con `image`, `side`, `product`, `placementRules`, `spec`, `x`/`y`/`w`/`h` y `assets[]` + `assets_meta`. Exige `Authorization: Bearer <token>`. Responde `{ok, success, image: "data:<mime>;base64,…", mime, provider, model, fallback_used, attempts}`. |
| `quote.php`, `tony-submit-order.php`, `wompi-*.php`, `order.php`, `auth.php` | `503 {ok:false, success:false, code:"not_enabled", error, retryable:false}`. |

Los errores siempre son JSON en español con `code` y `retryable`. Nunca incluyen claves, la respuesta del proveedor ni las imágenes del cliente.

## Los prompts

`lib/prompt-text.js` contiene los textos y `lib/prompts.js` los arma. El generador está preparado para imágenes mal tomadas: torcidas, giradas, recortadas, en perspectiva, arrugadas, puestas en una persona, capturas de pantalla o fotos con poca luz. Extrae el diseño y lo presenta recto sobre el modelo que eligió el cliente: molde, cuello, manga, tela, producto y corte son obligatorios. En el acabado, cada logo torcido o mal ubicado se endereza, pierde su caja de fondo y se integra en su zona como sublimación, o como 3D si el cliente lo eligió. `backend/pedido-api/prompts.php` tiene los mismos textos; la prueba de contrato comprueba que coincidan.

## Probar sin red ni claves

```bash
npm install
npm test          # prueba de contrato: sesión, CORS, multipart, límites, cuotas, errores, prompts y respaldo de modelos
npm run local -- --simulado   # servidor local en http://127.0.0.1:8787 que devuelve la imagen recibida, sin llamar a ningún modelo
```

Para ver la IA real en local, define `AI_GATEWAY_API_KEY` (o ejecuta `vercel env pull` en un proyecto enlazado), corre `npm run local` e inicia la web con `NEXT_PUBLIC_TONY_API_BASE=http://127.0.0.1:8787`.

## Si algo falla

- `GET /` responde, pero la IA dice «La IA todavía no está configurada»: el proyecto no recibe el token OIDC. Revisa en Vercel **Settings** → **Security** → **OIDC Federation** que esté activado, o define `AI_GATEWAY_API_KEY`.
- «La IA de Tony no tiene saldo disponible por ahora»: se acabó el crédito de AI Gateway o se alcanzó el tope de gasto.
- El navegador dice «No pudimos conectar con Tony»: revisa que `NEXT_PUBLIC_TONY_API_BASE` sea la URL exacta, sin barra final, y que la web se haya vuelto a publicar.
