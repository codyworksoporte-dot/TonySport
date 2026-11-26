# Mockup con IA en «Crea tu pedido»

Cómo funciona la IA del editor, cómo se despliega en un clic, cómo se conecta con la web, qué cuesta y qué límites tiene. El servidor está en `ia-servidor/` y su guía rápida en `ia-servidor/README.md`.

## Por qué no funcionaba

La web se publica en GitHub Pages, que solo sirve archivos estáticos. El backend PHP (`backend/pedido-api/`) nunca se desplegó, y `NEXT_PUBLIC_TONY_API_BASE` estaba vacía. Por eso los botones de IA aparecían desactivados. `ia-servidor/` es un backend serverless para Vercel que cumple el mismo contrato del cliente, así que la web no cambia de arquitectura.

## Cómo funciona

1. **En el navegador, antes de la IA.** Al subir un escudo, una marca o un patrocinador, el editor lo ajusta solo con `lib/pedido/autofit.ts`, que usa canvas y no necesita librerías:
   - quita el fondo uniforme con un relleno desde los bordes que sigue las sombras suaves del papel, y suaviza los bordes;
   - en los patrocinadores anchos también vacía los huecos de las letras;
   - recorta lo sobrante;
   - endereza inclinaciones de 2° a 30°. Combina la orientación dominante de los bordes con el rectángulo mínimo del contorno;
   - centra y escala el logo en su zona del modelo: el escudo en el pecho y los patrocinadores en el pecho y luego en la espalda.

   Si la imagen no tiene un fondo uniforme (una foto con un fondo complejo) o ya está bien, no se toca. **Deshacer** devuelve el archivo original. El interruptor «Ajuste automático» lo desactiva, y el botón **Ajustar automáticamente** lo aplica a cualquier logo ya colocado. El logo ajustado recibe su propio identificador de diseño (`<sha256>-af1`) y sus copias en el frente y en la espalda se actualizan juntas, así que se cobra una sola vez.
2. **El cliente prepara la solicitud** (`lib/pedido/api.ts`):
   - comprime la imagen principal a 1600 px como máximo y los logos a 1024 px, en WebP con transparencia, para que cada solicitud quede por debajo de 4 MB;
   - envía `placementRules`, la configuración obligatoria en texto (producto, corte, molde, cuello, manga, tela, marca y acabados), y `spec`, los mismos datos estructurados junto con el código y la línea del diseño de catálogo;
   - nunca envía datos del comprador, del equipo ni de los jugadores.
3. **El servidor** (`ia-servidor/`):
   - valida el origen, la sesión, el tipo real de cada archivo y los tamaños;
   - aplica las cuotas;
   - arma el prompt y llama al modelo con el AI SDK a través de Vercel AI Gateway.
4. **Los prompts** (`ia-servidor/lib/prompt-text.js`, iguales en `backend/pedido-api/prompts.php`):
   - **Generar**: la referencia puede venir mal tomada (torcida, girada, recortada, en perspectiva, arrugada, sobre una persona, una captura o una foto oscura). El modelo extrae el diseño, corrige los defectos y lo reconstruye recto sobre el modelo elegido. La confección sigue la configuración aunque la imagen muestre otra cosa; el diseño sigue la referencia. En la espalda limpia nombres y números viejos.
   - **Acabado**: cada logo se identifica con su archivo original, pierde la caja de fondo, se endereza, se acomoda en su zona y se imprime en la tela como sublimación, o en 3D alto relieve si se eligió. Quedan exactamente una camisa y una calzoneta (o solo la camisa).
   - **Borrador mágico**: edición local estricta dentro de la región marcada.

## Desplegar en un clic

https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcodyworksoporte-dot%2FTonySport%2Ftree%2Fmain%2Fia-servidor&project-name=tony-mockup-ia

- Requiere que `ia-servidor/` esté en la rama `main` del repositorio.
- Pulsa **Deploy**. AI Gateway se autentica con OIDC, así que no hay claves que configurar.
- Comprueba la URL del proyecto: `GET /` responde `{"ok":true, ...}`.

## Conectar la web

1. GitHub → **Settings** → **Secrets and variables** → **Actions** → **Variables**. Crea `NEXT_PUBLIC_TONY_API_BASE` con la URL del proyecto de Vercel, sin barra final.
2. Vuelve a ejecutar el flujo «Publicar Tony Sportswear»: `.github/workflows/pages.yml` ya pasa esa variable al compilar.

Con la variable definida, los botones de IA se activan. Los pasos de envío y pago responden «El envío de pedidos en línea se activará pronto. Tu diseño queda guardado.»; el diseño se conserva igual que antes.

## Costos

Cada imagen consume créditos de AI Gateway de la cuenta de Vercel. Hay un crédito gratuito mensual; después se paga por uso. Con los precios del catálogo de AI Gateway de noviembre de 2026, una imagen de 1K cuesta unos 0,134 USD con `google/gemini-3-pro-image` y 0,067 USD con `google/gemini-3.1-flash-image`, más una fracción de centavo por la entrada. Un diseño completo (generar frente y espalda, más el acabado de ambas caras) ronda 0,54 USD con el modelo principal. Conviene fijar un tope en **AI Gateway** → **Budgets**.

## Límites

| Límite | Valor |
| --- | --- |
| Cuerpo por solicitud (Vercel) | 4,5 MB; el cliente comprime a menos de 4 MB |
| Archivo / total | 4 MB / 4,4 MB; PNG, JPEG o WebP verificados por contenido |
| Logos en el acabado | 8 por vista |
| Cuotas (en memoria, mejor esfuerzo) | 8/h por sesión, 20/h por IP y 2/min por IP |
| Modelos | Una llamada por modelo; el respaldo solo si hay saturación o no hay imagen |
| Tiempo | 185 s por respuesta como máximo (el navegador espera 200 s); `maxDuration` 300 s |
| Orígenes | `https://codyworksoporte-dot.github.io`, `http://localhost:3000`, `http://127.0.0.1:3000` |

## Pruebas

- `cd ia-servidor && npm test`: prueba de contrato sin red ni claves. Cubre sesión, CORS, multipart, límites, cuotas, errores, formato de respuesta, prompts, la cadena de modelos y la paridad con `prompts.php`.
- `npx playwright test tests/ia-mockup.spec.ts`: el ajuste automático en el editor real, con Deshacer, el interruptor y el botón. También comprueba que la solicitud de IA lleve las imágenes comprimidas y la configuración obligatoria; esa parte solo corre cuando el servidor de desarrollo se inició con `NEXT_PUBLIC_TONY_API_BASE`, como hace `playwright.config.ts` al arrancarlo.
- `npm run local -- --simulado` dentro de `ia-servidor/` levanta los mismos handlers en `http://127.0.0.1:8787`, sin modelo, para probar el flujo completo en local.

## Pendiente

- La generación real con Gemini solo se puede ver después del despliegue en Vercel; aquí se verificó con el modelo simulado.
- `backend/pedido-api/ai.php` (PHP) ya usa los nuevos prompts, pero no pasa `placementRules` al acabado. Si alguna vez se despliega el PHP, conviene pasarle `$extra` a `pedido_prompt_finalize`.
