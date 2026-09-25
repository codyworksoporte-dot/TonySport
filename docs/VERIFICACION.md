# Verificación local — 23/09/2026

## Revisión actual: Producto, cliente, carrito y movimiento

Se aprobaron **65 casos únicos** de la suite completa en Microsoft Edge/Chromium, ejecutados por grupos: sitio 4, secciones 10, ajustes 3, Tony News 4, intro 5, contenido de cliente 3, carrito 8, movimiento 6, configurador 9 y editor 13. Los casos afectados por los últimos ajustes se repitieron: carrito completo tras optimizar su contador, movimiento con reloj detenido para medir el umbral de reposo y reseña preparada con Axe. La compilación final `npm run build` y su comprobación TypeScript terminaron correctamente, con 21 entradas estáticas generadas.

- Producto conserva las 13 categorías y 24 subcategorías verificadas en el menú oficial, además del explorador retirado de Inicio. Menús Producto, Somos Tony y Para ti, búsqueda, fragmentos, Atrás, teclado y Escape probados. `/lineas` mantiene compatibilidad.
- Inicio tiene ocho apartados consecutivos. Los enlaces del héroe apuntan a Producto y al proceso real. Se conserva el tutorial referencial, sin reproductor ficticio.
- El carrito conserva diseño, técnica, nómina e imágenes después de recargar y de borrar el borrador del editor. Se verificaron copia exacta sin duplicados, contador, frente/espalda y exportación de un PNG con los píxeles del archivo subido. Su contador no necesita cargar las imágenes durante la navegación.
- Escape y cancelar mantienen el diseño. Confirmar lo borra, reproduce la mordida y actualiza Recientes; el borrador del editor se conserva. Un fallo simulado de cuota informa el error y deja intactas las entradas anteriores.
- Cotizar exige seleccionar sucursal; se comprobó el número de Santa Ana y los detalles en WhatsApp/TXT. No se enviaron mensajes, pedidos ni pagos.
- Recientes contiene las solicitudes propias del navegador; otro contexto de cliente no accede a ellas. Cantidad, técnica, tallas y enlace al diseño completo probados. No se muestran solicitudes como compras confirmadas.
- Reseñas valida campos y valoración, enfoca el primer error, restaura el borrador, permite revisar/editar y prepara compartir manualmente. Fallos de almacenamiento y portapapeles conservan una salida útil. No hay reseñas ni promedios ficticios.
- La nueva cabeza se aplica únicamente a la intro. Primer pintado, sesión, salto, Escape y respaldo del wordmark siguen aprobados. El logo abre la intro antes de navegar a Inicio.
- Revisión de mascota, escamas e interacción (23/09/2026; el lagarto del borde se retiró el 24/09 a pedido del usuario): Tony se oculta sobre la imagen de campaña, se agarra al borde derecho al desplazarse, se asoma a los 12 s sin actividad y vuelve al agarre con cualquier interacción; se aparta con el buscador abierto y regresa al cerrarlo. Durante un scroll continuo la cabeza se inclina hasta ~1,3° y vuelve al reposo sin rebote; las garras se mueven 0 px. Solo existe una mascota en el DOM. El carrito usa el mismo personaje para la mordida.
- La base de escamas y la capa de uniones comparten firma de geometría (570 escamas, 1710 uniones, mosaico de 640 px); el brillo queda anclado al origen del documento tras desplazarse y redimensionar. A 3× las líneas naranjas caen en el centro de las juntas y el relleno de las escamas no se ilumina. Rasguño: un clic genera una sola animación de 340 ms; ráfagas de clics nunca superan cuatro simultáneas y no quedan restos; arrastrar, clic derecho y campos de texto no lo generan; la navegación interna no duplica listeners.
- Fluidez, transición y lagarto del borde retirado (24/09/2026). Medido con trazas de Chrome en la GPU del equipo de trabajo (Edge, Radeon Vega 8, 1440 × 900), contando fotogramas presentados frente a perdidos:
  - Cambio de apartado: antes se perdían 91–94 fotogramas por cambio (~60 %) porque el panel de escamas se recortaba con un círculo animado, llevaba una máscara a pantalla completa y Tony tenía una sombra difuminada, todo repintado en cada fotograma. Ahora solo se animan transform y opacity: 1–3 fotogramas perdidos por cambio en desarrollo y 1–2 en producción. El primer cambio con el navegador recién abierto pasó de 57–74 perdidos (~50 %) a 11–15 de ~115, gracias a la preparación de la capa al cargar.
  - Scroll de la portada: de 13–32 % de fotogramas perdidos a ~3 %. La causa principal era la textura de escamas en SVG (633 trazos con degradado repetidos en cada mosaico); ahora es un WebP de 77 KB a 2×. También se quitaron el desenfoque por letra de los títulos y el lagarto del borde con sus cálculos en cada scroll. La primera pasada tras abrir el navegador sigue siendo más lenta mientras la GPU prepara sus recursos, una sola vez.
  - El escudo de la transición muestra TONY y SPORTSWEAR completos y las garras sujetan los lados sin tapar letras. Lo mismo en la intro y en el emblema de la portada, que además ya no cae al texto de respaldo cuando la imagen llega antes de hidratar. El guiño cierra el ojo derecho.
  - No existe lagarto aferrado al borde en ninguna vista (escritorio, iPad, 390 y 320 px). El que asoma por abajo sigue apareciendo cada 5,5 s sin interacción y la mordida del carrito se conserva.
  - 68/68 pruebas Playwright, `tsc` y `next build` correctos, y 0 px de desbordamiento horizontal en las 17 rutas a 320, 390 y 1440 px.
  - Capturas: `docs/transicion-escudo-v7.png`, `docs/guino-v7.png`, `docs/intro-escudo-v7.png`, `docs/emblema-portada-v7.png`, `docs/transicion-movil-v7.png`.
- Arte vectorizado del logo (24/09/2026): cabeza, garras y párpados de todas las apariciones salen de la referencia. El lagarto que asoma por abajo aparece a los 5,5 s sin interacción, mover el ratón no lo espanta, se esconde con clic o scroll y vuelve tras otros 5,5 s de calma; también en 390 px. 70/70 pruebas Playwright, compilación de producción correcta y 0 px de desbordamiento horizontal en 17 rutas a 320, 390 y 1440 px. Capturas: `docs/asomo-inferior-v6.png`, `docs/transicion-guino-v6.png`, `docs/intro-escudo-v6.png`, `docs/borde-derecho-v6.png`.
- Revisión anterior de lagartos y animaciones (24/09/2026, sustituida por la anterior): el caminante aparece tras 1,5 s sin clics, toques, scroll ni teclado; mover el ratón no lo espanta; frena con las cuatro patas apoyadas, mira al visitante y huye con un clic o con el scroll, y vuelve tras otro 1,5 s de calma. En móvil (390 px) elige el tramo del borde inferior que menos contenido tapa y huye al tocar. El lagarto del borde sube 117 px con el cursor 120 px por debajo, se esconde al tenerlo encima y regresa al alejarlo. La transición entre apartados sigue la secuencia cubrir → guiñar → revelar sin capturar clics; el logo abre la intro en su lugar. La intro muestra la cara frontal sobre el escudo con los ojos cerrados que se abren al asentarse. Capturas: `docs/transicion-guino-v5.png`, `docs/intro-escudo-v5.png`, `docs/botones-v5.png`.
- Rendimiento (Edge, 1440 px, puntero en movimiento y scroll continuo): p95 de 16,7 ms por fotograma y máximo de 16,8 ms con efectos; el conjunto añade ~0,34 s de hilo principal en 4,5 s de interacción. El brillo solo usa transform y opacity.
- Sin desbordamiento horizontal en las 17 rutas a 320, 390, 1100 y 1440 px. `npm run typecheck`, `npm run build` y la suite completa de Playwright pasan (68 pruebas desde el 24/09; eran 70 antes de retirar el lagarto del borde).
- Se revisaron 320, 390, 768 y 1440 px en las páginas del cliente y el carrito con datos; Producto incluye además 1200 px. Sin desbordamiento horizontal. El control de efectos queda al pie en móvil y los identificadores de redes no se cortan en columnas estrechas.
- Axe no detectó infracciones de las reglas WCAG A/AA seleccionadas en las rutas y estados probados, incluido el carrito con datos, confirmación de borrado y reseña preparada. Esto es una verificación automática, no una auditoría manual completa de tecnologías de asistencia.

Capturas y recorrido reproducible: `scripts/review-customer-v3.cjs`, `docs/v3-*.png`, `docs/v3-*-populated-*.jpg`, `docs/v3-visual-checks.json`, `docs/producto-*.png`, `docs/intro-face-v3.png`, `docs/creature-glance-v3.png`, `docs/scale-glow-v3.png`, `docs/mascota-v4-estados.png`, `docs/escamas-uniones-v4.png`, `docs/rasguno-v4.png`, `docs/carrito-mordida-v4.png` y `docs/portada-grafito-v4.png`. Las capturas con equipo de muestra usan un contexto local de pruebas, sin registros públicos ni datos del cliente real.

Fuentes nuevas: [Producto](reference/PRODUCTOS-TONY-2026-09-23.md) y [seguidores](reference/SEGUIDORES-TONY-2026-09-23.md). Las cifras sociales son públicas, fechadas y de actualización manual. Compras confirmadas requieren integración comercial; reseñas públicas requieren contenido real autorizado. Catálogo, video tutorial, DTE/IVA, pasarela, dominio y publicación mantienen sus pendientes.

## Revisión anterior: limpieza, marca, tutorial y Tony News

Se aprobaron **29 casos únicos afectados o de regresión** en Edge/Chromium, ejecutados por grupos: cuatro del sitio, cinco de la intro, nueve de secciones, tres de ajustes, cuatro de Tony News y cuatro del pedido/editor. Los otros 18 casos del editor y pedido conservan su verificación histórica; no se repitieron en esta revisión porque su implementación no cambió. La suite disponible ahora reúne 47 casos.

`npm run typecheck` y la compilación final `npm run build` terminaron sin errores. Next.js generó las 17 entradas estáticas previstas, incluida `/tony-news`.

- Inicio tiene siete apartados numerados desde el explorador de líneas. Los pasos del proceso son informativos, sin flechas que aparenten enlaces. El tutorial es una imagen referencial del editor y no contiene botones de reproducción, formularios ni un video ficticio.
- El menú de escritorio y móvil no incluye Líneas; conserva Universo Tony y añade Tony News. Se probaron apertura por teclado, Escape, foco, búsqueda con/sin resultados y recuperación. El explorador continúa accesible desde Inicio, búsqueda y pie, con fragmentos e historial funcionales.
- Ninguna de las once páginas internas de contenido ni su búsqueda repite enlaces al configurador. Se retiró la invitación global fuera de Inicio; TonyPlay se identifica como un juego en desarrollo.
- Entregas empieza sin sucursal. El error enfoca el selector; elegir zona filtra tiendas. Se verificaron números diferentes para San Miguel y Usulután, el destino incluido en el mensaje y la invalidación de la consulta al cambiar datos. La sección 03 ya no existe. No se enviaron consultas.
- Patrocinio rechaza un contacto inválido y conserva los datos al editar. Copiar informa un permiso denegado y permite recuperarse; la revisión y los enlaces de WhatsApp/correo permanecen disponibles.
- La intro sigue cubriendo el primer pintado cuando se retiene JavaScript. Sesión, repetición, Escape, salto móvil y movimiento reducido siguen funcionando. Si falla el PNG del escudo, el nombre Tony permanece mediante SVG.
- Tony News verifica las tres cuentas dadas por el usuario, la publicación original, carga solo después del clic, bloqueo, timeout y reintento. TikTok rechaza señales de origen, ventana o identificador incorrectos; un documento de error no se revela como contenido. Las respuestas controladas prueban nuestra interfaz, no la disponibilidad permanente de esas plataformas.
- Axe no detectó infracciones de las reglas WCAG A/AA seleccionadas en las 13 rutas de contenido/sitio ni en los pasos comprobados del editor. Las páginas nuevas y modificadas caben a 320 y 390 px; las cinco rutas previas mantienen además 768 y 1440 px. Se corrigió el ancho mínimo de la tarjeta TikTok a 320 px y se repitió esa revisión.
- Se verificó de nuevo el recorrido de seis jugadores hasta el editor, la revisión, el borrador de WhatsApp y el CSV, además del foco y accesibilidad de los pasos y el recorrido completo a 320 y 390 px.

La revisión visual conserva capturas en `docs/revision-*.png`, realizadas con `node scripts/review-refinements.cjs`, sin errores JavaScript. Incluyen tutorial, bandera horizontal, entregas con sucursal elegida, TonyPlay, Actualidad y Tony News en escritorio/móvil. Las capturas de marca y rasgado están en `docs/brand-refinement.png`, `docs/intro-rip-refinement.png` y `docs/intro-mascot-refinement.png`. La imagen referencial del tutorial procede de una captura local del editor con datos de muestra.

Las inserciones públicas se comprobaron también en Edge real: Instagram mostró el reproductor del reel; TikTok respondió de forma variable (vista inicializada o bloqueo externo), contemplado en la interfaz. Facebook requiere sesión para acceder a más contenido y no se encontró un video público verificable. No hay sincronización API automática de las redes. Fuentes y límites: [Tony News](reference/TONY-NEWS-2026-09-22.md) y [Recursos de marca](reference/BRAND-ASSETS-2026-09-22.md).

Catálogo, DTE/IVA, cobro, dominio y publicación siguen pendientes. El video tutorial se incorporará cuando lo proporcione el usuario.

## Revisión anterior: navegación, líneas y secciones de Tony

Se completaron **39 casos únicos de navegador**: los 30 del pedido, editor, sitio e intro y nueve nuevos para las secciones. Se ejecutó la suite completa y se repitieron las comprobaciones afectadas tras ajustar el contraste y la expectativa de búsqueda por dirección. Los nueve casos nuevos quedaron aprobados; la última pasada de accesibilidad, enlaces y errores de las siete rutas terminó en 1,1 minutos.

`npm run typecheck` y la compilación final `npm run build` terminaron sin errores. Next.js generó correctamente las 16 entradas estáticas previstas en la compilación, incluidos los recursos y rutas auxiliares.

- Siete rutas nuevas responden correctamente: `/lineas`, `/calidad`, `/tiendas`, `/entregas`, `/patrocinio`, `/comunidad` y `/actualidad`. Sus destinos internos se verificaron por HTTP. Axe no detectó infracciones WCAG A/AA en las siete; esta comprobación automática no sustituye una auditoría completa con tecnologías de asistencia.
- Explorador de nueve líneas: selección inicial por fragmento, recarga, navegación con flechas/Home/End, foco y contenido asociado. Fútbol conduce al configurador y las otras líneas preparan una consulta específica sin enviarla.
- Menús, búsqueda y pie cambian la línea cuando el usuario ya está en `/lineas`. Los enlaces nativos actualizan la vista y permiten volver con Atrás. La navegación con teclado cierra con Escape y restaura el foco.
- Directorio de trece entradas: búsqueda sin tildes y por dirección, filtros combinados, estado vacío y recuperación. Se compararon teléfono, Maps y texto de consulta de una tienda con sus datos. «San Miguel» encuentra dos entradas porque también aparece en la dirección de Chapeltique.
- Guía de técnicas: estados de selección y contenido de full sublimado y bordado comprobados.
- Patrocinio: validación de campos y cantidad, foco en errores, revisión completa, conservación al editar y mensajes preparados para WhatsApp/correo. Las pruebas no abren ni envían esos mensajes.
- Las siete páginas y sus estados de interacción se probaron a 320 y 390 px; las cinco rutas previas conservan sus comprobaciones a 320, 390, 768 y 1440 px. Se mantuvieron aprobadas las regresiones del pedido, archivos, capas, PNG y entrada del lagarto desde el primer pintado.

`node scripts/review-sections.cjs` generó capturas de la portada, explorador, menú y seis páginas de contenido en escritorio y móvil, sin errores de JavaScript ni de consola en el recorrido. Se inspeccionaron las composiciones y se ajustó el título decorativo de tiendas para que su texto completo quepa a 320, 390 y 1440 px. Las capturas están en `docs/sections-*.png`. Las vistas aisladas de componentes ocultan temporalmente la cabecera fija y el enlace de salto solo durante la captura para que no tapen la pieza; las capturas de página completa conservan la interfaz.

La referencia contrastada está en [Secciones de Tony](reference/SECCIONES-TONY-2026-09-22.md). Los datos públicos no equivalen a confirmación comercial de disponibilidad, horarios, temporada de patrocinios ni condiciones de envío. Catálogo, DTE/IVA, pagos, dominio y publicación conservan su estado pendiente.

## Revisión anterior: editor por capas y diseño de ambas caras

Se completaron **30 casos únicos de navegador** en Microsoft Edge/Chromium, ejecutados por grupos: nueve de pedido, trece del editor, cuatro del sitio y cuatro de la intro. El grupo inicial de pedido/editor terminó en 1,9 minutos y el de sitio/intro en 43,9 segundos. Después se añadió la regresión de campos numéricos y técnica y se repitió el caso de operaciones de capas con sus últimas aserciones; ambos pasaron en 12,5 segundos. Ninguna prueba envía mensajes por WhatsApp ni crea pedidos externos.

La compilación final `npm run build` pasó: Next.js compiló correctamente, TypeScript terminó sin errores y se generaron las nueve páginas estáticas previstas.

- Imágenes PNG propias y escudo aplicados dentro de la silueta SVG de la camisa. Las capas de frente y espalda se comprobaron de forma independiente; giro, opacidad, tamaño y posición se conservaron al recargar junto con los archivos de IndexedDB.
- Retiro de marcas Tony verificado en la ilustración y tras recarga. Se comprobaron bloqueo, ocultar/mostrar, duplicar, eliminar, deshacer/rehacer y orden de capas. Un elemento bloqueado no se mueve con las flechas del teclado.
- Texto de patrocinador editable sin perder foco, visible en la prenda y reordenable respecto de otras capas.
- Los campos numéricos permiten borrar su contenido para escribir un nuevo valor e introducir rotaciones negativas. Los cambios de técnica de la prenda también responden a deshacer y rehacer.
- Full sublimado, Estampado y Bordado seleccionados en el editor y conservados en la revisión, el TXT descargado y el mensaje de WhatsApp preparado.
- PNG descargados y leídos como archivos reales. Una imagen magenta de prueba aparece en los píxeles exportados cuando es visible; desaparece al ocultarla y no aparece en la cara opuesta. Esto comprueba la composición exportada además de su firma y dimensiones.
- Archivos de tipo no admitido, imágenes corruptas y archivos mayores de 4 MB rechazados sin perder el arte existente. El modo de referencia plana exige imagen frontal antes de revisar. Si IndexedDB pierde una imagen pero su capa permanece en el borrador, la revisión se bloquea y enfoca el aviso hasta corregir o eliminar esa capa.
- Controles de capas usados con teclado y sin desbordamiento horizontal a 320 y 390 px. Axe no detectó infracciones de las reglas WCAG A/AA seleccionadas en esos controles ni en los pasos de jugadores, diseño y revisión; esto no sustituye una auditoría manual completa.
- El diálogo de borrado conserva el pedido al cancelar y devuelve el foco. Al confirmar, borra jugadores e imágenes; la recarga conserva el nuevo borrador vacío.
- Se conservaron las regresiones de cantidad, filas individuales, nómina/CSV, reducción y recuperación de registros, historial, borradores corruptos, almacenamiento bloqueado y migración sin dorsales ficticios. Las comprobaciones de navegación y entrada del lagarto desde el primer pintado también permanecen aprobadas.

Las capturas del editor y la revisión se generaron mediante `node scripts/review-studio.cjs`, sin errores JavaScript ni desbordamiento horizontal en el recorrido: `docs/studio-layers-desktop.png`, `docs/studio-layers-mobile.png` y `docs/studio-review-desktop.png`. El recorrido completo del pedido se captura con `node scripts/review-order.cjs`.

La revisión de fuentes continúa en [Referencia del pedido actual](reference/PEDIDOS-TONY-2026-09-22.md). Las técnicas, telas y preferencias deben confirmarse con Tony para cada confección. Catálogo, precios definitivos, IVA/DTE, cobro y publicación siguen pendientes.

## Revisión anterior: pedido por equipo e inicio de la animación

El flujo actual empieza por cantidad, sigue con jugadores individuales, diseño y revisión. Se completaron **20 pruebas de navegador**, ejecutadas por grupos: nueve de pedido, cuatro del sitio, cuatro de intro y tres del editor. La compilación final de Next.js y TypeScript terminó sin errores.

- Cantidad validada antes de avanzar; una ficha por prenda con nombre, talla y dorsal. Los datos adicionales sobreviven a reducir y volver a aumentar la cantidad, incluso tras recargar.
- Validación con foco en el primer campo incompleto, escritura continua sin perder foco, dorsales y nombres reales en el resumen, mensaje de WhatsApp y CSV. Ninguna prueba envía mensajes ni pedidos.
- Borrador v2, migración del borrador anterior, JSON corrupto, almacenamiento bloqueado e historial del navegador comprobados. Un dorsal de muestra no se convierte en el dorsal real de un jugador.
- Editor liso por defecto, escamas opcionales, vista de espalda por jugador, referencias y escudo cargados y eliminados, archivo corrupto rechazado, posición del escudo y patrocinador conservados. Referencias guardadas en IndexedDB y comprobadas tras recarga.
- Descargas PNG reales de frente y espalda verificadas por firma y dimensiones; descarga CSV leída y comparada con la nómina. Borrar el borrador elimina nombres y referencias guardadas. La composición exportada también se comprobó visualmente y por ubicación del escudo en una prueba aislada.
- Axe no detectó infracciones de las reglas WCAG A/AA seleccionadas en las cinco rutas del sitio ni en los pasos de jugadores, editor y revisión. Esto no sustituye una auditoría manual completa.
- Los cuatro pasos se probaron a 320 y 390 px sin desbordamiento horizontal. Capturas revisadas de cantidad, nómina, editor y resumen en escritorio y móvil, en `docs/order-*.png`; regeneración con `node scripts/review-order.cjs`.
- Regresión de entrada: con JavaScript retenido antes de hidratar, la cortina cubre la portada desde el primer pintado y entrega el control al diálogo. Comprobación aislada: cero fotogramas de portada expuestos antes del modal, secuencia completa, sesión vista, repetición, Escape, movimiento reducido, JavaScript desactivado y recuperación si falla la carga.

La verificación de la web oficial está en [Referencia del pedido actual](reference/PEDIDOS-TONY-2026-09-22.md). Las opciones del brief que no pudieron contrastarse siguen identificadas como provisionales. Catálogo, precios definitivos, IVA/DTE, cobro y publicación permanecen pendientes.

## Segunda revisión: bosque, campaña y lagarto

La versión actual se comprobó nuevamente tras el cambio de dirección visual. Resultados de `npm run test:e2e`: **14 pruebas aprobadas** en una ejecución conjunta (2.8 minutos).

- Compilación final de Next.js y comprobación TypeScript aprobadas; las nueve páginas y recursos estáticos se generaron correctamente.
- Las siete pruebas del configurador conservan sus resultados: validaciones, borrador, historial, parámetros, almacenamiento restringido y flujo móvil.
- Tres pruebas nuevas comprueban la entrada del lagarto: reproducción por sesión, repetición, Escape, salto en móvil, desbloqueo de scroll y omisión con movimiento reducido o en rutas internas.
- Las cuatro pruebas del sitio verifican navegación, buscador, FAQ, traslado de personalización y ausencia de desbordamiento horizontal a 320, 390, 768 y 1440 px.
- Axe no detectó infracciones de las reglas WCAG A/AA seleccionadas en las cinco rutas examinadas. La revisión del contenido usa movimiento reducido; el diálogo animado se comprueba por separado.
- Capturas de la portada, detalle textil, estudio, mascota y configurador inspeccionadas en Edge; revisión adicional de portada a 700 px. Se aumentó la letra de los avisos de boceto y se separó el arte del titular en anchos intermedios.
- Las capturas automatizadas finales no registraron errores JavaScript. El replay restaura foco, la intro restaura scroll y el sitio permanece accesible al reducir movimiento.

Recursos: `docs/v2-desktop-hero.png`, `docs/v2-mobile-hero.png`, `docs/v2-tablet-hero.png`, capturas de secciones `docs/v2-desktop-*.png` y del configurador `docs/v2-configurator-*.png`. La escena animada está en `docs/intro-v2-frame.png` y `docs/intro-mobile-v2.png`.

## Primera revisión (histórico)

La primera versión se comprobó en Windows con Microsoft Edge/Chromium mediante Playwright. Es una base visual navegable para revisión; no constituye una certificación de accesibilidad ni aceptación de producción.

## Resultados

- Compilación de Next.js completada y TypeScript sin errores.
- 4 pruebas del sitio aprobadas: páginas y accesibilidad; menú, búsqueda y FAQ; personalización de portada al configurador; ajuste responsive.
- 7 pruebas del configurador aprobadas: validaciones y resumen de WhatsApp; historial y restauración; parámetros de entrada; datos guardados corruptos; almacenamiento bloqueado; flujo móvil en 360 y 390 px.
- Axe sin infracciones detectadas con las reglas WCAG A/AA usadas en la portada, catálogo, contacto, nosotros y primer paso del configurador.
- Sin errores de JavaScript o hidratación en el recorrido comprobado.
- Sin desbordamiento horizontal en las cinco páginas a 320, 390, 768 y 1440 px. Movimiento reducido activo en la prueba responsive.
- Capturas revisadas de la portada y configurador en escritorio y móvil.
- Dependencias: la instalación inicial informó cero vulnerabilidades conocidas en su auditoría.

Los conjuntos del sitio y configurador se ejecutaron por separado. Sus fuentes están en `tests/site.spec.ts` y `tests/configurator.spec.ts`; `npm run test:e2e` permite ejecutarlos juntos. No se abre ni envía el mensaje de WhatsApp durante las pruebas: se verifica su enlace y contenido preparado.

## Correcciones surgidas de la revisión

Se corrigieron la prioridad de las variables tipográficas, un desajuste de hidratación en el título SVG, contraste sobre el fondo naranja, una etiqueta ARIA decorativa y un selector de SVG demasiado amplio que agrandaba el icono del catálogo. El configurador conserva las modificaciones al consumir los parámetros iniciales y ya no salta el paso de equipo cuando recupera un borrador válido. Se ajustó el nombre frontal para que permanezca dentro de la camiseta.

## Límites de esta comprobación

Quedan pendientes pruebas en Safari/iPhone, Android real, Firefox y navegadores internos de redes sociales; lectura con tecnologías de asistencia; zoom y contrastes de todas las combinaciones personalizadas; revisión con usuarios y métricas Lighthouse. Tampoco se han probado transacciones, administración, DTE, impuestos, migración o servicios de producción: estas funciones aún no están implementadas.

La publicación, dominio y decisiones comerciales siguen aplazados. La versión incluye `noindex` y un `robots.txt` que impide su rastreo hasta preparar el lanzamiento.
