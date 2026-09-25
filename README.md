# TONY SPORTSWEAR

Sitio público de TONY SPORTSWEAR, orientado a presentar la marca y preparar la solicitud de uniformes de un equipo completo. [Abrir la versión publicada en GitHub Pages](https://codyworksoporte-dot.github.io/TonySport/). La dirección combina verde bosque, escamas de lagarto en el entorno de la página, una campaña conceptual de gran formato y botones lima. El protagonismo del fútbol de Charly México y la presencia deportiva de Under Armour sirven como referencias para una experiencia propia de TONY. Las prendas empiezan con una base lisa; las escamas son una alternativa de diseño.

El proyecto está en fase de base visual y funcional. No es todavía una tienda preparada para producción. El catálogo nuevo, DTE, IVA, la decisión sobre pagos y el dominio propio siguen pendientes por indicación del usuario. El detalle está en [Alcance y pendientes](docs/ALCANCE-Y-PENDIENTES.md).

## Publicación

Cada cambio enviado a `main` compila una exportación estática mediante [GitHub Actions](.github/workflows/pages.yml) y la publica en GitHub Pages. En la configuración del repositorio, **Pages → Build and deployment → Source** debe estar en **GitHub Actions**. La exportación usa el prefijo `/TonySport` para que funcionen rutas y recursos en el sitio del proyecto. Para comprobarla antes de publicar:

```sh
TONY_GITHUB_PAGES=true npm run build
node scripts/prepare-pages.mjs
node scripts/preview-pages.mjs
```

La vista previa queda en `http://127.0.0.1:4173/TonySport/`. El carrito, los borradores y las solicitudes recientes se guardan en el navegador del cliente: esta publicación estática no crea cuentas ni confirma compras.

## Ejecutar localmente

Se necesita Node.js 22.9 o posterior y npm. El entorno de desarrollo de esta entrega usa Node.js 26.5.1; no se lo presenta como una versión LTS.

Desde la carpeta del proyecto:

```sh
npm install
npm run dev
```

Abrir [http://127.0.0.1:3000](http://127.0.0.1:3000). El servidor se limita a la máquina local. WampServer no ejecuta esta aplicación como PHP: Next.js necesita su propio proceso de Node.js.

Para comprobar tipos y compilar:

```sh
npm run typecheck
npm run build
```

Después de compilar, `npm start` sirve la compilación local en el mismo puerto. No hace falta configurar cuentas externas para recorrer esta primera versión.

## Rutas de esta fase

| Ruta | Función |
| --- | --- |
| `/` | Entrada del lagarto, campaña y ocho apartados numerados: proceso, tutorial, espacio del cliente, destinos Tony, marca, catálogo, redes y preguntas frecuentes. |
| `/producto` | Explorador de nueve líneas y las 13 categorías con 24 subcategorías verificadas en el menú oficial de Tony. |
| `/lineas` | Ruta conservada por compatibilidad para el explorador y sus enlaces anteriores. |
| `/carrito` | Diseños para cotizar, archivos y nóminas independientes del borrador; confirmación al borrar y elección de sucursal. |
| `/recientes` | Solicitudes propias del cliente guardadas en este navegador, ordenadas por fecha; compras confirmadas pendientes de integración. |
| `/resenas` | Espacio para reseñas autorizadas y formulario con borrador, validación y revisión antes de compartir manualmente con Tony. |
| `/calidad` | Guía interactiva de técnicas, telas publicadas, acabados y orientación de tallas. |
| `/tiendas` | Trece entradas del directorio oficial, búsqueda por ciudad/dirección, filtros por zona, teléfono y Maps. |
| `/entregas` | Proceso del pedido y consulta de entrega con selección explícita de sucursal y su contacto directo. |
| `/patrocinio` | Referencias de la publicación oficial y propuesta que se valida, revisa y comparte manualmente. |
| `/comunidad` | App Tony para Android/iOS, TonyPlay en desarrollo y acceso a la galería de responsabilidad social. |
| `/actualidad` | Guías de archivos, nómina y aprobación; estado del catálogo pendiente. |
| `/tony-news` | Publicaciones seleccionadas, canales de Instagram/TikTok/Facebook y accesos a Motorcycle y Cycling Pro. |
| `/configurador` | Pedido de equipo en cuatro pasos: Cantidad → Jugadores → Diseño → Revisión. |
| `/catalogo` | Estado de catálogo pendiente, sin inventario reconstruido ni productos ficticios. |
| `/nosotros` | Presentación de la marca con información procedente del brief. |
| `/contacto` | Acceso a los canales de contacto indicados en el brief. |

## Preparar el pedido de un equipo

1. **Cantidad:** elegir uniforme completo o solo camisa y definir de 6 a 999 prendas. Los porteros forman parte de esa cantidad.
2. **Jugadores:** completar una fila por prenda con nombre, talla, dorsal y rol. Los campos incompletos impiden avanzar y el foco lleva al primer error. Se puede asignar una talla a los espacios vacíos, revisar dorsales repetidos y cambiar la cantidad. Reducirla conserva las filas adicionales en el borrador; solo se incluyen las personas de la cantidad activa.
3. **Diseño:** crear una base Esencial, Franja o Escamas y aplicar imágenes propias, escudos y textos como capas sobre la camisa. Cada cara tiene sus elementos. Se pueden seleccionar, arrastrar, redimensionar, girar, ordenar, bloquear, ocultar, duplicar y eliminar; el editor permite deshacer y rehacer. Se pueden retirar las marcas Tony, los adornos, el patrón y los textos de la plantilla. La base inicial es Esencial, sin escamas. La lista de jugadores proporciona los nombres y dorsales reales de la vista previa.
4. **Revisión:** comprobar frente y espalda del diseño, elementos incluidos, técnica solicitada, nómina completa y distribución de tallas. Permite regresar para editar, descargar vistas PNG, archivos originales, resumen TXT o lista CSV para Excel y abrir una cotización en WhatsApp. Las listas extensas usan un mensaje breve que indica adjuntar el resumen completo.

El editor recorta las imágenes dentro de la silueta de la prenda. Cada capa tiene posición, ancho, alto, rotación y opacidad; admite conservar proporciones o ajustar ancho y alto por separado. Los controles numéricos y las flechas del teclado permiten editar sin arrastrar. Las capas ocultas quedan fuera del boceto exportado y de las indicaciones de diseño. El proyecto admite hasta 16 capas.

En Prenda se solicita una técnica —Full sublimado, Sublimado parcial, Estampado, Bordado o asesoría de Tony— y se registran molde, confección y tela. Cuello y manga cambian la ilustración. Las opciones son preferencias para cotizar; Tony confirma su compatibilidad y acabado real. Como alternativa, «Referencia plana» conserva una foto original de frente o espalda sin aplicarle las capas de la camisa.

«Descargar PNG» guarda la cara actual del editor con camiseta, calzoneta cuando corresponda y sus capas visibles, sin los controles de selección. En la revisión se descargan ambas caras por separado. El PNG se genera localmente con resolución doble; el modo de referencia exporta la imagen aportada. Es un boceto para compartir, no un archivo listo para producción.

La portada conserva los accesos para crear el uniforme; se retiraron los CTA repetidos al configurador del resto del sitio. El antiguo estudio de portada fue sustituido por `TutorialPreview`: una imagen referencial del editor y los temas del futuro video, sin reproducción simulada. La nómina se completa en el configurador; los dorsales ilustrativos de borradores antiguos no se convierten en jugadores reales.

Los datos del borrador, incluidos los ajustes de capas, se guardan en `localStorage`; las imágenes se conservan en IndexedDB, únicamente en ese navegador. Se admiten PNG, JPG y WebP de hasta 4 MB por archivo y 20 MB en el proyecto, con validación de carga. Si el almacenamiento no está disponible, la interfaz lo informa y permite continuar durante la sesión. Si una capa visible ha perdido su archivo, se debe recuperar la imagen o eliminar esa capa antes de revisar la solicitud. Borrar el borrador también elimina sus imágenes guardadas. No hay sincronización entre dispositivos y limpiar los datos del navegador puede eliminar la solicitud.

Abrir WhatsApp prepara el mensaje, pero no lo envía, no confirma un pedido ni reserva producción. Las imágenes se adjuntan manualmente en la conversación. La vista del editor es orientativa; TONY confirma diseño, tallas, confección, precio y entrega antes de producir.

Las tallas y preferencias de confección/tela usan el Anexo A del brief como referencia provisional. La revisión del sitio oficial corroboró algunas líneas y moldes, pero no todo ese configurador ni una tabla de medidas. Consultar [la auditoría de pedidos](docs/reference/PEDIDOS-TONY-2026-09-22.md) antes de convertir estas opciones en disponibilidad o condiciones comerciales.

No hay motor completo de precios, base de datos de pedidos, administración, generación con IA, facturación, cobro ni envío automático de correos. Estas funciones requieren una fase posterior con reglas y datos confirmados.

## Base técnica

La navegación principal es Inicio, Producto, Somos Tony, Para ti y Tony News. Producto reúne el explorador que antes estaba en Inicio y todos los apartados del menú oficial; Somos Tony concentra empresa/comunidad y Para ti reúne tiendas, entregas, contacto y servicios al cliente. La portada identifica sus apartados del 01 al 08. Los pasos explicativos son contenido estático; las flechas de navegación corresponden a enlaces reales. Se conservaron los menús sin subrayados animados.

El paso Revisión permite añadir una copia del diseño al carrito. IndexedDB conserva hasta seis diseños con sus imágenes y nóminas; borrar el borrador del editor no los elimina. El carrito requiere confirmar cada eliminación, conserva los datos si falla el almacenamiento y muestra el lagarto después de confirmar el borrado. Recientes muestra solo las solicitudes del navegador del cliente, no compras públicas ni pagos ficticios. Ver [Carrito local](docs/CARRITO-LOCAL.md).

Reseñas empieza vacío hasta incorporar experiencias reales autorizadas. Su formulario guarda un borrador local y permite revisarlo antes de compartirlo manualmente por WhatsApp; no publica ni envía automáticamente. Los seguidores muestran cifras públicas comprobadas el 23/09/2026 y actualización manual; [fuentes y precisión](docs/reference/SEGUIDORES-TONY-2026-09-23.md).

Entregas exige elegir una sucursal antes de preparar WhatsApp; muestra el destino y usa el teléfono de esa tienda, sin asignar el contacto central por defecto. Cambiar la sucursal, zona o destino requiere preparar de nuevo la consulta. Patrocinio valida teléfono o correo, enfoca los errores y permite revisar, editar y copiar con estados de carga, éxito o fallo. Las superficies de formulario usan transparencias y relieve discreto, con foco visible y movimiento reducido.

Tony News utiliza las cuentas de `lib/social-news.ts`. Presenta un reel de Instagram sobre Lourdes identificado como archivo y un perfil oficial de TikTok que se carga al solicitarlo, con acceso a la publicación o plataforma original. Facebook conserva el enlace al canal; su primer video exacto queda pendiente porque la plataforma restringió la consulta sin iniciar sesión. No existe una API de sincronización automática de publicaciones. Las inserciones incluyen estados de carga, alternativa y reintento. TonyPlay se presenta como un juego en desarrollo, sin fecha de lanzamiento ni acceso de juego ficticio.

El contenido nuevo se contrastó con las publicaciones de Tony: [fuentes de secciones](docs/reference/SECCIONES-TONY-2026-09-22.md). El directorio está en `data/tony-stores.json`; sus trece entradas no constituyen una afirmación del total de sucursales vigentes. Horarios, disponibilidad y condiciones se consultan con cada tienda. Los clubes se atribuyen a la publicación sin asignarles una temporada actual.

- Next.js 16.3.6 con App Router y TypeScript.
- React y React DOM 19.3.0.
- Fuentes Barlow Condensed y Archivo instaladas como paquetes locales.
- Componentes visuales reutilizables e ilustración original del uniforme en SVG.
- Textura de escamas grafito generada por `lib/scale-pattern.ts` (`node scripts/generate-scales.mjs`): la base `public/assets/escamas-tony-base.svg` y la capa `escamas-tony-uniones.svg`, que contiene solo las uniones, salen de la misma geometría para que el brillo naranja coincida con las juntas. `node scripts/rasterize-scales.mjs` dibuja después la base a 2× en `escamas-tony-base.webp` (1280 px, 77 KB), que es la que usan los fondos: repetir una imagen cuesta a la GPU mucho menos que repetir en cada mosaico los 633 trazos con degradado del SVG, y el scroll de la portada pasó de perder 13–32 % de fotogramas a ~3 %. También genera `escamas-tony-brasa.webp`, las escamas con las uniones encendidas que aparecen detrás de Tony al cambiar de apartado.
- Logo PNG transparente derivado del original, conservando nombre, colores y ojo; se muestra completo, sin el corte rectangular del fondo. Procedencia y límites en [Recursos de marca](docs/reference/BRAND-ASSETS-2026-09-22.md).
- Entrada SVG por capas con escudo ajustado a la referencia Tony, wordmark transparente (`tony-wordmark.webp`, recorte de 54 KB del mismo PNG; las garras quedan a los lados sin tapar letras) y rasgado más visible. El respaldo de texto SVG permanece si la imagen falla. Un arranque síncrono cubre la portada desde el primer pintado mientras se prepara la intro; incluye salida de seguridad y mantiene el contenido accesible sin JavaScript.
- La intro se inicia automáticamente en la portada una vez por sesión. Tocar el logo desde cualquier página la abre antes de navegar a Inicio. Permite saltar, cerrar con Escape o repetir; con movimiento reducido se omite. Solo la cabeza de esa intro se ha adaptado a la nueva referencia; el wordmark del header sigue igual.
- Los títulos editoriales entran letra a letra (cada letra sube a su sitio, solo con transform y opacity); en el titular principal se dibuja un trazo de garra bajo la palabra destacada. Tras un cambio de apartado esperan a que se abran las escamas. Los lectores de pantalla reciben el título completo. Los botones comparten un mismo lenguaje: esquinas biseladas como el logotipo, brillo que cruza en hover y flecha que sale y vuelve (`components/buttons.css`). Cerca del cursor se encienden en naranja las uniones reales entre escamas; sin cursor, una luz lenta recorre ocasionalmente algunas juntas. Cada clic o toque confirmado deja un rasguño fino de 340 ms, nunca sobre campos ni al arrastrar. Ya no hay lagarto agarrado al borde de la página. Cada 5,5 s sin clics, toques, scroll ni teclado, Tony asoma por el borde inferior con las garras sobre el filo, donde menos contenido tapa, mira al visitante y se esconde en cuanto hay interacción (`components/TonyPeek.tsx`). Al cambiar de apartado, las escamas aparecen con un anillo de luz que sale del enlace pulsado, Tony se acerca sujetando el escudo con el logotipo completo (TONY y SPORTSWEAR), guiña y deja pasar (`components/RouteTransition.tsx`). Todo lo que se mueve es transform u opacity, así que la GPU mantiene los fotogramas aunque la página nueva se esté pintando debajo; al cargar, la capa se prepara y se dibuja una vez al 1 % para que el primer cambio tampoco dé tirones. Todas las apariciones usan la cabeza y la garra vectorizadas del logo de referencia (`public/assets/tony-head.svg`, `public/assets/tony-claw.svg`, componentes en `components/TonyArt.tsx`); solo los párpados van aparte, cada uno en su propia capa, para que parpadear y guiñar no obligue a repintar la cabeza. Ajustes en `lib/ambient-config.ts` y lógica en `lib/ambient-runtime.ts`. Nada de esto aparece en las páginas del pedido; los efectos tienen pausa persistente y respetan movimiento reducido.
- Imágenes de campaña generadas e identificadas como bocetos; no representan inventario real.

Las versiones exactas y los comandos disponibles se consultan en [package.json](package.json). `npm run test:e2e` ejecuta la suite de navegador con Playwright y Microsoft Edge instalado en esta máquina. Para otro entorno, adaptar `channel` en `playwright.config.ts` e instalar el navegador correspondiente. La suite inicia el servidor local si no está activo.

La revisión realizada está documentada en [Verificación local](docs/VERIFICACION.md). `node scripts/review-refinements.cjs` genera las capturas `docs/revision-*.png` del tutorial, bandera del pie y páginas revisadas, con el servidor local activo. `node scripts/review-v2.cjs` recorre la portada, incluido `#tutorial`. La marca y el rasgado se documentan en [Recursos de marca](docs/reference/BRAND-ASSETS-2026-09-22.md).

`node scripts/review-order.cjs` recorre el pedido completo. `node scripts/review-studio.cjs` prepara una muestra local con seis jugadores, escudo y textos, y genera las capturas del editor por capas y su revisión en escritorio y móvil. Estos recorridos no envían pedidos ni mensajes.

`node scripts/review-sections.cjs` captura la portada ampliada, el explorador y la navegación en escritorio y móvil en `docs/sections-*.png`.

## Organización y cambios

`app/` contiene las páginas y estilos; `components/`, las piezas compartidas, el listado de jugadores, el editor por capas y su lienzo SVG; `lib/order.ts`, el modelo, validación, migración y exportación de datos del pedido; `lib/studio.ts`, tipos y normalización de capas, elementos y técnicas; `lib/order-assets.ts`, el almacenamiento local de imágenes; `public/assets/`, los recursos visuales; y `docs/`, el alcance, la dirección de diseño y la evidencia de referencia.

Antes de ampliar el configurador o activar comercio, revisar [Alcance y pendientes](docs/ALCANCE-Y-PENDIENTES.md). Para conservar la identidad visual, consultar [Dirección visual](docs/DIRECCION-VISUAL.md). No convertir datos del brief en promesas de precio, disponibilidad, entrega o rendimiento sin validarlos con TONY.

Las modificaciones de código deben pasar la comprobación de tipos y la compilación. Los cambios de interacción también necesitan revisión en teclado y en tamaños de pantalla móvil y escritorio. La preparación para publicar incluye validaciones adicionales todavía pendientes; una compilación correcta no equivale a aceptación de producción.
