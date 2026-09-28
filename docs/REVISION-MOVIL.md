# Revisión móvil · 28 de septiembre de 2026

Trabajo sobre el proyecto existente, a partir de los dos videos facilitados por el propietario. Se revisaron fotogramas de ambas grabaciones y se reprodujeron los recorridos en navegador con emulación de pantalla y entrada táctil. Los videos privados no forman parte del repositorio.

| Antes | Después | Motivo |
| --- | --- | --- |
| Al llegar al tamaño del escudo, la vista previa estaba fuera de pantalla | Vista previa compacta y grupos Agregar / Ajustar / Imagen, con un solo estado del editor | Ver el resultado mientras se ajusta |
| Cada movimiento del dedo actualizaba todo el pedido | Geometría medida al iniciar; movimiento de la pieza con requestAnimationFrame; un cambio al soltar | Evitar recalcular el pedido, la asesora y el autoguardado durante el gesto |
| Asesora flotante sobre controles y desplazamientos automáticos entre opciones | Asesora integrada en móvil; el usuario controla el desplazamiento | Quitar superposiciones y saltos |
| Guardar cambiaba un contador y un mensaje lejano | Confirmación visible, marca de éxito, acceso al carrito y error explícito si falla el almacenamiento | Confirmar solamente después de guardar |
| Búsqueda y accesos personales al final del menú largo | Búsqueda y accesos arriba; cierre siempre a mano; filas y botones táctiles | Facilitar navegación con una mano |
| Intro, cortina por cambio de sección y animaciones ambientales en teléfono | Entrada inmediata, sin cortinas ni procesos ambientales en teléfono; títulos con aparición de 180 ms | Reducir trabajo decorativo y esperas |
| Nueve fotos invisibles preparadas por el explorador de líneas | Se carga la foto de la línea elegida | Reducir descargas y decodificaciones innecesarias |

El escritorio conserva su distribución y efectos. Los precios, productos, textos comerciales, reglas de pedido, API, autenticación y servicios de pago no se modificaron.

## Archivos y ajustes

- `components/mobile-refinements.css`: adaptación hasta 900 px, cabecera de 64 px, controles principales de 44–48 px, campos de 16 px, ajustes de formularios y ventanas.
- `components/pedido/editor.css` y `DesignEditor.tsx`: grupos de herramientas, vista previa de 190–300 px según altura disponible; arrastre y deshacer.
- `components/pedido/PedidoFlow.tsx`: acción de guardado próxima a Continuar en móvil, estado de guardado, seguimiento del paso visible. Se conserva la función de almacenamiento existente.
- `components/CartFeedback.tsx`, `cart-feedback.css`, `lib/cart-feedback.ts` y `AddToCart.tsx`: una notificación compartida; entrada de 220 ms, duración de 6 segundos, pausa al enfocar/pasar el puntero u ocultar la pestaña. Cierre y enlace accesibles; sin animación con movimiento reducido.
- `Header.tsx`, `Brand.tsx`, `PedidoAdvisor.tsx`: menú compacto, navegación directa, lectura de posición de cabecera solo con un menú de escritorio abierto, limpieza de escuchas de activación de voz.
- `AmbientExperience.tsx`, `RouteTransition.tsx`, `LagartoIntro.tsx`, `LagartoIntroBootstrap.tsx`, `HomeExperience.tsx`, `RevealText.tsx`: adaptación de efectos a pantallas de hasta 900 px o puntero táctil. La intro se puede repetir voluntariamente con su control existente.
- `LineExplorer.tsx`: carga de la foto activa.
- `tests/mobile.spec.ts`: navegación táctil, persistencia, errores, confirmaciones, arrastre, deshacer, encuadre, pantallas estrechas y movimiento reducido. `tests/intro.spec.ts` actualiza el comportamiento esperado en teléfono.

## Verificación

- TypeScript y compilación de producción con `TONY_GITHUB_PAGES=true`; exportación y preparación de las rutas `/TonySport`.
- Revisión de 18 rutas a 320, 390, 430, 768 y 1440 px: 90 combinaciones, sin desbordamiento horizontal, imágenes rotas ni errores JavaScript. Se encontraron seis campos pequeños a 768 px; se corrigieron y se repitió su revisión, sin incidencias.
- 73 pruebas E2E distintas aprobadas entre las ejecuciones y sus repeticiones: editor, carrito nuevo y anterior, navegación, accesibilidad automatizada, formularios, catálogo, solicitudes recientes, configuración, entrega, firma, servicios de pago simulados, intro y efectos de escritorio.
- El arrastre táctil de prueba usa 20 movimientos y genera una sola acción de deshacer al soltar. La imagen y el control de tamaño se verifican juntos en pantalla a 390 px.
- Se verificaron guardado repetido sin duplicados, conservación tras recargar, fallo simulado de almacenamiento sin falso éxito, navegación de vuelta y restauración del foco al cerrar el menú.
- Durante el desarrollo se corrigieron una expectativa de URL de la prueba nueva y una ambigüedad entre los accesos al carrito del editor anterior y la nueva notificación. Las pruebas afectadas se volvieron a ejecutar.
- La prueba antigua de transición de escritorio consultaba la fase y el título en viajes separados al navegador; a veces la animación avanzaba entre ambos. Ahora registra el estado en el instante en que comienza la animación del título. Pasó al comprobar que ninguno empieza bajo la cortina.
- No existe un comando de lint en este proyecto.

Límites: emulación Chromium/Edge en Windows, no pruebas en un teléfono físico ni Safari/iOS real. El teclado se conserva nativo; no se midieron FPS ni consumo de batería en hardware móvil. Los pagos y envíos del recorrido automatizado utilizan servicios simulados, sin cobros reales ni pedidos enviados a producción.
