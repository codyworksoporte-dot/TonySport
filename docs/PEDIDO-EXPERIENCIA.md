# Pedido paso a paso y asesora 3D

La configuración muestra un grupo por pantalla: molde, tela, cuello, manga, marca y los dos acabados. El registro del equipo separa nombre, cantidad y cada jugador. Anterior conserva las respuestas. Los borradores nuevos guardan qué decisiones se han contestado; los anteriores siguen siendo compatibles.

Abrir `/configurador` inicia un pedido sin respuestas anteriores seleccionadas. El último borrador se recupera únicamente con Retomar último borrador (`?borrador=actual`) o desde el carrito (`?pedido=id`). Un inicio vacío no sobrescribe el último borrador: el guardado automático comienza al elegir el producto. La recuperación de un pago pendiente mantiene su flujo independiente para evitar duplicar cobros.

Antes de confirmar la cantidad, el panel muestra el precio por prenda y los recargos o descuentos elegidos, con el total pendiente y sin anticipo ni saldo. La cantidad empieza vacía y debe escribirse explícitamente. Al confirmarla se calcula el total estimado para esas prendas; las tallas pendientes se consideran sin recargo hasta elegirlas. El servicio de diseño propio se suma solamente después de subir una imagen propia, y su precio se informa junto al editor. El catálogo no tiene ese recargo de creación. El checkout conserva el cálculo definitivo y la validación del servidor.

El selector Gama baja / Gama alta guarda la preferencia en `tony:pedido:quality:v1`. Sin preferencia se usa la versión ligera, salvo cuando el navegador informa al menos 8 GB de memoria y 8 núcleos y no indica ahorro de datos o movimiento reducido. Esta detección es conservadora; el cliente siempre puede cambiarla.

Gama baja muestra instrucciones escritas y no monta el escenario ni descarga el GLB. Gama alta carga Three.js y el personaje bajo demanda. Durante las elecciones, el personaje aparece junto a las opciones en computadora y encima de ellas en móvil; en computadora permanece visible al desplazarse por las opciones. Hombre/Mujer usa dos filas compactas.

La narración está activada por defecto y utiliza las voces españolas disponibles en el navegador. Un único icono permite silenciar, reactivar o reintentar el sonido. Algunos navegadores requieren una interacción antes de reproducir voz: se reintenta una vez al siguiente gesto real en el pedido o al tocar el icono. El silencio manual se respeta durante los cambios de paso. Si faltan voces o WebGL, el pedido y la guía escrita siguen funcionando.

El modelo `public/assets/advisor/tony-advisor.glb` (3.03 MB, 14,478 triángulos) fue generado con Tripo a partir de la referencia de la asesora Tony. `tony-advisor-reference.png` conserva la referencia de producción. El rig del sitio mueve hombros, codos y cabeza; no contiene rig facial ni sincronización de labios. Los gestos acompañan el estado de reproducción de voz.

El escenario limita la resolución a DPR 1.5 y la animación a 30 fps. Deja de animar al quedar fuera de pantalla, ocultarse la pestaña o usar la preferencia de movimiento reducido del sistema. Cambiar a Gama baja libera el escenario WebGL y detiene la voz.

Validación: TypeScript, compilación de GitHub Pages y pruebas Playwright de navegación, conservación de respuestas, modos de rendimiento, carga y fallo del modelo, voz, accesibilidad y checkout simulado. Las pruebas no cobran ni envían pedidos reales.
