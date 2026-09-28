Eres un desarrollador senior trabajando en el repositorio Next.js "TonySportWeb" (C:\wamp64\www\TonySportWeb). Lee primero AGENTS.md: este proyecto usa Next 16.3 con cambios respecto a versiones anteriores. Consulta node_modules/next/dist/docs antes de usar cualquier API de Next.

OBJETIVO
Reemplazar el flujo "Crea tu uniforme / Crea tu pedido" (ruta /configurador) por el configurador oficial del cliente, que está publicado en https://tonysportselsalvador.com/mockup-prueba/?v=58 (versión V279).
Integrar también todo lo que falta para que funcione de verdad:
- generación de mockup con IA, borrador mágico y acabado final con IA;
- envío del pedido al Panel Tony;
- pago del anticipo del 50 % con Wompi;
- transferencia bancaria con comprobante;
- entrega con mapa;
- firma digital;
- descargas finales.
Lo pidió el cliente: el flujo, los textos, las opciones y los precios deben quedar idénticos al V279.

FUENTES (solo lectura)
- "lo que faltaba/index (4).html": copia exacta de la página en vivo (V279). Es la fuente de verdad de pasos, textos, opciones, precios, catálogo TONY-001 a TONY-070, validaciones y comportamiento. Pesa 21 MB porque lleva las imágenes en base64.
- "lo que faltaba/*.php": el backend actual.
  - IA: generate.php, magic_eraser.php, finalize.php.
  - Envío al panel: tony-submit-order.php.
  - Pagos: wompi-config.php, wompi-crear-pago.php, wompi-verificar.php, wompi-webhook.php, wompi-retorno.php y wompi-recuperar-pago.php.
  - Clave de Gemini: config.php.
- "lo que faltaba/fm-selection-*.zip": contiene registros reales de pagos, con datos de clientes. No lo descomprimas dentro del repo, no lo copies, no lo uses como datos de prueba y no muestres su contenido.

REGLA 0: SECRETOS (antes que nada)
- Los PHP traen claves en texto plano: Gemini, el client secret de Wompi, el token del webhook y el X-Tony-Token del Panel Tony. Nunca las copies a código, commits, logs, el bundle del navegador ni a tus respuestas.
- Todas las claves se leen de variables de entorno del servidor (getenv) o de un archivo de configuración fuera de public_html.
- Elimina los valores por defecto escritos en el código, por ejemplo el `?: '...'` del client secret de Wompi.
- Entrega un config.example.php y un .env.example con los nombres de las variables y los valores vacíos.
- "lo que faltaba/" ya está en .gitignore y no se saca de ahí.
- Antes de cada commit revisa `git diff --cached`. No puede entrar ninguna clave, ningún JSON de wompi_data ni el zip.
- El repo se publica en GitHub Pages: nada privado puede terminar en public/ ni en out/.

REGLA 1: NO TOCAR LO QUE YA ESTÁ TRABAJADO (animaciones y diseño)
No modifiques, reformatees ni "mejores" estos archivos:
- Ambiente del sitio: components/AmbientExperience.tsx, components/ambient-experience.css, lib/ambient-runtime.ts, lib/ambient-config.ts.
- Transición entre apartados con el guiño de Tony: components/RouteTransition.tsx, components/route-transition.css.
- Arte y mascotas: components/TonyArt.tsx, tony-art.css, TonyPeek.tsx, tony-peek.css, TonyMascot.tsx, tony-mascot.css.
- Intro: components/LagartoIntro.tsx, LagartoIntroBootstrap.tsx, lagarto-intro.css.
- Textos y botones: components/RevealText.tsx, reveal-text.css, HomeExperience.tsx, components/buttons.css.
- Textura de escamas y su generación: lib/scale-pattern.ts, lib/tony-art.ts, scripts/generate-scales.mjs, scripts/rasterize-scales.mjs.
- Imágenes de marca en public/assets: escamas-tony-* (svg y webp), tony-head.svg, tony-claw.svg, tony-wordmark.webp.
- El header, el footer, la portada y las demás páginas conservan su contenido y su diseño. Los enlaces "Crea tu uniforme" siguen apuntando a /configurador.
- AMBIENT.quietRoutes sigue incluyendo /configurador y /carrito: no hay lagarto ni brillo encima del pedido.
- tests/motion.spec.ts y tests/intro.spec.ts no se editan y deben seguir pasando.
Si algo del configurador choca con esto, adapta el configurador, no lo anterior. Si no hay forma de hacerlo, detente y pregunta.

QUÉ CONSTRUIR: /configurador = el configurador V279, nativo en Next (no un iframe)

1. Integración con el sitio
- Porta la página a componentes React con TypeScript, dentro de app/configurador y de una carpeta propia (por ejemplo components/pedido/).
- Usa el header y el footer del sitio, sus tipografías, sus colores, sus botones (buttons.css) y su textura de escamas, para que se vea parte del sitio.
- El flujo, los textos, las opciones, los precios y el comportamiento deben ser idénticos al V279. No inventes precios, textos, promociones ni diseños.
- El V279 acumula parches (tiene 102 scripts). Si algo es ambiguo o contradictorio, usa el comportamiento final que se ve en la página en vivo y anota la decisión.

2. Pasos, en este orden
  1. Portada "Crea tus uniformes o camisas" con el botón CREAR MI PEDIDO.
  2. Producto: Uniformes Full Sublimados a $12.99 c/u o Camisas Full Sublimadas a $7.99 c/u.
  3. Línea: Hombre o Mujer.
  4. Configuración: molde, tela, cuello, manga y marca deportiva, cada uno con sus recargos. Incluye las ventanas "Saber más" de telas, moldes, cuellos, y logos y marcas.
  5. Jugadores y tallas: jugadores de campo, portero, dorsales y recargos por 2XL, 3XL y 4XL.
  6. Asesora Tony con voz, con las opciones "No quiero asesor" y silenciar.
  7. Medias a $1.25 el par, por color.
  8. Diseño:
     - catálogo TONY-001 a TONY-070;
     - mockup con IA a partir de una imagen del cliente;
     - editor frontal y dorsal con escudo, marca deportiva, texto, patrocinador y borrador mágico;
     - encuadre rápido.
  9. Mockup profesional final con IA y aprobación del cliente.
  10. Resumen del pedido.
  11. Entrega: retiro en tienda ($0) o envío a domicilio (+$6.00), con ubicación actual o mapa Leaflet/OpenStreetMap.
  12. Pago: Wompi (tarjeta, QuickPay o Nequi) o transferencia bancaria con comprobante obligatorio.
  13. Aceptación de términos y firma digital.
  14. Confirmación con descargas (orden de producción, orden de pago, y diseño final frontal y dorsal), seguimiento y "Nuevo pedido".
  Durante todo el flujo, el botón de ayuda por WhatsApp.

3. Precios
- Porta la función calc() del V279 tal cual:
  - precio base por cantidad;
  - recargos por camisa;
  - tallas extra;
  - $5 de diseño si no se usa el catálogo;
  - $5 por patrocinador;
  - cargos de logo y marca;
  - acabado 3D a $1.75 por camisa;
  - medias;
  - portero gratis desde 12 uniformes;
  - descuento de −$0.50 por uniforme con marca Tony;
  - envío.
- Ponla en un solo módulo compartido (por ejemplo lib/pedido/pricing.ts con una tabla de precios en JSON). Úsala en el navegador y también en el servidor.
- Anticipo: 50 % del total. Saldo: contra entrega.

4. Imágenes
- El HTML trae unos 20 MB de imágenes en base64: productos, catálogo y guías.
- Extráelas a archivos WebP optimizados en public/assets/pedido/.
- El catálogo lleva miniaturas ligeras y carga diferida.
- Prohibido dejar base64 gigantes dentro de los componentes.

5. Panel y datos en el navegador
- El "Panel Tony" (DEMO LOCAL) del V279 no va en el sitio público.
- No se guardan pedidos completos en localStorage: el V279 guarda tony_v3_orders con DUI y firma.
- En el navegador se guarda solo el borrador en curso y, de los pedidos enviados, el número y el estado para el seguimiento.

6. Carrito, recientes y reseñas
- No los borres.
- Si el nuevo flujo los deja sin sentido o rompe su lógica, detente y propón qué hacer antes de cambiarlos.

BACKEND PHP (lo que faltaba)

Hosting
- El sitio Next se exporta como estático para GitHub Pages, con basePath /TonySport (ver next.config.ts). Ahí no corre PHP.
- Los PHP van al hosting PHP de tonysportselsalvador.com, en una carpeta propia (por ejemplo /pedido-api/).
- El front los llama con una URL configurable: NEXT_PUBLIC_TONY_API_BASE.
- Si el hosting final es otro, no lo decidas tú: deja todo configurable y pregunta.

Corrige estos puntos al portar:
- CORS: usa una lista exacta de orígenes permitidos (dominio oficial con y sin www, el dominio de GitHub Pages y 127.0.0.1:3000 para desarrollo).
- tony-submit-order.php: hoy compara el origen con stripos, y eso se puede burlar. Usa comparación exacta.
- wompi-crear-pago.php: hoy confía en el monto que manda el navegador.
  - El servidor debe recalcular el total y el anticipo con la misma tabla de precios, a partir de las selecciones del pedido.
  - Si el monto no coincide, rechaza la petición.
- wompi-webhook.php: hoy acepta el aviso aunque no llegue la cabecera del hash. Exige siempre un hash HMAC válido, además del token y de la verificación por API que ya tiene.
- wompi-retorno.php: usa window.opener.postMessage con su propio origen, y eso no funciona si el front está en otro dominio. Debe redirigir a FRONTEND_URL/configurador?wompi_order=REFERENCIA, y el front verifica con wompi-verificar.php (el V279 ya soporta ?wompi_order=).
- wompi-recuperar-pago.php: es una herramienta manual con un pedido fijo en el código. No se publica. Si hace falta, queda detrás de autenticación de administrador.
- wompi_data/: fuera de public_html o bloqueada con .htaccess. Ningún JSON de ejemplo en el repo.
- generate.php, magic_eraser.php y finalize.php:
  - misma lógica, mismos prompts y mismos modelos (gemini-3-pro-image, con respaldo gemini-3.1-flash-image);
  - clave leída del entorno;
  - límite de tamaño y de tipos de archivo (JPG, PNG, WEBP);
  - límite de peticiones por IP y por sesión, para que nadie agote la cuota de Gemini;
  - los mismos mensajes amables de reintento que hoy.
- tony-submit-order.php: el token del Panel Tony se lee del entorno. Mantén el límite de 24 MB y el de reenvío.

PAGOS: REGLAS PARA PROBAR
- No generes enlaces de pago reales ni hagas cobros.
- Para probar usa un modo simulado (mock de la API de Wompi con respuestas grabadas) o las credenciales de prueba que te dé el dueño.
- Las pruebas automáticas nunca apuntan al Wompi productivo ni al Panel Tony real.
- La transferencia bancaria muestra exactamente las cuentas del V279 (no inventes ni cambies números) y exige comprobante.

CALIDAD
- Build:
  - `npm run typecheck` sin errores;
  - `npm run build` correcto;
  - exportación estática correcta (TONY_GITHUB_PAGES=true);
  - rutas y assets respetan basePath con siteAsset().
- Accesibilidad:
  - todo usable con teclado, con etiquetas en cada campo, foco visible y errores anunciados;
  - sin barreras en las pruebas axe que ya existen.
- Móvil:
  - sin desplazamiento horizontal a 320, 390 y 1440 px;
  - el editor y la firma se pueden usar con el dedo.
- Rendimiento: el cliente revisa en una laptop con gráfica integrada Radeon Vega 8.
  - Las animaciones del configurador usan solo transform y opacity.
  - Nada de blur animado ni máscaras a pantalla completa.
  - El catálogo, Leaflet y el editor se cargan de forma diferida.
- Movimiento: respeta prefers-reduced-motion y el botón "Pausar efectos" del sitio.
- Datos personales (nombre, DUI, teléfono, dirección, ubicación, firma y comprobante):
  - solo viajan por HTTPS hacia los PHP;
  - nunca se escriben en la consola ni en logs.
- Pruebas Playwright:
  - Reemplaza configurator.spec.ts, editor.spec.ts y las partes de cart, refinements, sections y site que dependan del configurador viejo.
  - Las pruebas nuevas cubren el flujo nuevo: precios de ejemplo calculados a mano, validaciones, entrega, pago simulado aprobado y rechazado, firma y descargas.
  - motion.spec.ts e intro.spec.ts quedan sin cambios y en verde.
  - Corre la suite completa.

FORMA DE TRABAJO
1. Primero lee todo y entrégame un plan corto que incluya:
   - la estructura de archivos;
   - qué se porta tal cual;
   - qué se corrige y por qué;
   - las preguntas abiertas.
   No escribas código hasta que lo apruebe.
2. Trabaja en una rama nueva, con commits pequeños y claros. No hagas push ni publiques nada sin mi OK.
3. Al final entrégame:
   - un resumen de lo hecho;
   - la lista de variables de entorno que hay que configurar en el hosting;
   - los pasos para subir los PHP;
   - los resultados de typecheck, build y pruebas;
   - capturas del flujo a 390 y 1440 px;
   - cualquier diferencia con el V279 que no pudiste evitar.
