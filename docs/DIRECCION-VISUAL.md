# Dirección visual

TONY SPORTSWEAR se presenta como una marca deportiva con carácter: verde bosque profundo, escamas de lagarto en el entorno de la página, prendas de gran presencia y acciones en lima brillante. La composición busca elegancia, energía y espíritu competitivo. El concepto parte de la piel del lagarto y del eslogan «SI NO LO TENEMOS, TE LO HACEMOS». La identidad visual del sitio no impone un estampado al equipo: las prendas pueden ser lisas, llevar franjas, escamas o seguir una referencia del cliente.

## Referencias y traducción a TONY

Las referencias oficiales consultadas son [Charly México](https://www.charly.com/) y [Under Armour](https://www.underarmour.com/en-us/). Se utilizan como orientación de diseño, sin implicar afiliación ni reutilizar sus marcas o productos.

| Referencia | Dirección para TONY |
| --- | --- |
| Charly México | Hacer que el fútbol, los uniformes y la identidad del equipo sean fáciles de reconocer desde la portada. |
| Under Armour | Dar al producto una presencia deportiva fuerte, con contraste, jerarquía tipográfica y composición contundente. |
| Capturas del usuario | Mantener la relación entre verde, naranja, noche y escamas, adaptándola a una experiencia propia. |
| TONY | Poner la personalización y el contacto para cotizar en el centro del recorrido. |

Esta traducción es una decisión creativa del proyecto. No toma como contenido real los precios en MXN, colecciones, nombres de tecnologías, estadísticas ni promociones que aparecen en las capturas.

## Sistema visual

La revisión del 23/09 añade movimiento editorial por palabras y partículas breves, conservando legibilidad sin JavaScript y con movimiento reducido. La jerarquía de color pasa a negro y grafito para superficies y profundidad, verde de marca para identidad y acciones principales, y naranja solo para las uniones iluminadas y acentos puntuales; se retiraron los resplandores neón de botones. Los textos pequeños suben a tamaños legibles (etiquetas desde 11 px, descripciones desde 13 px) para que cualquier visitante recorra el sitio sin esfuerzo.

Tony no se redibuja: la cabeza y la garra se vectorizaron directamente del logo de referencia (capas negra, verdes, lima y ojos rojo-naranja-amarillo; uñas blancas y el rasgado que dejan las garras) y se sirven como SVG estáticos en `public/assets/tony-head.svg` y `tony-claw.svg`, unos 115 KB en total y cacheables. Solo los párpados van aparte (`components/TonyArt.tsx`), cada uno en su propia capa, para parpadear y guiñar sin repintar la cabeza. El lagarto agarrado al borde de la página se retiró a pedido del usuario: queda solo el del borde inferior (`TonyPeek.tsx`), que asoma cada 5,5 s de calma como en el logo, cabeza y garras sobre el filo, mira al visitante y se esconde con cualquier toque, clic, tecla o scroll. Al cambiar de apartado Tony se acerca sujetando el escudo con el logotipo completo, sin letras tapadas ni cortadas, y guiña. La intro sobre el escudo, el emblema de la sección de marca (parpadea solo mientras está en pantalla) y la mordida del carrito (`TonyMascot.tsx`, cabeza girada y garras en el filo de la tarjeta) usan el mismo arte. No hay versión de cuerpo entero porque el logo no la tiene; hacerla exigiría una ilustración nueva del personaje completo.

El fondo es una piel de reptil grafito generada de forma determinista y servida como WebP a 2× (el SVG original solo se usa para generarla y para el brillo); la capa de uniones comparte exactamente su geometría, escala y origen. Una máscara radial de 170 px alrededor del cursor decide qué juntas se encienden, con caída gradual y apagado suave; la capa se desplaza con el documento para no perder la alineación durante el scroll. El rasguño de clic son dos trazos finos y curvos más uno corto, de 34 px y 340 ms, con un máximo de cuatro simultáneos. El control de efectos es un botón redondo discreto en la esquina inferior izquierda que muestra su texto con el cursor o el foco; en móvil queda al pie.

La cara de la intro sigue las cejas curvas, ojos naranja y mejillas de `REFERENCIA LOGO.png`; está separada del escudo y del wordmark existentes. El carrito usa una superficie clara para leer el uniforme y una ficha verde translúcida para los detalles, con el efecto de mordida únicamente después de confirmar y completar el borrado. Reseñas y Recientes alternan vidrio oscuro, relieve suave y bloques de verde claro, con estados vacíos deliberados en ausencia de datos reales.

- **Verde bosque:** base oscura `#091b12` y superficies verdes en distintos niveles de luz; la textura se mantiene visible y aporta profundidad.
- **Lima brillante:** `#b4ff35` para botones principales, énfasis tipográfico y señales de interacción. Texto oscuro y flechas claras hacen reconocible cada acción.
- **Ámbar:** luz cálida y acentos `#ffa15b`, en equilibrio con las luces verdes de la campaña.
- **Hueso y verde grisáceo:** texto principal `#f4f5e9` y secundario `#b1c3ae`, con contraste sobre el entorno forestal.
- **Escamas:** textura aportada por el usuario, combinada con veladuras y luz verde para unir las superficies; los controles conservan una base legible.

Los valores implementados deben mantenerse centralizados en los estilos globales. La función de cada color importa tanto como su tono: una acción principal identificable es más útil que varios botones compitiendo por atención.

Barlow Condensed en peso 700, normal e itálica, aporta títulos altos y deportivos. Archivo en pesos 400, 600 y 700 sostiene párrafos, navegación, etiquetas y formularios. Las fuentes se sirven desde paquetes locales. Los títulos con tildes necesitan altura suficiente para que no se corten Á, Í o Ñ.

## Composición y producto

La portada se organiza como una campaña de gran formato: titular a la izquierda, camisetas protagonistas a la derecha y llamada a crear el uniforme. El fondo tiene escamas tridimensionales, luces verdes y reflejos ámbar. Tras la campaña, la numeración sigue el orden real: 01 líneas, 02 proceso, 03 tutorial, 04 universo Tony, 05 marca, 06 catálogo y 07 preguntas. El detalle textil marfil aporta una pausa luminosa dentro del entorno oscuro.

La campaña usa dos imágenes conceptuales generadas con la herramienta integrada `image_gen`:

| Recurso | Uso y alcance |
| --- | --- |
| `public/assets/hero-campaign-v3.png` | Camiseta lima y camiseta marfil sobre escamas verdes; aparece como «BOCETO DE CAMPAÑA · DISEÑO CONCEPTUAL». |
| `public/assets/detail-campaign-v2.png` | Detalle fotorealista de tejido, cuello y costura; aparece como «BOCETO VISUAL · NO REPRESENTA UNA TELA DEL CATÁLOGO». |

El aspecto fotorealista expresa una dirección creativa; no acredita productos, tejidos ni existencias reales. Los recursos v2 se conservan como archivos de trabajo. Los prompts están guardados en `output/imagegen/`.

El explorador conserva ilustraciones de las nueve líneas. El antiguo estudio interactivo de la portada se sustituyó por `TutorialPreview`, con una imagen del editor real y una indicación explícita del futuro video. El icono de reproducción forma parte de esa imagen referencial, sin comportamiento de reproductor ni botón inactivo que prometa contenido disponible.

El configurador conserva las prendas SVG y comienza con la base lisa Esencial. Franja y Escamas son alternativas; también admite imágenes propias. Utiliza nombre y dorsal de la nómina, mientras cuello y manga cambian la ilustración. Molde, confección y tela son preferencias para revisar con Tony, no reproducciones exactas de materiales. La vista mantiene su aclaración de boceto.

`LagartoIntro` adapta cabeza, garras y escudo a los verdes, ojos naranjas y marco del emblema aportado por el usuario. El rasgado tiene tres cortes irregulares, profundidad oscura, bordes luminosos y fragmentos visibles antes de abrir la cubierta. El escudo utiliza el wordmark transparente; mientras carga, o si falla, conserva texto SVG de respaldo. La mascota sigue siendo una adaptación, no un vector oficial suministrado por Tony. Su procedencia se documenta en [Recursos de marca](reference/BRAND-ASSETS-2026-09-22.md).

## Interacción

La navegación elimina «Líneas» solamente del menú y sitúa «Tony News» entre los accesos principales. «Universo Tony» mantiene servicios y contenido de marca, con App Tony y TonyPlay en Comunidad. Se conserva el explorador en portada y en `/lineas`. La placa activa utiliza una garra, sin subrayado animado. El número de contacto redundante bajo «Contacto» se retira de ese panel; los canales siguen accesibles en sus apartados. El pie identifica El Salvador con franjas horizontales azul/blanco/azul y escudo central.

Los accesos para crear uniformes se concentran en Inicio. Se eliminan los bloques editoriales repetidos «De la idea a la cancha» y los CTA equivalentes del resto del sitio. Los pasos del proceso son texto estático: no muestran señales de enlace si no navegan a otro lugar.

El explorador combina un directorio, una ilustración de la línea y sus opciones. La superficie marfil hace legible la prenda dentro del fondo de escamas. Al cambiar de línea con el puntero, las prendas responden en 240 ms; con teclado o movimiento reducido la selección es inmediata. Las ilustraciones de categorías no son fotografías ni representan referencias de catálogo. Las páginas de servicios alternan directorios, guías, listas y formularios según lo que necesita cada tarea.

El tutorial pendiente presenta una captura referencial, capítulos sobre cantidad, jugadores y diseño, y el estado «próximamente». TonyPlay tiene un espacio propio con ilustración de mando y estado «en desarrollo»; no presenta un juego disponible ni una fecha de lanzamiento.

Tony News usa una composición limpia: publicación destacada, canales y dos líneas temáticas —Motorcycle y Cycling Pro—. El reel de Instagram de Lourdes conserva su fecha y etiqueta de archivo; TikTok carga el perfil oficial cuando se solicita. Facebook ofrece el canal oficial mientras queda pendiente un video concreto. La inserción distingue carga, alternativa y reintento, y permite continuar en la plataforma de origen. Es una selección de publicaciones, sin API de actualización automática.

En Entregas, la sección de domicilio solicita una sucursal explícita, muestra dirección y teléfono y prepara el mensaje para ese contacto. Cambiar los datos invalida la preparación anterior. Se elimina la antigua sección 03. Patrocinio comunica errores de validación, lleva el foco al campo correspondiente y presenta una revisión positiva sin afirmar que el mensaje ya se envió. Copiar diferencia carga, éxito y fallo.

El glassmorfismo se limita a superficies de formularios donde la transparencia conserva legibilidad; el neumorfismo se expresa mediante sombras interiores discretas en campos y relieve de controles secundarios. Pulsación, selección, foco y estados aportan respuesta funcional. Los errores también tienen texto y símbolo, y el éxito no depende únicamente del verde. Se respeta movimiento reducido.

El configurador organiza el trabajo en cuatro pasos visibles: **Cantidad → Jugadores → Diseño → Revisión**. La cantidad precede al editor y determina cuántas personas aparecen. Cada una tiene nombre, talla, dorsal y rol. La interfaz indica el avance, enfoca campos incompletos y conserva registros cuando se reduce temporalmente la cantidad. Los nombres reales y sus tallas pasan a la revisión final.

En Diseño, el frente y la espalda tienen controles explícitos. El cliente puede aplicar imágenes propias a la camisa, colocar escudos y textos, y administrar hasta 16 capas. Cada capa admite posición, tamaño, rotación, opacidad, visibilidad, bloqueo, duplicación y orden; los controles y las flechas del teclado complementan el arrastre. Los elementos de plantilla —marcas Tony, nombres, dorsal, adornos y patrón— se pueden retirar por separado. Las imágenes se guardan localmente en IndexedDB, separadas de los datos del borrador. No se suben automáticamente a TONY.

El botón «Descargar PNG» permite conservar la vista actual sin los controles de selección. La exportación mantiene el recorte de las imágenes dentro de la camisa, las transformaciones y el orden de las capas visibles, o la referencia plana si se usa ese modo. Se genera en el navegador con resolución doble mediante canvas y conserva el carácter orientativo del boceto. La revisión final muestra ambas caras y permite descargar sus PNG y archivos originales para adjuntarlos manualmente al conversar con TONY. La técnica elegida —full sublimado, sublimado parcial, estampado, bordado o asesoría— forma parte de la solicitud.

La Revisión presenta la lista de jugadores y un recuento de tallas, permite volver a editar y ofrece resumen TXT y lista CSV. WhatsApp abre una solicitud que el cliente revisa y envía por su cuenta. En solicitudes largas, el texto de apertura indica adjuntar el resumen completo; las imágenes también se adjuntan manualmente.

El movimiento aporta presencia al lagarto y profundidad al producto. La intro comienza desde una cobertura de escamas preparada en la cabecera del documento antes del primer pintado. Esa cobertura mantiene la continuidad visual si el JavaScript principal tarda: la portada no aparece primero para quedar tapada después por el lagarto. Al estar lista, la animación recibe el control; un límite de espera libera la página si no llega a iniciarse.

La entrada solo se inicia en la portada, se recuerda durante la sesión y permite saltar, cerrar con Escape o repetir. Con `prefers-reduced-motion` se omiten tanto la cobertura inicial como la intro; sin JavaScript, el contenido permanece disponible. La imagen de portada responde suavemente al puntero en dispositivos compatibles. Las secciones se leen desde el inicio, sin una aparición genérica repetida al desplazarse; los botones responden al pulsar y el movimiento acompaña acciones concretas.

## Revisión en móvil y accesibilidad

La composición debe mantener la acción principal visible, el texto legible y los campos fáciles de tocar en teléfonos. El escritorio permite más aire y una relación mayor entre el titular y la prenda, sin cambiar el sentido de la navegación.

Revisar foco visible, navegación con teclado, etiquetas de campos, estados de selección, texto alternativo y movimiento reducido. La textura y los efectos no deben transportar información que se pierda al desactivarlos. Estas son pautas de diseño y revisión; no una afirmación de certificación ni de compatibilidad ya probada con todos los navegadores.

## Material y veracidad

Se usa la textura aportada, imágenes conceptuales generadas y piezas vectoriales originales. El logo original procede de [la biblioteca del sitio oficial](https://www.tonysportselsalvador.com/wp-content/uploads/WhatsApp-Image-2026-06-08-at-11.30.07-AM-1.jpeg) y permanece en el proyecto. `tony-wordmark-transparent-v1.png` es una extracción generativa de ese recurso que elimina el fondo rectangular, manteniendo nombre, estilo, colores y ojo. La imagen se muestra completa con `object-fit: contain`; puede contener pequeñas diferencias de borde respecto al JPEG. El lagarto y escudo siguen siendo adaptaciones conceptuales, no archivos vectoriales oficiales.

Incorporar fotografías propias con material de calidad suficiente. Los contactos del brief también se encontraron en la página actual; conviene reconfirmar su vigencia y los datos del negocio antes de publicar.

Las opciones de tallas, molde, confección y tela proceden del brief como preferencias provisionales. La [auditoría del sitio oficial](reference/PEDIDOS-TONY-2026-09-22.md) distingue lo observado de lo todavía no corroborado: se encontraron líneas de confección y moldes, pero no se pudo reproducir el configurador descrito en el Anexo A ni verificar una tabla de medidas. Seleccionar una opción en el editor no confirma disponibilidad, precio ni equivalencias de talla.

No se incorporan como pruebas de confianza cifras de rendimiento, plazos, testimonios, alianzas o tecnologías sin respaldo del negocio. La calidad visual debe apoyarse en la presentación, sin depender de afirmaciones comerciales inventadas. El catálogo nuevo, DTE, IVA, pagos y dominio/publicación conservan su estado pendiente.
