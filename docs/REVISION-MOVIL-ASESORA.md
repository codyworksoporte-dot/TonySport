# Asesora y navegación móvil — 28 de septiembre de 2026

Seguimiento de las capturas del propietario. Se conserva la estructura del proyecto, el diseño de escritorio, el contenido comercial y la lógica de pedidos. No se modificaron backend, autenticación, precios, pagos, datos de productos ni puntos.

## Correcciones

- El filtro de voces exigía nombres femeninos conocidos y descartaba voces españolas de nombre genérico, habituales en Android. Además, `male` coincidía dentro de `female`. Ahora se prefieren las voces femeninas reconocibles, se admiten voces españolas sin género identificado y se siguen descartando nombres masculinos reconocidos. No se afirma conocer el género de una voz genérica.
- Se atiende la llegada tardía de voces con `voiceschanged`, comprobación inicial y al reintentar. Los errores de reproducción y el bloqueo de audio permiten activar la lectura directamente con un toque en **Escuchar guía**. Si no hay una voz utilizable, se mantiene la guía escrita y el botón de reintento, sin afirmar que el teléfono carece de voz femenina.
- Se cancelan las locuciones al salir de la página, ocultar la pestaña, silenciar u ocultar la asesora. No se acumulan suscripciones entre visitas. La animación de voz responde al estado del reproductor.
- **No quiero asesora** tiene fondo y borde visibles. Los controles de la tarjeta ocupan todo su ancho en móvil, con áreas de al menos 44 px y foco visible. **Atrás** también tiene tratamiento de botón en el pie del pedido, conservando la paleta y las formas existentes.
- Vuelve la transición entre apartados en móvil: una tarjeta compacta con Tony, un guiño y una línea de avance. Se activa al tocar enlaces internos, volver con el navegador y usar el logo para regresar a Inicio. No intercepta enlaces, bloquea acciones ni espera a que termine la animación para mostrar la página siguiente.
- La transición móvil no monta el escudo, las garras ni la textura de pantalla completa. Se detiene al pausar efectos, activar movimiento reducido u ocultar la pestaña. Los cambios rápidos reutilizan el mismo componente y limpian sus temporizadores.
- No se monta la ilustración del lagarto ambiental oculto en móvil; tampoco se crea el observador de la burbuja flotante de la asesora en esa vista.
- El logo oficial se sirve como WebP sin pérdida: **599.666 → 402.610 bytes**, ahorro de **197.056 bytes / 32,86 %** en ese recurso. Se compararon los canales de cada píxel visible y el alfa: **cero diferencias visibles**. Se conserva el PNG original. No se ha cambiado la ilustración, la resolución ni la geometría del logo.

## Archivos y ajustes

| Archivos | Función y parámetros |
| --- | --- |
| `lib/pedido/advisor.ts` | Preferencia de voz, normalización del idioma y alternativa española de nombre genérico. Los mensajes del pedido se conservan. |
| `components/pedido/useAdvisorSpeech.ts` | Control de voces, reproducción, errores y limpieza. Comprobación inicial: 1.500 ms; espera máxima sin señal de reproducción: 4.500 ms. |
| `components/pedido/PedidoAdvisor.tsx`, `advisor.css` | Controles, mensajes de disponibilidad, preferencia persistida y observador solo en escritorio. |
| `components/mobile-refinements.css` | Botones de la asesora de 44 px; Atrás de 48 px; distribución hasta 900 px. |
| `components/RouteTransition.tsx`, `route-transition.css` | Una transición coordinada con el cambio de ruta; variante compacta en pantalla de hasta 900 px o puntero táctil. |
| `lib/ambient-config.ts` | `transition.mobile`: entrada mínima 220 ms, guiño 260 ms, salida 180 ms. El límite de seguridad sigue en 3.200 ms. Son tiempos decorativos, no retrasos de navegación. |
| `components/AmbientExperience.tsx` | Montaje del arte ambiental únicamente fuera de la variante compacta. |
| `components/Brand.tsx`, `public/assets/tony-wordmark-transparent-v1.webp` | Recurso sin pérdida para el mismo logo. |
| `tests/advisor-mobile.spec.ts`, `tests/mobile-transition.spec.ts`, `tests/mobile.spec.ts`, `tests/pedido/advisor.spec.ts` | Regresiones de voz, navegación, controles táctiles y comportamiento previo. |

## Pruebas realizadas

- TypeScript sin errores; compilación de producción con `TONY_GITHUB_PAGES=true` y preparación de rutas completadas.
- **35 pruebas E2E distintas aprobadas** entre las ejecuciones y sus repeticiones: 9 de asesora móvil, 3 de transición móvil, 8 de la revisión móvil previa, 8 de efectos, 6 de intro y 1 del recorrido de asesora/configuración.
- **7 pruebas unitarias de asesora aprobadas**: instrucciones por paso, reglas previas, montos leídos y selección de voces.
- Voces simuladas: nombre genérico de Android, nombre femenino conocido, lista inicialmente vacía, llegada tardía, permiso de reproducción denegado, error del sintetizador, ausencia de respuesta y ausencia de API. La simulación comprueba el control de la aplicación, no la calidad acústica de cada dispositivo.
- Accesibilidad automatizada de la tarjeta y objetivos táctiles a **320, 390 y 768 px**. Ocultar la asesora conserva la elección al recargar. Al salir se elimina la suscripción de voces; al volver hay una sola.
- Guardar en carrito, errores de almacenamiento, arrastre táctil, deshacer, herramientas del editor, menú, búsqueda y movimiento reducido continúan pasando sus pruebas.
- **90 vistas de la exportación final**: 18 rutas a 320, 390, 430, 768 y 1440 px. Sin desbordamiento horizontal, imágenes rotas ni errores JavaScript. Comprobación adicional de seis rutas y navegación de GitHub Pages aprobada.
- Revisión visual en navegador: tarjeta de asesora y navegación real de Inicio a Tony News sobre la exportación estática. Las pruebas de transición registran las fases durante la navegación, verifican que no se cubra la página y prueban pausa, reducción de movimiento y navegación rápida.
- Se corrigió una preparación de prueba que sobrescribía la preferencia al recargar. Otra ejecución chocó al guardar trazas porque dos comandos compartían el directorio de resultados; la prueba de tablet se repitió aislada con su propio directorio y pasó. Ninguno de esos dos fallos era de la aplicación.
- No hay comando de lint configurado en este proyecto.

Las capturas locales de comprobación están en `output/mobile-advisor-after.png` y `output/mobile-transition-after.png`; los archivos de `output/` no se publican en Git.

Límites: comprobaciones en Chromium/Edge con emulación de tamaño y entrada táctil en Windows; no se dispone del teléfono físico del propietario ni de Safari/iOS real. No se midieron FPS ni batería en hardware móvil. Se informa la reducción de bytes del logo, no un porcentaje global de aceleración de la web. No se hicieron cobros ni envíos reales de pedidos.

Referencia de la API utilizada: [voces disponibles en el dispositivo](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [metadatos de voz](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice) y [errores de reproducción](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance/error_event).
