# Alcance y pendientes

Fecha de referencia: 23 de septiembre de 2026.

Esta fase construye una experiencia local, visual, animada y navegable del nuevo sitio de TONY SPORTSWEAR. El brief adjunto describe una visión mucho más amplia; sus funciones futuras y criterios de producción no se consideran entregados por existir este prototipo.

La petición actual del usuario tiene prioridad: una presentación deportiva elegante y con energía, inspirada en Charly México y Under Armour, con fondo oscuro de escamas verdosas, botones llamativos y animación del lagarto. La personalización ahora parte de la cantidad y recoge nombre, talla y dorsal de cada persona. Las escamas son una opción del uniforme, no un requisito de la marca. El catálogo nuevo, DTE, IVA, la decisión de pasarela y el dominio para publicar siguen pendientes.

## Trabajo de esta fase

| Área | Alcance de la base local |
| --- | --- |
| Identidad | Verde bosque y escamas, botones lima, luz ámbar y tipografía local. Wordmark transparente derivado del original, completo y con ojo de lagarto; bandera salvadoreña horizontal en el pie. |
| Portada | Campaña y ocho apartados: 01 proceso, 02 tutorial, 03 espacio del cliente, 04 destinos, 05 marca, 06 catálogo, 07 redes y 08 preguntas. El explorador se trasladó a Producto. |
| Lagarto y movimiento | Adaptación SVG más cercana al escudo de referencia, con rasgado visible y wordmark transparente; respaldo vectorial si falla la imagen. Cobertura desde el primer pintado, salida de seguridad, Escape, salto, repetición y movimiento reducido. |
| Tutorial de la portada | Sustituye el estudio «Así se ve tu equipo». Imagen referencial del editor real y temas de la futura guía; el video se añadirá después. No hay reproducción ficticia. |
| Pedido de equipo | Cuatro pasos: Cantidad → Jugadores → Diseño → Revisión. Cantidad de 6 a 999, una ficha por prenda, nombre/talla/dorsal/rol, progreso, validación por campo y navegación protegida. |
| Editor de diseño | Base lisa Esencial por defecto; Franja y Escamas opcionales. Imágenes, escudos y textos propios por capas independientes en frente y espalda, recortadas en la prenda. Posición, tamaño, giro, opacidad, orden, bloqueo, visibilidad, duplicado, eliminación y deshacer/rehacer. Elementos de plantilla Tony retirables. |
| Preferencias de prenda | Full sublimado, Sublimado parcial, Estampado, Bordado o asesoría, además de molde, confección y tela. Cuello y manga cambian la ilustración. La técnica y las preferencias pasan al resumen para confirmar con Tony; no se calculan tarifas ni se garantiza viabilidad automática. |
| Borrador y archivos | Datos guardados en localStorage e imágenes en IndexedDB del navegador. Conservación de registros al reducir cantidad, restauración y migración del borrador anterior sin copiar dorsales ficticios. Mensajes claros cuando el guardado no está disponible. |
| Revisión y consulta | Vistas de frente y espalda, elementos de diseño, técnica, nómina completa y distribución de tallas. Descargas de ambas vistas PNG, archivos originales, resumen TXT y lista CSV; enlace de WhatsApp preparado para envío manual. En listas largas, el mensaje indica adjuntar el resumen completo. |
| Catálogo | Página que comunica su estado pendiente; sin reutilizar como inventario el catálogo deteriorado. |
| Navegación y producto | Producto, Somos Tony, Para ti, Tony News, búsqueda y menú móvil. Producto conserva 13 categorías y 24 subcategorías oficiales y el explorador de nueve líneas; `/lineas` sigue por compatibilidad. Creación de uniformes se concentra en Inicio. |
| Carrito | Copias locales independientes de diseño, imágenes y nómina, vistas de ambas caras, descargas y cotización manual con sucursal elegida. Confirmación al eliminar, efecto del lagarto y conservación del carrito previo si falla la escritura. Sin cobro ni compra confirmada. |
| Recientes | Solo solicitudes del propio cliente en este navegador: cantidad, técnica, diseño y tallas. La confirmación del usuario descarta un muro público. El historial comercial real requiere backend y pedidos confirmados. |
| Reseñas | Espacio preparado para experiencias reales autorizadas, inicialmente vacío. Borrador local, valoración, validación, revisión, copia y compartir manualmente. La moderación y publicación administrativa están pendientes. |
| Seguidores | Instagram 152, TikTok aproximadamente 29,3 mil y Facebook 1.194; verificación pública del 23/09/2026. Fecha y actualización manual visibles. Sin automatización ni suma engañosa de personas únicas. |
| Movimiento adicional | Cabeza de intro adaptada a la referencia sin cambiar el resto del logo. Logo vuelve a Inicio con intro; texto por palabras, uniones de escamas iluminadas junto al cursor y rasguño fino de clic/toque. Sin lagarto agarrado al borde: solo el que asoma por abajo tras 5,5 s de calma (fuera del pedido) y el guiño al cambiar de apartado. Control persistente y movimiento reducido. |
| Calidad y servicios | Guía de técnicas y tallas; directorio de trece entradas con filtros, contacto y Maps. Entregas exige elegir sucursal antes de preparar WhatsApp y muestra su número propio; no hay sucursal predeterminada. La sección 03 de Entregas se retiró. |
| Marca y comunidad | Nosotros, Contacto, App Tony, TonyPlay en desarrollo, galería RSE y guías. Se retiraron los CTA repetidos de creación. Patrocinio valida teléfono/correo, conserva revisión manual y añade estados de copia, errores y foco al editar. |
| Tony News | Página principal `/tony-news`, reel de Instagram de archivo sobre Lourdes, perfil oficial de TikTok bajo demanda, canal de Facebook y líneas Motorcycle/Cycling Pro. Las cuentas y el reel están en `lib/social-news.ts`; no hay sincronización automática con APIs. |
| Estados y superficies | Transparencias de vidrio y relieve discreto en formularios; pulsación, selección, foco y estados de error/éxito. Las inserciones sociales contemplan carga, alternativa y reintento. |
| Base de desarrollo | Next.js, React, TypeScript y componentes compartidos. |

La vista previa del uniforme es ilustrativa. La campaña `hero-campaign-v3.png` y el detalle `detail-campaign-v2.png`, producidos mediante `image_gen`, llevan etiquetas visibles de «BOCETO». Su aspecto fotorealista no acredita productos disponibles ni reproducciones exactas de telas, impresión o confección. No se publican precios o existencias para estas imágenes. La consulta por WhatsApp permite empezar una conversación; no registra una compra ni garantiza un presupuesto.

`LagartoIntro` conserva una adaptación vectorial de la mascota, ajustada al escudo de referencia del usuario. El wordmark de cabecera, pie y escudo usa un PNG transparente generado a partir del original (la intro, el emblema y la transición cargan un recorte WebP de ese mismo archivo); mantiene nombre, estilo, colores y ojo. La extracción puede introducir pequeñas diferencias de borde y no sustituye un archivo vectorial oficial. Si la imagen de la intro falla, permanece su respaldo SVG. La procedencia está en [Recursos de marca](reference/BRAND-ASSETS-2026-09-22.md).

Tony News distingue una publicación seleccionada de una integración de red social. El reel de Lourdes conserva fecha y etiqueta de archivo; no se anuncia una apertura futura a partir de una publicación pasada. TikTok muestra su perfil oficial cuando el usuario lo solicita. Facebook enlaza el canal oficial: el video concreto sigue pendiente por la restricción de acceso de la plataforma sin sesión. No se han implementado credenciales, webhooks ni actualización automática del muro.

El paso de cantidad incluye a los porteros dentro del total. Cada registro activo exige nombre, talla y dorsal; el rol permite identificar al portero. Los dorsales repetidos se señalan para revisión, sin impedir una repetición intencional. Si se pasa de doce a seis prendas, solo las primeras seis personas entran en la solicitud; al volver a doce, reaparecen los datos conservados. Las tallas individuales ya elegidas no se sobrescriben al aplicar una talla a los espacios vacíos.

El editor admite hasta 16 capas y archivos PNG, JPG y WebP de hasta 4 MB cada uno, con un total de 20 MB de imágenes por proyecto. El diseño propio se aplica sobre la camisa con recorte dentro de su silueta; los escudos y textos también son capas. Se ajustan posición, ancho, alto, rotación y opacidad, mediante arrastre, controles numéricos o teclado. Las caras se trabajan de forma independiente. Se puede cambiar el orden, duplicar, ocultar, bloquear o eliminar elementos y deshacer/rehacer cambios. Las capas ocultas no aparecen en el PNG ni en las indicaciones finales.

Las marcas Tony, adornos, patrón y textos de la plantilla tienen controles individuales; también existe una acción para limpiar la base. Como alternativa de referencia, se puede mostrar una imagen original de frente o espalda sin aplicar sobre ella las capas del editor. Esta distinción se explica en la interfaz.

Los archivos se cargan y conservan en el navegador, con validación y errores visibles; no existe un repositorio remoto ni se envían automáticamente por WhatsApp. Si se conserva una capa visible pero falta su imagen local, la revisión exige recuperar ese archivo o eliminar la capa. Borrar el borrador elimina sus imágenes guardadas. Cambiar de equipo o dispositivo no recupera estos datos: no hay cuenta ni sincronización.

La descarga PNG toma la vista actual del editor —frontal o posterior— e incluye camiseta, calzoneta cuando corresponda y capas visibles con sus ajustes; en modo de referencia conserva la imagen original. La revisión permite descargar cada cara y los originales por separado. El PNG se genera localmente mediante canvas a resolución doble a partir del mismo SVG que se muestra, sin manejadores ni bordes de selección. Es una imagen del boceto para compartir, no un archivo de producción ni un diseño aprobado; el cliente la adjunta manualmente junto con las referencias y la solicitud.

La entrada del lagarto solo corresponde a la portada. El arranque inicial omite la cobertura si ya se vio en la sesión o existe preferencia de movimiento reducido. Escape y una salida temporal de seguridad liberan el contenido; si JavaScript está desactivado, la página permanece accesible. El detalle de las comprobaciones corresponde al informe de verificación, no a este documento de alcance.

## Decisiones aplazadas por el usuario

| Pendiente | Qué hace falta al retomarlo | Qué queda sin activar |
| --- | --- | --- |
| Catálogo desde cero | Nuevo listado de productos y diseños, códigos, fotografías propias, variantes, tallas, disponibilidad y precios confirmados. | Inventario, fichas de venta, búsqueda y filtros comerciales. |
| DTE | Definir el alcance de facturación y revisar los requisitos vigentes con el responsable correspondiente. | Captura fiscal para pedidos, adaptador y emisión de documentos. |
| IVA | Confirmar cómo deben mostrarse y calcularse los precios. | Cálculo y desglose tributario. |
| Pasarela | Decidir primero si habrá pago en línea; después, proveedor, condiciones y forma de cobro. | Checkout, anticipos, cobros, webhooks y conciliación. |
| Dominio y publicación | Confirmar dominio, alojamiento y accesos cuando corresponda publicar. | Despliegue público y cambios de DNS. |

El brief propone pagos y una preparación de DTE, pero la petición más reciente los deja pendientes. Esta base no afirma que esas decisiones estén cerradas ni que exista una integración fiscal preparada.

## Funciones del brief que requieren otra fase

- Reglas completas de confección: confirmar la disponibilidad y combinaciones de moldes, telas, cuellos y mangas; sustituir preferencias provisionales por fichas y medidas aprobadas. La captura local de estas preferencias y de jugadores ya existe.
- Personalización adicional: diseño independiente del portero, medias, regalías, reglas comerciales y aprobación formal de mockups. El rol de portero actual es un dato de la ficha, no un cálculo de obsequio o una prenda adicional automática.
- Motor de precios validado: reglas en centavos, configuración persistente y recálculo en servidor; resolución del cargo fijo y de los umbrales de regalías antes de programarlos.
- Backend: pedidos y archivos remotos, autenticación y recuperación o intercambio de configuraciones entre dispositivos. El almacenamiento local actual no sustituye estas funciones.
- Operación comercial: carrito, cuenta, seguimiento del pedido, aprobación de diseño, hoja de producción y comunicaciones.
- Panel: inventario, catálogo, precios, contenidos, pedidos, permisos y registro de actividad.
- Asesora con voz y generación de mockups con IA: servicio, límites, control de costos y alternativa manual.
- Contenido pendiente de apoyo: tabla de medidas aprobada por molde, fichas técnicas completas de telas, horarios de tiendas y políticas. Las páginas de calidad, tiendas y entrega ya tienen una base de información contrastada.
- Video tutorial: aportar el archivo o la publicación definitiva para sustituir la imagen referencial. TonyPlay sigue en desarrollo; no hay juego, fecha ni promesa de lanzamiento en esta entrega.
- Tony News: seleccionar el video concreto de Facebook y futuras publicaciones. Una sincronización automática requerirá definir las cuentas, permisos y APIs disponibles; los canales e inserciones actuales son una selección editorial.
- Migración: respaldos, inventario de URLs anteriores, redirecciones, pedidos existentes y plan de reversión.
- Preparación de lanzamiento: comprobaciones en navegadores reales, usuarios, accesibilidad, rendimiento, respaldos, observabilidad y documentación operativa.

El brief menciona metas de rendimiento y aceptación. No hay aquí puntuaciones Lighthouse, certificación de accesibilidad, aprobación del cliente ni pruebas de producción asumidas como cumplidas.

## Información del negocio por confirmar

El brief aporta el nombre de TONY SPORTSWEAR, su actividad de uniformes y camisas full sublimadas, el eslogan «SI NO LO TENEMOS, TE LO HACEMOS», WhatsApp `7015-5571` y correo `info@tonysportselsalvador.com`. Los canales también aparecieron en el sitio oficial revisado; antes de publicación deben confirmarse los datos operativos completos.

La [auditoría de pedidos del 22 de septiembre](reference/PEDIDOS-TONY-2026-09-22.md) recoge URLs, campos y capturas de la web oficial, sin enviar pedidos ni mensajes. La ficha de uniformes revisada publica un mínimo de seis, aunque el control del carrito permite uno; la nueva solicitud usa seis como mínimo. Se encontraron moldes Normal, Ranglan y Primera División y distintas líneas de sublimación. No se pudo verificar en el sitio actual el configurador de seis pasos descrito por el Anexo A: ambos hosts terminaron en el WordPress y no se encontró ese editor en las páginas inspeccionadas.

Las tallas 2–16 y XS–4XL y la lista Slim Fit, Slim Pro, Modern Carving, Dryfit, Premier y Drycool proceden del brief como referencia provisional de captura. La selección de tela empieza en «Por definir con Tony». No se ha confirmado una tabla oficial de medidas, todas las combinaciones disponibles ni los recargos. Esas opciones no se presentan como garantía de stock, precio o equivalencia de talla.

Antes de publicar contenido comercial, confirmar:

- Contactos, razón social y datos de cada tienda, incluyendo dirección, horarios y ubicación.
- Cobertura, costo de envío, producción y plazos de entrega.
- Tabla de tallas, fichas de telas y reglas de precios y regalías.
- Identidad gráfica final y permisos del material audiovisual.
- Políticas de cambios, cancelaciones, privacidad y conservación de datos.

Los precios, porcentajes de tecnología, testimonios y cifras de las capturas de referencia no son datos de TONY. No deben convertirse en afirmaciones comerciales. Los importes del brief tampoco se publican como tarifas verificadas.

## Recursos necesarios para continuar

El usuario ya aportó referencias visuales y una textura de escamas. La campaña conceptual y la intro permiten revisar ahora la dirección visual y el movimiento. Para ajustar la identidad oficial y ampliar el contenido comercial harán falta el logo vectorial y sus capas, fotografías propias, catálogo nuevo, material real de fábrica y las fichas del negocio.

Cuando se retome la migración, harán falta respaldos del sitio y del configurador actuales, además del estado de sus pedidos. Esta fase local no cambia el sitio vivo, su dominio ni sus registros de correo.

## Criterio para la siguiente revisión

La revisión incluye la continuidad de la intro, transparencia del logo, numeración de portada, tutorial pendiente, navegación sin «Líneas» y ausencia de CTA redundantes. En Entregas debe comprobarse el número de la sucursal elegida y la invalidación de la consulta cuando cambian sus datos; en Tony News, los estados de inserción y sus enlaces originales. El configurador conserva la revisión de cantidad, nómina, capas, archivos y exportaciones. También se revisan teclado, movimiento reducido y pantallas pequeñas. Los resultados se registran por separado en `VERIFICACION.md`.

La cotización sigue siendo una solicitud manual; no confirma una compra ni envía archivos automáticamente. La siguiente fase comercial se concretará con datos del cliente, manteniendo pendientes el catálogo nuevo, DTE, IVA, pagos y dominio/publicación.
