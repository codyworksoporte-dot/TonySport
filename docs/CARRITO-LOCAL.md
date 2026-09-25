# Carrito de solicitudes de Tony

El carrito reúne equipos configurados en el paso Revisión. Cada entrada contiene la cantidad, el equipo, la nómina, las tallas, las preferencias de confección, la técnica, los colores, las capas del diseño y una copia de las imágenes cargadas.

No representa compras confirmadas, cobros o reservas. Los precios, impuestos, pagos y confirmación comercial siguen pendientes. El precio se muestra como «Por cotizar», nunca como cero.

## Persistencia y límites

- IndexedDB independiente: `tony-cart-v1`, object store `items`, clave `id`.
- Esquema de almacenamiento 1. Pedido e imágenes se escriben en una sola transacción.
- Máximo seis diseños, 20 MB de imágenes por diseño y 60 MB en conjunto.
- SHA-256 del contenido evita añadir dos veces la misma revisión exacta.
- Un error de cuota o lectura no sustituye el carrito anterior. Los datos desconocidos o incompletos se rechazan y se ofrece reintentar.
- El borrador del editor usa otra base; restablecerlo o cambiar sus imágenes no modifica los snapshots del carrito.
- El evento `tony:cart-changed` actualiza los componentes del mismo documento. Otra pestaña recibe una señal de localStorage sin datos del cliente. Al volver a una pestaña visible también se relee IndexedDB.
- La información sólo está en ese navegador. Borrar los datos del sitio también borra el carrito. No hay sincronización de cuentas ni backend.
- El contador del header consulta únicamente `count()` mediante `useCartCount`: navegar por contenido no deserializa todas las imágenes. Comparte las señales de actualización y el manejo de errores con la vista completa.

`lib/cart.ts` exporta `CartItem`, `loadCart`, `addCartItem`, `removeCartItem`, `useCart`, `cartError` y `CART_EVENT`. `useCart` es de cliente y devuelve `{items, loading, error, refresh}`. Un `CartItem` no debe etiquetarse como una compra en otras vistas.

## Interacciones

El carrito permite ver frente/espalda con el mismo SVG del editor, descargar la vista PNG, originales, CSV y el resumen TXT. La cotización exige elegir una sucursal antes de ofrecer el enlace a su WhatsApp. No se envía ninguna solicitud automáticamente y los archivos deben adjuntarse manualmente.

Eliminar abre un diálogo nativo, con foco inicial en «Conservar diseño» y cierre con Escape. Sólo después de confirmar y completar el borrado de IndexedDB se reproduce el efecto del lagarto. El efecto decorativo dura 950 ms; no añade una segunda operación de borrado y se omite con movimiento reducido. Si falla la persistencia, el diseño permanece visible y se anuncia el error.

En móviles las vistas y detalles forman una sola columna; el resumen de cotización deja de estar fijo. La nómina tiene su propio contenedor desplazable.

## Verificación durante implementación

`npx tsc --noEmit --incremental false` terminó sin errores. La revisión integrada del proyecto comprobará el flujo de guardado, deduplicación, recarga, independencia del borrador, confirmación/cancelación, sucursal, errores y tamaños de pantalla.
